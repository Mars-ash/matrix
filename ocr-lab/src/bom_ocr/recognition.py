"""Replaceable local cell recognition with explicit, pre-cached model assets."""

import math
import os
from collections.abc import Iterable
from dataclasses import dataclass
from threading import Lock
from typing import Protocol

import numpy as np

from .config import LabConfig
from .offline import network_disabled


class RecognitionError(RuntimeError):
    """Sanitized model availability/inference failure."""


@dataclass(frozen=True, slots=True)
class Recognition:
    text: str
    confidence: float

    def __post_init__(self):
        if (
            isinstance(self.confidence, bool)
            or not math.isfinite(self.confidence)
            or not 0 <= self.confidence <= 1
        ):
            raise ValueError("Invalid recognition confidence")


class CellRecognizer(Protocol):
    def recognize(self, image: np.ndarray) -> Recognition: ...


class FakeRecognizer:
    """Explicit test data only. Exhaustion is an error, never invented output."""

    def __init__(self, results: Iterable[Recognition]):
        self._results = iter(results)

    def recognize(self, image: np.ndarray) -> Recognition:
        try:
            return next(self._results)
        except StopIteration:
            raise RecognitionError("Test recognizer has no remaining cell results.") from None


def _create_model(config: LabConfig):
    model_dir = config.model_dir
    if not all(
        (model_dir / name).is_file()
        for name in ("inference.json", "inference.pdiparams", "inference.yml")
    ):
        raise RecognitionError("The local model cache is missing; run the approved model setup.")
    os.environ["PADDLE_PDX_CACHE_HOME"] = str(config.model_cache / "runtime")
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["PADDLE_HOME"] = str(config.model_cache / "paddle")
    # Local arrays only; model_dir is mandatory so SDK acquisition cannot be implicit.
    try:
        from paddleocr import TextRecognition

        return TextRecognition(
            model_name=config.model_name,
            model_dir=str(model_dir),
            device="cpu",
            enable_hpi=False,
            enable_mkldnn=True,
            cpu_threads=config.cpu_threads,
        )
    except Exception:
        raise RecognitionError("The local OCR model could not be initialized.") from None


class PaddleCellRecognizer:
    _shared_model = None
    _shared_profile = None
    _lock = Lock()

    def __init__(self, config: LabConfig | None = None):
        self.config = config or LabConfig()

    @property
    def loaded(self):
        return type(self)._shared_model is not None

    def recognize(self, image: np.ndarray) -> Recognition:
        if not isinstance(image, np.ndarray) or image.ndim != 3 or image.shape[2] != 3:
            raise RecognitionError("Recognition requires one RGB cell image.")
        cls = type(self)
        profile = (
            str(self.config.model_dir.resolve()),
            self.config.model_name,
            self.config.cpu_threads,
        )
        with cls._lock, network_disabled():
            if cls._shared_model is None:
                cls._shared_model = _create_model(self.config)
                cls._shared_profile = profile
            elif cls._shared_profile != profile:
                raise RecognitionError("Use a new process to change the loaded model profile.")
            try:
                # Paddle's numpy input follows OpenCV BGR conventions.
                output = list(
                    cls._shared_model.predict(
                        input=np.ascontiguousarray(image[:, :, ::-1]),
                        batch_size=1,
                    )
                )
                if len(output) != 1:
                    raise ValueError("Unexpected result count")
                result = output[0]
                return Recognition(str(result["rec_text"]), float(result["rec_score"]))
            except Exception:
                raise RecognitionError("Local cell recognition failed; review the image.") from None
