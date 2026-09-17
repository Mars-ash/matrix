"""Strict private-corpus pairing and transparent, positional quality metrics."""

import csv
import hashlib
import importlib.metadata
import json
import math
import platform
import tempfile
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import psutil

from .config import BenchmarkThresholds, LabConfig
from .models import BenchmarkMetrics, BenchmarkReport, ExtractionResult
from .normalization import normalize_value
from .schema import schema_for_column_count

FIELDS = (*schema_for_column_count(6), "remark")
REQUIRED_COVERAGE = frozenset(
    {
        "six_columns",
        "seven_columns",
        "header_top",
        "header_bottom",
        "header_absent",
        "magenta_grid",
        "alphanumeric_ids",
        "s_prefix_id",
        "dash_id",
        "diameter",
        "dimension_separators",
        "hrc_ranges",
        "dash_values",
        "compression",
        "rotation",
        "crop_variation",
        "hard_failure",
    }
)


@dataclass(frozen=True)
class CorpusEntry:
    path: Path
    truth: dict
    digest: str


def load_corpus(corpus: Path | str) -> tuple[CorpusEntry, ...]:
    root = Path(corpus).resolve()
    image_dir, truth_dir = root / "images", root / "ground-truth"
    if not image_dir.is_dir() or not truth_dir.is_dir():
        raise ValueError("Corpus requires images and ground-truth directories with paired files.")
    images, truths = {}, {}
    for directory, found, extensions in (
        (image_dir, images, {".png", ".jpg", ".jpeg"}),
        (truth_dir, truths, {".json"}),
    ):
        if directory.is_symlink() or not directory.resolve().is_relative_to(root):
            raise ValueError("Corpus directory must remain inside the corpus.")
        for path in sorted(directory.iterdir()):
            if not path.is_file() or path.is_symlink():
                raise ValueError("Corpus directories must contain ordinary files only.")
            if path.suffix.lower() not in extensions:
                raise ValueError("Corpus contains an unsupported file.")
            key = path.stem.casefold()
            if key in found:
                raise ValueError("Corpus contains duplicate source stems.")
            found[key] = path
    if not images or images.keys() != truths.keys():
        raise ValueError("Every image must have exactly one same-stem ground-truth pair.")
    entries = []
    for stem, image in images.items():
        if image.stat().st_size > 10 * 1024 * 1024 or truths[stem].stat().st_size > 5 * 1024 * 1024:
            raise ValueError("Corpus image or ground-truth file exceeds its byte limit.")
        try:
            truth = json.loads(truths[stem].read_text(encoding="utf-8-sig"))
            filename = truth["source"]["filename"]
            if (
                not isinstance(filename, str)
                or "/" in filename
                or "\\" in filename
                or ":" in filename
                or filename != image.name
            ):
                raise ValueError("Ground-truth source filename must match its paired image.")
            schema = schema_for_column_count(truth["schema"]["columnCount"])
            if truth["schema"]["headerLocation"] not in {"top", "bottom", "absent"}:
                raise ValueError("Invalid ground-truth headerLocation.")
            if type(truth["humanChecked"]) is not bool:
                raise ValueError("humanChecked must be a boolean.")
            if type(truth.get("expectedFailure", False)) is not bool:
                raise ValueError("expectedFailure must be a boolean.")
            rows = truth["rows"]
            if not isinstance(rows, list) or any(
                not isinstance(row, dict) or set(row) != set(schema) for row in rows
            ):
                raise ValueError("Ground-truth rows must contain all canonical schema fields.")
            if any(
                isinstance(value, (dict, list, bool, float))
                for row in rows
                for value in row.values()
            ):
                raise ValueError("Ground-truth fields must be text, integer, or null.")
            if truth.get("expectedFailure") and rows:
                raise ValueError("Expected structural failures must have empty ground-truth rows.")
            coverage = truth.get("coverage", [])
            if not isinstance(coverage, list) or any(not isinstance(tag, str) for tag in coverage):
                raise ValueError("Ground-truth coverage must be a list of tags.")
            requirements = truth.get("warnings", [])
            if not isinstance(requirements, list):
                raise ValueError("Ground-truth warnings must be a list.")
            for requirement in requirements:
                if not isinstance(requirement, dict) or not isinstance(
                    requirement.get("codes"), list
                ):
                    raise ValueError("Warning expectations must contain code lists.")
                if not requirement["codes"] or any(
                    not isinstance(c, str) for c in requirement["codes"]
                ):
                    raise ValueError("Warning expectation codes must be nonempty strings.")
                index = requirement.get("rowIndex")
                if index is not None and (
                    type(index) is not int or index < 0 or index >= len(rows)
                ):
                    raise ValueError("Warning rowIndex must identify a ground-truth row.")
        except (KeyError, TypeError, json.JSONDecodeError) as error:
            raise ValueError(
                "Malformed ground-truth schema; check the documented template."
            ) from error
        entries.append(CorpusEntry(image, truth, hashlib.sha256(image.read_bytes()).hexdigest()))
    return tuple(entries)


def _canonical(row):
    return {
        field: normalize_value(field, "" if row.get(field) is None else str(row[field]))
        for field in FIELDS
    }


def _nonempty(row):
    return any(value is not None for value in row.values())


def _ratio(numerator, denominator):
    return numerator / denominator if denominator else None


def _signature(result):
    return {
        "success": result.success,
        "table": (result.table.column_count, result.table.header_location)
        if result.table
        else None,
        "rows": [
            {
                "values": {key: cell.value for key, cell in row.cells.items()},
                "status": row.status,
                "warnings": [(w.code, w.field, w.row) for w in row.warnings],
            }
            for row in result.rows
        ],
        "warnings": [(w.code, w.field, w.row) for w in result.warnings],
    }


class _PeakMemory:
    def __init__(self):
        self.process = psutil.Process()
        self.peak = 0
        self.stop = threading.Event()
        self.thread = threading.Thread(target=self._sample, daemon=True)

    def sample(self):
        info = self.process.memory_info()
        self.peak = max(self.peak, info.rss, getattr(info, "peak_wset", 0))

    def _sample(self):
        while not self.stop.wait(0.02):
            self.sample()

    def __enter__(self):
        self.sample()
        self.thread.start()
        return self

    def __exit__(self, *args):
        self.stop.set()
        self.thread.join()
        self.sample()


def run_benchmark(
    corpus: Path | str,
    extract: Callable[[Path], ExtractionResult],
    config: LabConfig,
    repeat: int = 3,
    no_egress_evidence: str | None = None,
) -> BenchmarkReport:
    if type(repeat) is not int or repeat < 1:
        raise ValueError("Repeat must be a positive integer.")
    entries = load_corpus(corpus)
    thresholds = getattr(config, "thresholds", BenchmarkThresholds())
    measured, durations = [], []
    deterministic = repeat >= 2
    with _PeakMemory() as memory:
        # A deliberate no-table probe never loads the recognizer. Warm a positive
        # table so alphabetically first negative cases cannot skew cold timing.
        warmup = next(
            (entry for entry in entries if not entry.truth.get("expectedFailure", False)),
            entries[0],
        )
        extract(warmup.path)  # One global warmup, excluded from measured latency.
        for entry in entries:
            reference = None
            for _ in range(repeat):
                started = time.perf_counter()
                result = extract(entry.path)
                durations.append(time.perf_counter() - started)
                if not isinstance(result, ExtractionResult):
                    raise ValueError("Extractor returned an unsupported result contract.")
                signature = _signature(result)
                if reference is None:
                    reference = signature
                    measured.append((entry, result))
                elif signature != reference:
                    deterministic = False
    fields = {field: {"expected": 0, "correct": 0, "extra": 0} for field in FIELDS}
    counts = {
        "positiveImages": 0,
        "negativeImages": 0,
        "negativePassed": 0,
        "detectedImages": 0,
        "expectedRows": 0,
        "returnedRows": 0,
        "correctRows": 0,
        "missingRows": 0,
        "extraRows": 0,
        "warningExpected": 0,
        "warningCovered": 0,
        "fields": fields,
    }
    mismatches, failures = [], []
    review_only = True
    for entry, result in measured:
        truth = entry.truth
        expected = [
            _canonical(row)
            for row in truth["rows"]
            if any(value is not None and str(value).strip() for value in row.values())
        ]
        actual_rows = [
            row
            for row in result.rows
            if any(cell.raw.strip() for cell in row.cells.values())
            or _nonempty(_canonical({key: cell.value for key, cell in row.cells.items()}))
        ]
        actual = [
            _canonical({key: cell.value for key, cell in row.cells.items()}) for row in actual_rows
        ]
        review_only &= all(
            row.status in {"ready_for_review", "needs_review"} for row in actual_rows
        )
        if truth.get("expectedFailure", False):
            counts["negativeImages"] += 1
            rejected = not result.success and not result.rows and bool(result.warnings)
            counts["negativePassed"] += rejected
            counts["warningExpected"] += 1
            counts["warningCovered"] += rejected
        else:
            counts["positiveImages"] += 1
            detected = bool(
                result.success
                and result.table
                and result.table.column_count == truth["schema"]["columnCount"]
            )
            counts["detectedImages"] += detected
            if result.table and result.table.header_location != truth["schema"]["headerLocation"]:
                failures.append("header_location")
            if not result.success:
                counts["warningExpected"] += 1
                counts["warningCovered"] += bool(result.warnings)
        counts["expectedRows"] += len(expected)
        counts["returnedRows"] += len(actual)
        counts["missingRows"] += max(0, len(expected) - len(actual))
        counts["extraRows"] += max(0, len(actual) - len(expected))
        for index in range(max(len(expected), len(actual))):
            want = expected[index] if index < len(expected) else dict.fromkeys(FIELDS)
            got = actual[index] if index < len(actual) else dict.fromkeys(FIELDS)
            correct = index < len(expected) and index < len(actual) and want == got
            counts["correctRows"] += correct
            mismatch = False
            for field in FIELDS:
                if want[field] is not None:
                    fields[field]["expected"] += 1
                    fields[field]["correct"] += want[field] == got[field]
                elif got[field] is not None:
                    fields[field]["extra"] += 1
                if want[field] != got[field]:
                    mismatch = True
                    kind = (
                        "extra_row"
                        if index >= len(expected)
                        else "missing_row"
                        if index >= len(actual)
                        else "cell"
                    )
                    mismatches.append(
                        {
                            "source": entry.path.name,
                            "rowIndex": index,
                            "field": field,
                            "expected": want[field],
                            "actual": got[field],
                            "kind": kind,
                        }
                    )
            if index >= len(expected) and not mismatch:
                # Invalid recognized text can normalize to null. It is still an
                # emitted extra row, never a fully blank row to discard.
                mismatch = True
                for field, cell in actual_rows[index].cells.items():
                    if not cell.raw.strip():
                        continue
                    fields[field]["extra"] += 1
                    mismatches.append(
                        {
                            "source": entry.path.name,
                            "rowIndex": index,
                            "field": field,
                            "expected": None,
                            "actual": cell.raw,
                            "kind": "extra_row",
                        }
                    )
            if mismatch:
                counts["warningExpected"] += 1
                flagged = bool(result.warnings) or (
                    index < len(actual_rows)
                    and bool(actual_rows[index].warnings)
                    and actual_rows[index].status == "needs_review"
                )
                counts["warningCovered"] += flagged
        for requirement in truth.get("warnings", []):
            index = requirement.get("rowIndex")
            present = (
                result.warnings
                if index is None
                else (actual_rows[index].warnings if index < len(actual_rows) else ())
            )
            counts["warningExpected"] += 1
            counts["warningCovered"] += set(requirement["codes"]) <= {w.code for w in present}
    durations.sort()

    def percentile(p: float) -> float:
        return durations[max(0, math.ceil(p * len(durations)) - 1)]

    metrics = BenchmarkMetrics(
        image_count=len(entries),
        table_detection=_ratio(counts["detectedImages"], counts["positiveImages"]),
        row_recall=_ratio(counts["correctRows"], counts["expectedRows"]),
        row_precision=_ratio(counts["correctRows"], counts["returnedRows"]),
        cell_accuracy=_ratio(
            sum(f["correct"] for f in fields.values()), sum(f["expected"] for f in fields.values())
        ),
        field_accuracy={key: _ratio(f["correct"], f["expected"]) for key, f in fields.items()},
        warning_coverage=_ratio(counts["warningCovered"], counts["warningExpected"]),
        p50_seconds=percentile(0.5),
        p95_seconds=percentile(0.95),
        peak_memory_bytes=memory.peak,
        deterministic=deterministic,
        raw_counts=counts,
    )
    coverage = set().union(*(set(e.truth.get("coverage", [])) for e in entries))
    unique = len({e.digest for e in entries})
    gates = {
        "corpus_too_small": len(entries) >= thresholds.min_images,
        "unique_images": unique >= thresholds.min_images,
        "human_checked": all(e.truth["humanChecked"] for e in entries),
        "representative_coverage": REQUIRED_COVERAGE <= coverage,
        "no_egress": bool(no_egress_evidence and no_egress_evidence.strip()),
        "determinism": deterministic,
        "review_only": review_only,
        "negative_cases": counts["negativeImages"] > 0
        and counts["negativePassed"] == counts["negativeImages"],
        "warning_coverage": metrics.warning_coverage is not None and metrics.warning_coverage == 1,
        "extra_output": counts["extraRows"] == 0 and not any(f["extra"] for f in fields.values()),
        "p95_latency": metrics.p95_seconds <= thresholds.p95_seconds,
    }
    for name, value, threshold in (
        ("table_detection", metrics.table_detection, thresholds.table_detection),
        ("row_recall", metrics.row_recall, thresholds.row_recall),
        ("cell_accuracy", metrics.cell_accuracy, thresholds.cell_accuracy),
        ("no_accuracy", metrics.field_accuracy["no"], thresholds.no_accuracy),
        ("qty_accuracy", metrics.field_accuracy["qty"], thresholds.qty_accuracy),
    ):
        gates[name] = value is not None and value >= threshold
    failures.extend(name for name, passed in gates.items() if not passed)
    failures = tuple(sorted(set(failures)))
    versions = {}
    for package in (
        "paddleocr",
        "paddlepaddle",
        "paddlex",
        "numpy",
        "opencv-contrib-python",
        "Pillow",
    ):
        try:
            versions[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            versions[package] = "unavailable"
    environment = {
        "python": platform.python_version(),
        "os": platform.platform(),
        "engine": "paddleocr",
        "versions": versions,
        "maxLongEdge": config.max_long_edge,
        "modelProfile": config.model_name,
        "cpuThreads": config.cpu_threads,
        "cpuAcceleration": "oneDNN",
        "latencyScope": "complete extraction, one warmup excluded; nearest-rank percentiles",
        "memoryMethod": (
            "process RSS sampled 20ms; Windows lifetime peak working set when available"
        ),
    }
    evidence = {
        "uniqueImages": unique,
        "coverage": sorted(coverage),
        "repeat": repeat,
        "noEgressEvidence": no_egress_evidence,
        "evidenceAuthority": "Human-provided OS isolation evidence; review before sign-off",
        "requiresHumanSignOff": True,
        "sources": [{"filename": e.path.name, "sha256": e.digest} for e in entries],
    }
    return BenchmarkReport(
        metrics,
        not failures,
        failures,
        environment,
        thresholds.to_dict(),
        tuple(mismatches),
        evidence,
    )


def _csv_value(value):
    text = "" if value is None else str(value)
    return "'" + text if text.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else text


def write_report(report: BenchmarkReport, directory: Path | str) -> dict[str, Path]:
    """Caller must validate the output root before running the benchmark."""
    directory = Path(directory)
    names = {
        "reportJson": "report.json",
        "reportMarkdown": "report.md",
        "fieldMetrics": "field-metrics.csv",
        "mismatches": "mismatches.csv",
    }
    paths = {key: directory / name for key, name in names.items()}
    if any(path.is_symlink() for path in paths.values()):
        raise ValueError("Report files must not be symlinks.")
    directory.mkdir(parents=True, exist_ok=True)
    # Invalidate earlier summaries for a reused run directory before starting.
    # Each report is authoritative only once all four artifacts are published.
    summaries = (paths["reportJson"], paths["reportMarkdown"])
    for path in summaries:
        path.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(prefix=".bom-report-", dir=directory) as temporary:
        staged = {key: Path(temporary) / name for key, name in names.items()}
        try:
            _write_report_files(report, staged)
            for key in ("fieldMetrics", "mismatches", "reportMarkdown", "reportJson"):
                staged[key].replace(paths[key])
        except BaseException:
            for path in summaries:
                path.unlink(missing_ok=True)
            raise
    return paths


def _write_report_files(report: BenchmarkReport, paths: dict[str, Path]) -> None:
    paths["reportJson"].write_text(report.to_json() + "\n", encoding="utf-8")
    metrics = report.metrics.to_dict()
    summary = [
        "# Local BOM OCR benchmark",
        "",
        f"Status: {'PASS' if report.passed else 'FAIL'}",
        "",
        "Human review and explicit integration sign-off are still required.",
        "",
        "| Metric | Value |",
        "| --- | --- |",
    ]
    summary.extend(
        f"| {name} | {metrics[name]} |"
        for name in (
            "imageCount",
            "tableDetection",
            "rowRecall",
            "rowPrecision",
            "cellAccuracy",
            "warningCoverage",
            "p50Seconds",
            "p95Seconds",
            "peakMemoryBytes",
            "deterministic",
        )
    )
    summary += ["", "## Gates requiring attention", ""]
    summary += [f"- {failure}" for failure in report.failures] or ["None."]
    summary += [
        "",
        "Positive table detection excludes explicitly expected negative images.",
        "Field accuracy uses expected nonempty cells; extra cells are separately penalized.",
        "Review report.json for all counts, runtime details, and supplied isolation evidence.",
    ]
    paths["reportMarkdown"].write_text("\n".join(summary) + "\n", encoding="utf-8")
    with paths["fieldMetrics"].open("w", newline="", encoding="utf-8") as stream:
        writer = csv.writer(stream)
        writer.writerow(["field", "expected", "correct", "extra", "accuracy"])
        for field, count in report.metrics.raw_counts["fields"].items():
            writer.writerow(
                [
                    field,
                    count["expected"],
                    count["correct"],
                    count["extra"],
                    report.metrics.field_accuracy[field],
                ]
            )
    with paths["mismatches"].open("w", newline="", encoding="utf-8") as stream:
        columns = ["source", "rowIndex", "field", "expected", "actual", "kind"]
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        for row in report.mismatches:
            writer.writerow({key: _csv_value(row.get(key)) for key in columns})
