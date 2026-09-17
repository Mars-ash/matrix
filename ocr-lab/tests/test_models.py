import json
from dataclasses import FrozenInstanceError

import pytest

from bom_ocr.config import BenchmarkThresholds, LabConfig
from bom_ocr.models import (
    ArtifactPaths,
    BenchmarkMetrics,
    BenchmarkReport,
    BomRow,
    BoundingBox,
    ExtractionResult,
    Grid,
    RecognizedCell,
    SourceMetadata,
    TableMetadata,
    Warning,
)


def test_result_serialization_preserves_raw_normalized_and_coordinates():
    cell = RecognizedCell(" 04B ", "04B", 0.99, BoundingBox(1, 2, 30, 40))
    result = ExtractionResult(
        success=True,
        source=SourceMetadata("drawing.png", 120, 80),
        table=TableMetadata(6, "bottom", 0.97),
        rows=(BomRow(0, {"no": cell}, source_row_index=1),),
        artifacts=ArtifactPaths("annotated.png", "result.json", "diagnostics.json"),
    )

    serialized = result.to_json()
    data = json.loads(serialized)

    assert data == {
        "success": True,
        "provider": "local_bom_ocr",
        "schemaVersion": 1,
        "source": {"filename": "drawing.png", "width": 120, "height": 80},
        "table": {"columnCount": 6, "headerLocation": "bottom", "confidence": 0.97},
        "rows": [
            {
                "index": 0,
                "sourceRowIndex": 1,
                "status": "ready_for_review",
                "cells": {
                    "no": {
                        "raw": " 04B ",
                        "value": "04B",
                        "confidence": 0.99,
                        "bbox": {"left": 1, "top": 2, "right": 30, "bottom": 40},
                    }
                },
                "warnings": [],
            }
        ],
        "warnings": [],
        "artifacts": {
            "annotatedImage": "annotated.png",
            "resultJson": "result.json",
            "diagnosticsJson": "diagnostics.json",
        },
    }
    assert serialized == result.to_json()


def test_nested_contracts_copy_mutable_inputs_and_cannot_be_changed():
    cell = RecognizedCell("1", "1", 1, BoundingBox(0, 0, 1, 1))
    cells = {"no": cell}
    row_warnings = [Warning("low_confidence", "Review this cell.", "no", 0)]
    row = BomRow(0, cells, warnings=row_warnings)
    rows = [row]
    result = ExtractionResult(True, SourceMetadata("bom.png", 1, 1), rows=rows)
    cells.clear()
    rows.clear()
    row_warnings.clear()

    assert result.rows == (row,)
    assert row.cells["no"] == cell
    assert len(row.warnings) == 1
    assert row.status == "needs_review"
    with pytest.raises(TypeError):
        row.cells["qty"] = cell
    with pytest.raises(FrozenInstanceError):
        cell.raw = "2"


@pytest.mark.parametrize("confidence", [-0.01, 1.01, float("nan"), float("inf"), True])
def test_confidence_contract_rejects_nonfinite_or_out_of_range(confidence):
    with pytest.raises(ValueError, match="confidence"):
        RecognizedCell("1", "1", confidence, BoundingBox(0, 0, 1, 1))
    with pytest.raises(ValueError, match="confidence"):
        Grid((0, 1), (0, 1), confidence)
    with pytest.raises(ValueError, match="confidence"):
        TableMetadata(6, "absent", confidence)


@pytest.mark.parametrize(
    "bounds", [(0, 0, 0, 1), (0, 3, 1, 2), (-1, 0, 2, 2), (0, 0, float("inf"), 1)]
)
def test_bounding_box_rejects_invalid_geometry(bounds):
    with pytest.raises(ValueError):
        BoundingBox(*bounds)


def test_grid_copies_ordered_boundaries_and_exposes_counts():
    horizontal = [0, 10, 30]
    grid = Grid(horizontal, [0, 20, 40, 60], 0.9)
    horizontal.append(50)
    assert grid.horizontal == (0, 10, 30)
    assert grid.row_count == 2
    assert grid.column_count == 3


@pytest.mark.parametrize("boundaries", [(1,), (0, 1, 1), (0, 3, 2), (-1, 2)])
def test_grid_requires_strictly_ordered_positive_cell_geometry(boundaries):
    with pytest.raises(ValueError):
        Grid(boundaries, (0, 10), 1)


def test_structural_failure_serializes_without_fabricated_rows():
    result = ExtractionResult(
        False,
        SourceMetadata("bom.png", 0, 0),
        warnings=(Warning("no_table", "No usable grid was found."),),
    )
    data = result.to_dict()
    assert data["rows"] == []
    assert data["table"] is None
    assert data["warnings"] == [{"code": "no_table", "message": "No usable grid was found."}]
    assert data["artifacts"] == {}
    with pytest.raises(ValueError, match="failed"):
        ExtractionResult(False, SourceMetadata("bom.png", 1, 1), rows=(BomRow(0, {}),))


def test_benchmark_report_is_deeply_immutable_and_serializes_unavailable_rates():
    raw_counts = {"qty": {"expected": 0, "extra": 2}}
    evidence = {"coverage": ["six_columns"], "no_egress": False}
    metrics = BenchmarkMetrics(
        image_count=1,
        table_detection=1,
        row_recall=0,
        row_precision=0,
        cell_accuracy=None,
        field_accuracy={"qty": None},
        warning_coverage=None,
        p50_seconds=1.1,
        p95_seconds=1.2,
        peak_memory_bytes=2048,
        deterministic=True,
        raw_counts=raw_counts,
    )
    report = BenchmarkReport(metrics, False, ("corpus_too_small",), {}, {}, evidence=evidence)
    raw_counts["qty"]["expected"] = 99
    evidence["coverage"].append("seven_columns")
    data = report.to_dict()
    assert data["metrics"]["fieldAccuracy"] == {"qty": None}
    assert data["metrics"]["rawCounts"]["qty"] == {"expected": 0, "extra": 2}
    assert data["evidence"]["coverage"] == ["six_columns"]
    assert json.loads(report.to_json()) == data
    with pytest.raises(TypeError):
        report.metrics.raw_counts["qty"]["expected"] = 1


def test_runtime_and_benchmark_defaults_are_explicit_and_model_cache_configurable(
    monkeypatch, tmp_path
):
    monkeypatch.delenv("BOM_OCR_MODEL_DIR", raising=False)
    monkeypatch.setenv("BOM_OCR_MODEL_CACHE", str(tmp_path / "models"))
    config = LabConfig()
    assert config.model_cache == tmp_path / "models"
    assert config.model_dir == tmp_path / "models" / "PP-OCRv5_mobile_rec"
    monkeypatch.setenv("BOM_OCR_MODEL_DIR", str(tmp_path / "explicit-model"))
    assert LabConfig().model_dir == tmp_path / "explicit-model"
    assert config.max_file_bytes == 10 * 1024 * 1024
    assert (config.max_dimension, config.max_pixels, config.max_long_edge) == (
        8192,
        24_000_000,
        2048,
    )
    assert (
        config.min_grid_confidence,
        config.review_grid_confidence,
        config.min_cell_confidence,
    ) == (0.8, 0.9, 0.85)
    assert (config.line_tolerance, config.cell_padding, config.cell_scale, config.cpu_threads) == (
        3,
        4,
        2,
        2,
    )
    assert config.model_name == "PP-OCRv5_mobile_rec"
    thresholds = BenchmarkThresholds()
    assert config.thresholds == thresholds
    assert thresholds.to_dict() == {
        "minImages": 20,
        "tableDetection": 0.98,
        "rowRecall": 0.98,
        "cellAccuracy": 0.95,
        "noAccuracy": 0.99,
        "qtyAccuracy": 0.99,
        "p95Seconds": 20,
    }


@pytest.mark.parametrize(
    "kwargs",
    [
        {"max_file_bytes": 0},
        {"min_cell_confidence": float("nan")},
        {"review_grid_confidence": 0.7},
        {"cell_scale": 0},
        {"cpu_threads": -1},
    ],
)
def test_invalid_runtime_configuration_fails_early(kwargs):
    with pytest.raises(ValueError):
        LabConfig(**kwargs)
