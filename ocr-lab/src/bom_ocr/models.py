"""Immutable, provider-neutral OCR contracts and explicit JSON serialization."""

from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Any, Literal

CellValue = str | int | None
HeaderLocation = Literal["top", "bottom", "absent", "ambiguous"]
RowStatus = Literal["ready_for_review", "needs_review"]


def _confidence(value: float, name: str = "confidence") -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a finite number from 0 to 1")
    if not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError(f"{name} must be a finite number from 0 to 1")


def _nonnegative_integer(value: int, name: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{name} must be a nonnegative integer")


def _freeze_json(value: Any) -> Any:
    """Copy JSON-shaped structures so nested caller-owned data cannot mutate us."""
    if isinstance(value, Mapping):
        if any(not isinstance(key, str) for key in value):
            raise ValueError("JSON object keys must be strings")
        return MappingProxyType({key: _freeze_json(item) for key, item in value.items()})
    if isinstance(value, (list, tuple)):
        return tuple(_freeze_json(item) for item in value)
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float) and math.isfinite(value):
        return value
    raise ValueError("Metadata must contain only finite JSON values")


def _thaw_json(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: _thaw_json(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [_thaw_json(item) for item in value]
    return value


def _json_text(data: dict[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False, allow_nan=False, indent=2, sort_keys=True)


@dataclass(frozen=True, slots=True)
class BoundingBox:
    left: int | float
    top: int | float
    right: int | float
    bottom: int | float

    def __post_init__(self) -> None:
        coordinates = (self.left, self.top, self.right, self.bottom)
        if any(
            isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or v < 0
            for v in coordinates
        ):
            raise ValueError("Bounding box coordinates must be finite and nonnegative")
        if self.right <= self.left or self.bottom <= self.top:
            raise ValueError("Bounding box must have positive width and height")

    def to_dict(self) -> dict[str, int | float]:
        return {"left": self.left, "top": self.top, "right": self.right, "bottom": self.bottom}


@dataclass(frozen=True, slots=True)
class Grid:
    horizontal: tuple[int, ...]
    vertical: tuple[int, ...]
    confidence: float
    cropped_sides: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        _confidence(self.confidence)
        sides = tuple(self.cropped_sides)
        if any(side not in {"left", "right", "top", "bottom"} for side in sides) or len(
            set(sides)
        ) != len(sides):
            raise ValueError("Grid cropped sides must be unique source-edge names")
        object.__setattr__(self, "cropped_sides", sides)
        for name in ("horizontal", "vertical"):
            boundaries = tuple(getattr(self, name))
            if len(boundaries) < 2:
                raise ValueError("Grid needs at least two boundaries in each direction")
            for boundary in boundaries:
                _nonnegative_integer(boundary, "Grid boundary")
            if any(a >= b for a, b in zip(boundaries, boundaries[1:], strict=False)):
                raise ValueError("Grid boundaries must be strictly increasing")
            object.__setattr__(self, name, boundaries)

    @property
    def column_count(self) -> int:
        return len(self.vertical) - 1

    @property
    def row_count(self) -> int:
        return len(self.horizontal) - 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "horizontal": list(self.horizontal),
            "vertical": list(self.vertical),
            "confidence": self.confidence,
        }


@dataclass(frozen=True, slots=True)
class Warning:
    code: str
    message: str
    field: str | None = None
    row: int | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.code, str) or not self.code:
            raise ValueError("Warning code must be a nonempty string")
        if not isinstance(self.message, str) or not self.message:
            raise ValueError("Warning message must be a nonempty string")
        if self.field is not None and not isinstance(self.field, str):
            raise ValueError("Warning field must be a string")
        if self.row is not None:
            _nonnegative_integer(self.row, "Warning row")

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"code": self.code, "message": self.message}
        if self.field is not None:
            result["field"] = self.field
        if self.row is not None:
            result["row"] = self.row
        return result


@dataclass(frozen=True, slots=True)
class RecognizedCell:
    raw: str
    value: CellValue
    confidence: float
    bbox: BoundingBox

    def __post_init__(self) -> None:
        _confidence(self.confidence)
        if not isinstance(self.raw, str):
            raise ValueError("Cell raw text must be a string")
        if self.value is not None and (
            isinstance(self.value, bool) or not isinstance(self.value, (str, int))
        ):
            raise ValueError("Cell value must be a string, integer, or null")
        if not isinstance(self.bbox, BoundingBox):
            raise ValueError("Cell bbox must be a BoundingBox")

    def to_dict(self) -> dict[str, Any]:
        return {
            "raw": self.raw,
            "value": self.value,
            "confidence": self.confidence,
            "bbox": self.bbox.to_dict(),
        }


@dataclass(frozen=True, slots=True)
class BomRow:
    index: int
    cells: Mapping[str, RecognizedCell]
    warnings: tuple[Warning, ...] = ()
    status: RowStatus = "ready_for_review"
    source_row_index: int | None = None

    def __post_init__(self) -> None:
        _nonnegative_integer(self.index, "Row index")
        if self.source_row_index is not None:
            _nonnegative_integer(self.source_row_index, "Source row index")
        if self.status not in ("ready_for_review", "needs_review"):
            raise ValueError("Row status must remain review-only")
        if any(
            not isinstance(key, str) or not isinstance(cell, RecognizedCell)
            for key, cell in self.cells.items()
        ):
            raise ValueError("Row cells must map field names to RecognizedCell values")
        warnings = tuple(self.warnings)
        if any(not isinstance(warning, Warning) for warning in warnings):
            raise ValueError("Row warnings must be Warning values")
        object.__setattr__(self, "cells", MappingProxyType(dict(self.cells)))
        object.__setattr__(self, "warnings", warnings)
        if warnings:
            object.__setattr__(self, "status", "needs_review")

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "index": self.index,
            "status": self.status,
            "cells": {key: value.to_dict() for key, value in self.cells.items()},
            "warnings": [warning.to_dict() for warning in self.warnings],
        }
        if self.source_row_index is not None:
            result["sourceRowIndex"] = self.source_row_index
        return result


@dataclass(frozen=True, slots=True)
class SourceMetadata:
    filename: str
    width: int
    height: int

    def __post_init__(self) -> None:
        if not isinstance(self.filename, str):
            raise ValueError("Source filename must be a string")
        _nonnegative_integer(self.width, "Source width")
        _nonnegative_integer(self.height, "Source height")

    def to_dict(self) -> dict[str, Any]:
        return {"filename": self.filename, "width": self.width, "height": self.height}


@dataclass(frozen=True, slots=True)
class TableMetadata:
    column_count: int
    header_location: HeaderLocation
    confidence: float

    def __post_init__(self) -> None:
        _confidence(self.confidence)
        _nonnegative_integer(self.column_count, "Column count")
        if self.column_count == 0:
            raise ValueError("Table must have at least one column")
        if self.header_location not in ("top", "bottom", "absent", "ambiguous"):
            raise ValueError("Unknown header location")

    def to_dict(self) -> dict[str, Any]:
        return {
            "columnCount": self.column_count,
            "headerLocation": self.header_location,
            "confidence": self.confidence,
        }


@dataclass(frozen=True, slots=True)
class ArtifactPaths:
    annotated_image: str | None = None
    result_json: str | None = None
    diagnostics_json: str | None = None

    def __post_init__(self) -> None:
        if any(
            value is not None and not isinstance(value, str)
            for value in (self.annotated_image, self.result_json, self.diagnostics_json)
        ):
            raise ValueError("Artifact paths must be strings or null")

    def to_dict(self) -> dict[str, str]:
        return {
            key: value
            for key, value in (
                ("annotatedImage", self.annotated_image),
                ("resultJson", self.result_json),
                ("diagnosticsJson", self.diagnostics_json),
            )
            if value is not None
        }


@dataclass(frozen=True, slots=True)
class ExtractionResult:
    success: bool
    source: SourceMetadata
    table: TableMetadata | None = None
    rows: tuple[BomRow, ...] = ()
    warnings: tuple[Warning, ...] = ()
    artifacts: ArtifactPaths = field(default_factory=ArtifactPaths)
    provider: str = field(default="local_bom_ocr", init=False)
    schema_version: int = field(default=1, init=False)

    def __post_init__(self) -> None:
        rows = tuple(self.rows)
        warnings = tuple(self.warnings)
        if not isinstance(self.success, bool):
            raise ValueError("Extraction success must be a boolean")
        if not self.success and rows:
            raise ValueError("A failed extraction cannot contain data rows")
        if not isinstance(self.source, SourceMetadata):
            raise ValueError("Extraction source must be SourceMetadata")
        if self.table is not None and not isinstance(self.table, TableMetadata):
            raise ValueError("Extraction table must be TableMetadata or null")
        if any(not isinstance(row, BomRow) for row in rows):
            raise ValueError("Extraction rows must be BomRow values")
        if any(not isinstance(warning, Warning) for warning in warnings):
            raise ValueError("Extraction warnings must be Warning values")
        if not isinstance(self.artifacts, ArtifactPaths):
            raise ValueError("Extraction artifacts must be ArtifactPaths")
        object.__setattr__(self, "rows", rows)
        object.__setattr__(self, "warnings", warnings)

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "provider": self.provider,
            "schemaVersion": self.schema_version,
            "source": self.source.to_dict(),
            "table": self.table.to_dict() if self.table else None,
            "rows": [row.to_dict() for row in self.rows],
            "warnings": [warning.to_dict() for warning in self.warnings],
            "artifacts": self.artifacts.to_dict(),
        }

    def to_json(self) -> str:
        return _json_text(self.to_dict())


@dataclass(frozen=True, slots=True)
class BenchmarkMetrics:
    image_count: int
    table_detection: float | None
    row_recall: float | None
    row_precision: float | None
    cell_accuracy: float | None
    field_accuracy: Mapping[str, float | None]
    warning_coverage: float | None
    p50_seconds: float
    p95_seconds: float
    peak_memory_bytes: int
    deterministic: bool
    raw_counts: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        _nonnegative_integer(self.image_count, "Image count")
        _nonnegative_integer(self.peak_memory_bytes, "Peak memory bytes")
        for name in (
            "table_detection",
            "row_recall",
            "row_precision",
            "cell_accuracy",
            "warning_coverage",
        ):
            value = getattr(self, name)
            if value is not None:
                _confidence(value, name)
        for value in self.field_accuracy.values():
            if value is not None:
                _confidence(value, "field_accuracy")
        for value in (self.p50_seconds, self.p95_seconds):
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
                or value < 0
            ):
                raise ValueError("Benchmark durations must be finite and nonnegative")
        if not isinstance(self.deterministic, bool):
            raise ValueError("Benchmark determinism must be a boolean")
        object.__setattr__(self, "field_accuracy", _freeze_json(self.field_accuracy))
        object.__setattr__(self, "raw_counts", _freeze_json(self.raw_counts))

    def to_dict(self) -> dict[str, Any]:
        return {
            "imageCount": self.image_count,
            "tableDetection": self.table_detection,
            "rowRecall": self.row_recall,
            "rowPrecision": self.row_precision,
            "cellAccuracy": self.cell_accuracy,
            "fieldAccuracy": _thaw_json(self.field_accuracy),
            "warningCoverage": self.warning_coverage,
            "p50Seconds": self.p50_seconds,
            "p95Seconds": self.p95_seconds,
            "peakMemoryBytes": self.peak_memory_bytes,
            "deterministic": self.deterministic,
            "rawCounts": _thaw_json(self.raw_counts),
        }


@dataclass(frozen=True, slots=True)
class BenchmarkReport:
    metrics: BenchmarkMetrics
    passed: bool
    failures: tuple[str, ...]
    environment: Mapping[str, Any]
    thresholds: Mapping[str, Any]
    mismatches: tuple[Mapping[str, Any], ...] = ()
    evidence: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not isinstance(self.metrics, BenchmarkMetrics) or not isinstance(self.passed, bool):
            raise ValueError("Benchmark report requires metrics and a boolean gate status")
        failures = tuple(self.failures)
        if any(not isinstance(value, str) for value in failures):
            raise ValueError("Benchmark failures must be strings")
        if self.passed and failures:
            raise ValueError("A passing benchmark cannot contain gate failures")
        object.__setattr__(self, "failures", failures)
        for name in ("environment", "thresholds", "mismatches", "evidence"):
            object.__setattr__(self, name, _freeze_json(getattr(self, name)))

    def to_dict(self) -> dict[str, Any]:
        return {
            "metrics": self.metrics.to_dict(),
            "passed": self.passed,
            "failures": list(self.failures),
            "environment": _thaw_json(self.environment),
            "thresholds": _thaw_json(self.thresholds),
            "mismatches": _thaw_json(self.mismatches),
            "evidence": _thaw_json(self.evidence),
        }

    def to_json(self) -> str:
        return _json_text(self.to_dict())
