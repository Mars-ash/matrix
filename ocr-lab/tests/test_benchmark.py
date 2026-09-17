"""Benchmark tests use generated local data, never real accuracy evidence."""

import csv
import importlib.util
import json
from dataclasses import replace

import pytest

FIELDS = ("no", "description", "dimension", "material", "qty", "hrc")
ROW = dict(zip(FIELDS, ("10A", "Guide Post", "Ø30x58", "S50C", 1, "58-60"), strict=True))


def api():
    assert importlib.util.find_spec("bom_ocr.benchmark") is not None, "Benchmark is not implemented"
    from bom_ocr import benchmark

    return benchmark


def corpus(tmp_path, rows=None, count=1, expected_failure=False, checked=True, coverage=None):
    root = tmp_path / "corpus"
    (root / "images").mkdir(parents=True, exist_ok=True)
    (root / "ground-truth").mkdir(exist_ok=True)
    for index in range(count):
        filename = f"bom-{index:02}.png"
        # Pairing tests deliberately do not decode image bytes.
        (root / "images" / filename).write_bytes(f"unique synthetic sample {index}".encode())
        truth = {
            "source": {"filename": filename},
            "schema": {"columnCount": 6, "headerLocation": "absent"},
            "humanChecked": checked,
            "expectedFailure": expected_failure,
            "coverage": coverage or ["six_columns", "header_absent"],
            "rows": [ROW.copy()] if rows is None else rows,
        }
        (root / "ground-truth" / f"bom-{index:02}.json").write_text(
            json.dumps(truth), encoding="utf-8"
        )
    return root


def result(path, rows=None, warnings=(), success=True, header="absent", row_warnings=()):
    from bom_ocr.models import (
        BomRow,
        BoundingBox,
        ExtractionResult,
        RecognizedCell,
        SourceMetadata,
        TableMetadata,
    )

    values = [ROW.copy()] if rows is None else rows
    return ExtractionResult(
        success,
        SourceMetadata(path.name, 100, 100),
        table=TableMetadata(6, header, 1) if success else None,
        rows=tuple(
            BomRow(
                index,
                {
                    field: RecognizedCell(
                        "" if value is None else str(value), value, 1, BoundingBox(0, 0, 10, 10)
                    )
                    for field, value in row.items()
                },
                warnings=row_warnings,
            )
            for index, row in enumerate(values)
        ),
        warnings=warnings,
    )


def run(root, extract=None, **kwargs):
    from bom_ocr.config import LabConfig

    return api().run_benchmark(root, extract or result, LabConfig(), **kwargs)


def test_missing_truth_is_rejected_before_extraction(tmp_path):
    root = corpus(tmp_path)
    (root / "ground-truth" / "bom-00.json").unlink()
    with pytest.raises(ValueError, match="pair|truth"):
        api().load_corpus(root)


@pytest.mark.parametrize("extra", ["orphan.png", "README.txt", "bom-00.jpg"])
def test_unknown_or_duplicate_images_are_rejected(tmp_path, extra):
    root = corpus(tmp_path)
    (root / "images" / extra).write_bytes(b"extra")
    with pytest.raises(ValueError, match="pair|unsupported|duplicate"):
        api().load_corpus(root)


def test_extra_truth_and_nested_image_directories_are_rejected(tmp_path):
    root = corpus(tmp_path)
    (root / "ground-truth" / "orphan.json").write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="pair"):
        api().load_corpus(root)
    (root / "ground-truth" / "orphan.json").unlink()
    (root / "images" / "nested").mkdir()
    with pytest.raises(ValueError, match="file|directory"):
        api().load_corpus(root)


@pytest.mark.parametrize("filename", ["../bom-00.png", "..\\bom-00.png", "C:\\bom-00.png"])
def test_truth_source_cannot_traverse_paths(tmp_path, filename):
    root = corpus(tmp_path)
    path = root / "ground-truth" / "bom-00.json"
    truth = json.loads(path.read_text())
    truth["source"]["filename"] = filename
    path.write_text(json.dumps(truth), encoding="utf-8")
    with pytest.raises(ValueError, match="filename"):
        api().load_corpus(root)


def test_truth_requires_complete_canonical_rows_and_real_boolean_check(tmp_path):
    root = corpus(tmp_path, rows=[{"qty": 1}], checked="yes")
    with pytest.raises(ValueError, match="humanChecked|fields"):
        api().load_corpus(root)


def test_normalized_field_accuracy_is_separate_for_each_critical_field(tmp_path):
    root = corpus(tmp_path)
    actual = ROW | {"dimension": " Ø30 X 58 ", "material": "s50c", "qty": 2}
    report = run(root, lambda path: result(path, [actual]))
    assert report.metrics.field_accuracy == {
        "no": 1,
        "description": 1,
        "dimension": 1,
        "material": 1,
        "qty": 0,
        "hrc": 1,
        "remark": None,
    }
    assert report.metrics.cell_accuracy == pytest.approx(5 / 6)
    assert report.metrics.raw_counts["fields"]["qty"] == {
        "expected": 1,
        "correct": 0,
        "extra": 0,
    }
    assert "qty_accuracy" in report.failures
    assert any(item["field"] == "qty" for item in report.mismatches)


def test_rows_are_positional_with_duplicate_ids_and_empty_rows_excluded(tmp_path):
    second = ROW | {"description": "Different"}
    empty = dict.fromkeys(FIELDS, None)
    root = corpus(tmp_path, rows=[ROW, empty, second])
    report = run(root, lambda path: result(path, [second, empty, ROW]))
    assert report.metrics.row_recall == 0
    assert report.metrics.row_precision == 0
    assert report.metrics.raw_counts["expectedRows"] == 2
    assert report.metrics.raw_counts["returnedRows"] == 2


def test_missing_rows_keep_expected_field_denominators(tmp_path):
    root = corpus(tmp_path, rows=[ROW, ROW | {"no": "04B"}])
    report = run(root)
    assert report.metrics.row_recall == 0.5
    assert report.metrics.row_precision == 1
    assert report.metrics.field_accuracy["no"] == 0.5
    assert report.metrics.raw_counts["fields"]["qty"]["expected"] == 2


def test_extra_rows_reduce_precision_and_cannot_pass_silently(tmp_path):
    root = corpus(tmp_path)
    report = run(root, lambda path: result(path, [ROW, ROW | {"no": "extra"}]))
    assert report.metrics.row_recall == 1
    assert report.metrics.row_precision == 0.5
    assert report.metrics.raw_counts["fields"]["no"]["extra"] == 1
    assert "extra_output" in report.failures
    assert any(item["kind"] == "extra_row" for item in report.mismatches)


def test_extra_cells_do_not_inflate_empty_field_denominators(tmp_path):
    root = corpus(tmp_path, rows=[ROW | {"hrc": ""}])
    report = run(root)
    assert report.metrics.field_accuracy["hrc"] is None
    assert report.metrics.raw_counts["fields"]["hrc"]["extra"] == 1
    assert "extra_output" in report.failures


def test_negative_images_are_separate_from_positive_table_detection(tmp_path):
    from bom_ocr.models import Warning

    root = corpus(tmp_path, count=2)
    truth_path = root / "ground-truth" / "bom-01.json"
    truth = json.loads(truth_path.read_text())
    truth.update(expectedFailure=True, rows=[], coverage=["difficult", "hard_failure"])
    truth_path.write_text(json.dumps(truth), encoding="utf-8")

    def extract(path):
        if path.stem == "bom-01":
            return result(path, [], (Warning("no_table", "No table."),), success=False)
        return result(path)

    report = run(root, extract)
    assert report.metrics.table_detection == 1
    assert report.metrics.raw_counts["positiveImages"] == 1
    assert report.metrics.raw_counts["negativeImages"] == 1
    assert report.metrics.raw_counts["negativePassed"] == 1
    assert report.metrics.warning_coverage == 1


def test_known_bad_unflagged_output_fails_warning_gate(tmp_path):
    root = corpus(tmp_path)
    report = run(root, lambda path: result(path, [ROW | {"qty": 2}]))
    assert report.metrics.warning_coverage == 0
    assert "warning_coverage" in report.failures


def test_known_bad_flagged_output_and_explicit_warning_requirements(tmp_path):
    from bom_ocr.models import Warning

    root = corpus(tmp_path)
    truth_path = root / "ground-truth" / "bom-00.json"
    truth = json.loads(truth_path.read_text())
    truth["warnings"] = [{"rowIndex": 0, "codes": ["low_confidence"]}]
    truth_path.write_text(json.dumps(truth), encoding="utf-8")
    warning = Warning("low_confidence", "Review quantity.", "qty", 0)
    report = run(root, lambda path: result(path, [ROW | {"qty": 2}], row_warnings=(warning,)))
    assert report.metrics.warning_coverage == 1
    assert "warning_coverage" not in report.failures


def test_repeat_values_and_warnings_must_be_stable(tmp_path):
    root = corpus(tmp_path)
    calls = 0

    def extract(path):
        nonlocal calls
        calls += 1
        return result(path, [ROW | {"qty": calls}])

    report = run(root, extract, repeat=3)
    assert calls == 4  # One global warmup, then three measured repeats.
    assert not report.metrics.deterministic
    assert "determinism" in report.failures


def test_a_single_repeat_is_not_determinism_evidence(tmp_path):
    report = run(corpus(tmp_path), repeat=1)
    assert not report.metrics.deterministic
    assert "determinism" in report.failures


def test_missing_human_coverage_and_no_egress_evidence_fail_gate(tmp_path):
    report = run(corpus(tmp_path, count=20, checked=False))
    assert not report.passed
    assert {"human_checked", "representative_coverage", "no_egress"} <= set(report.failures)
    assert report.metrics.image_count == 20
    assert report.environment["maxLongEdge"] == 2048
    assert report.environment["modelProfile"] == "PP-OCRv5_mobile_rec"
    assert report.environment["cpuAcceleration"] == "oneDNN"
    assert report.metrics.peak_memory_bytes > 0


def test_duplicate_image_content_does_not_count_as_twenty_unique_samples(tmp_path):
    root = corpus(tmp_path, count=20)
    duplicate = (root / "images" / "bom-00.png").read_bytes()
    for path in (root / "images").iterdir():
        path.write_bytes(duplicate)
    report = run(root)
    assert report.evidence["uniqueImages"] == 1
    assert "unique_images" in report.failures


def test_nearest_rank_latency_excludes_warmup(tmp_path, monkeypatch):
    module = api()
    clock = iter([0, 1, 10, 13, 20, 22])
    monkeypatch.setattr(module.time, "perf_counter", lambda: next(clock))
    report = run(corpus(tmp_path), repeat=3)
    assert report.metrics.p50_seconds == 2
    assert report.metrics.p95_seconds == 3


def test_warmup_uses_a_positive_table_when_first_image_is_a_negative_case(tmp_path):
    from bom_ocr.models import Warning

    root = corpus(tmp_path, count=2)
    truth_path = root / "ground-truth" / "bom-00.json"
    truth = json.loads(truth_path.read_text())
    truth.update(expectedFailure=True, rows=[])
    truth_path.write_text(json.dumps(truth), encoding="utf-8")
    calls = []

    def extract(path):
        calls.append(path.stem)
        if path.stem == "bom-00":
            return result(path, [], (Warning("no_table", "No table."),), success=False)
        return result(path)

    run(root, extract)
    assert calls[0] == "bom-01"


def test_report_serialization_and_csv_formula_protection(tmp_path):
    report = run(corpus(tmp_path))
    report = replace(
        report,
        mismatches=(
            {
                "source": "=HYPERLINK(1)",
                "rowIndex": 0,
                "field": "description",
                "expected": " +SUM(1)",
                "actual": "@unsafe",
                "kind": "cell",
            },
        ),
    )
    paths = api().write_report(report, tmp_path / "reports")
    assert {path.name for path in paths.values()} == {
        "report.json",
        "report.md",
        "field-metrics.csv",
        "mismatches.csv",
    }
    assert json.loads(paths["reportJson"].read_text(encoding="utf-8")) == report.to_dict()
    with paths["mismatches"].open(encoding="utf-8", newline="") as stream:
        row = next(csv.DictReader(stream))
    assert row["source"].startswith("'")
    assert row["expected"].startswith("'")
    assert row["actual"].startswith("'")
    assert "FAIL" in paths["reportMarkdown"].read_text(encoding="utf-8")


def test_clean_twenty_sample_representative_corpus_with_evidence_can_pass(tmp_path):
    from bom_ocr.models import Warning

    module = api()
    root = corpus(tmp_path, count=20, coverage=list(module.REQUIRED_COVERAGE))
    negative_path = root / "ground-truth" / "bom-19.json"
    truth = json.loads(negative_path.read_text())
    truth.update(expectedFailure=True, rows=[])
    negative_path.write_text(json.dumps(truth), encoding="utf-8")

    def extract(path):
        if path.stem == "bom-19":
            return result(path, [], (Warning("no_table", "No table."),), success=False)
        return result(path, row_warnings=(Warning("low_confidence", "Review."),))

    report = run(root, extract, no_egress_evidence="TEST ONLY: synthetic isolated callback")
    assert report.passed, report.failures
    assert report.failures == ()


def test_expected_failure_requires_warning_and_empty_output(tmp_path):
    root = corpus(tmp_path, rows=[], expected_failure=True, coverage=["hard_failure", "difficult"])
    report = run(root, lambda path: result(path, [], success=False))
    assert "negative_cases" in report.failures
    assert "warning_coverage" in report.failures


def test_extra_row_with_invalid_raw_quantity_is_counted_even_when_values_are_null(tmp_path):
    from bom_ocr.models import Warning

    root = corpus(tmp_path)

    def extract(path):
        response = result(path, [ROW, dict.fromkeys(FIELDS)])
        extra = response.rows[1]
        cells = dict(extra.cells)
        cells["qty"] = replace(cells["qty"], raw="1O")
        extra = replace(extra, cells=cells, warnings=(Warning("invalid_qty", "Review.", "qty", 1),))
        return replace(response, rows=(response.rows[0], extra))

    report = run(root, extract)
    assert report.metrics.raw_counts["returnedRows"] == 2
    assert report.metrics.raw_counts["extraRows"] == 1
    assert report.metrics.row_precision == 0.5
    assert "extra_output" in report.failures
    assert any(m["kind"] == "extra_row" and m["actual"] == "1O" for m in report.mismatches)


@pytest.mark.parametrize("failure_phase", ["write", "publish"])
def test_incomplete_report_never_leaves_pass_summaries(tmp_path, monkeypatch, failure_phase):
    from pathlib import Path

    # Force a PASS contract to test publishing, independently of metric computation.
    report = replace(run(corpus(tmp_path)), passed=True, failures=())
    directory = tmp_path / "reports"
    paths = api().write_report(report, directory)
    original_open, original_replace = Path.open, Path.replace

    def fail_open(path, mode="r", *args, **kwargs):
        if path.name == "field-metrics.csv" and "w" in mode:
            raise PermissionError("Simulated report staging failure")
        return original_open(path, mode, *args, **kwargs)

    def fail_replace(path, target):
        if Path(target).name == "mismatches.csv":
            raise PermissionError("Simulated report publication failure")
        return original_replace(path, target)

    monkeypatch.setattr(Path, "open", fail_open if failure_phase == "write" else original_open)
    monkeypatch.setattr(
        Path, "replace", fail_replace if failure_phase == "publish" else original_replace
    )
    with pytest.raises(PermissionError):
        api().write_report(report, directory)
    assert not paths["reportJson"].exists()
    assert not paths["reportMarkdown"].exists()
