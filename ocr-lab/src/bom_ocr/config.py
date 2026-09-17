"""Explicit local runtime limits and benchmark thresholds; no model loading."""

from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from pathlib import Path


def _default_cache() -> Path:
    configured = os.environ.get("BOM_OCR_MODEL_CACHE")
    return Path(configured) if configured else Path(__file__).resolve().parents[2] / "model-cache"


def _explicit_model_directory() -> Path | None:
    configured = os.environ.get("BOM_OCR_MODEL_DIR")
    return Path(configured) if configured else None


def _positive_integer(value: int, name: str, *, allow_zero: bool = False) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value < (0 if allow_zero else 1):
        raise ValueError(f"{name} must be {'nonnegative' if allow_zero else 'positive'} integer")


def _rate(value: float, name: str) -> None:
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or not 0 <= value <= 1
    ):
        raise ValueError(f"{name} must be a finite number from 0 to 1")


@dataclass(frozen=True, slots=True)
class LabConfig:
    max_file_bytes: int = 10 * 1024 * 1024
    max_dimension: int = 8192
    max_pixels: int = 24_000_000
    max_long_edge: int = 2048
    min_grid_confidence: float = 0.8
    review_grid_confidence: float = 0.9
    min_cell_confidence: float = 0.85
    line_tolerance: int = 3
    cell_padding: int = 4
    cell_scale: int = 2
    cpu_threads: int = 2
    model_name: str = "PP-OCRv5_mobile_rec"
    model_cache: Path = field(default_factory=_default_cache)
    thresholds: BenchmarkThresholds = field(default_factory=lambda: BenchmarkThresholds())
    _model_dir_override: Path | None = field(
        default_factory=_explicit_model_directory, init=False, repr=False
    )

    def __post_init__(self) -> None:
        for name in (
            "max_file_bytes",
            "max_dimension",
            "max_pixels",
            "max_long_edge",
            "cell_scale",
            "cpu_threads",
        ):
            _positive_integer(getattr(self, name), name)
        for name in ("line_tolerance", "cell_padding"):
            _positive_integer(getattr(self, name), name, allow_zero=True)
        for name in ("min_grid_confidence", "review_grid_confidence", "min_cell_confidence"):
            _rate(getattr(self, name), name)
        if self.review_grid_confidence < self.min_grid_confidence:
            raise ValueError("review_grid_confidence cannot be lower than min_grid_confidence")
        if not isinstance(self.model_name, str) or not self.model_name.strip():
            raise ValueError("model_name must be a nonempty model identifier")
        object.__setattr__(self, "model_cache", Path(self.model_cache))

    @property
    def model_dir(self) -> Path:
        return self._model_dir_override or self.model_cache / self.model_name


@dataclass(frozen=True, slots=True)
class BenchmarkThresholds:
    min_images: int = 20
    table_detection: float = 0.98
    row_recall: float = 0.98
    cell_accuracy: float = 0.95
    no_accuracy: float = 0.99
    qty_accuracy: float = 0.99
    p95_seconds: float = 20

    def __post_init__(self) -> None:
        _positive_integer(self.min_images, "min_images")
        for name in (
            "table_detection",
            "row_recall",
            "cell_accuracy",
            "no_accuracy",
            "qty_accuracy",
        ):
            _rate(getattr(self, name), name)
        if (
            isinstance(self.p95_seconds, bool)
            or not isinstance(self.p95_seconds, (int, float))
            or not math.isfinite(self.p95_seconds)
            or self.p95_seconds <= 0
        ):
            raise ValueError("p95_seconds must be finite and positive")

    def to_dict(self) -> dict[str, int | float]:
        return {
            "minImages": self.min_images,
            "tableDetection": self.table_detection,
            "rowRecall": self.row_recall,
            "cellAccuracy": self.cell_accuracy,
            "noAccuracy": self.no_accuracy,
            "qtyAccuracy": self.qty_accuracy,
            "p95Seconds": self.p95_seconds,
        }
