import math
import sys
from dataclasses import replace
from types import SimpleNamespace

import numpy as np
import pytest

from bom_ocr.config import LabConfig
from bom_ocr.recognition import (
    FakeRecognizer,
    PaddleCellRecognizer,
    Recognition,
    RecognitionError,
    _create_model,
)


@pytest.fixture(autouse=True)
def clear_shared_model(monkeypatch):
    monkeypatch.setattr(PaddleCellRecognizer, "_shared_model", None)
    monkeypatch.setattr(PaddleCellRecognizer, "_shared_profile", None)


def test_fake_reads_ordered_cells_and_refuses_fabricated_fallback():
    fake = FakeRecognizer([Recognition("04B", 0.99), Recognition("-", 0.9)])
    cell = np.zeros((20, 80, 3), dtype=np.uint8)
    assert fake.recognize(cell).text == "04B"
    assert fake.recognize(cell).text == "-"
    with pytest.raises(RecognitionError):
        fake.recognize(cell)


@pytest.mark.parametrize("score", [-0.1, 1.1, math.nan, math.inf])
def test_recognition_rejects_invalid_confidence(score):
    with pytest.raises(ValueError):
        Recognition("text", score)


def test_model_loading_is_lazy_and_missing_cache_never_downloads(tmp_path):
    recognizer = PaddleCellRecognizer(replace(LabConfig(), model_cache=tmp_path))
    assert recognizer.loaded is False
    with pytest.raises(RecognitionError, match="local model"):
        recognizer.recognize(np.zeros((20, 80, 3), dtype=np.uint8))
    assert list(tmp_path.iterdir()) == []


def test_cpu_model_is_shared_and_receives_arrays_only(monkeypatch):
    loads = []
    calls = []

    class Model:
        def predict(self, *, input, batch_size):
            calls.append((input, batch_size))
            return [{"rec_text": "SS400", "rec_score": 0.97}]

    def load(config):
        loads.append(config)
        return Model()

    monkeypatch.setattr("bom_ocr.recognition._create_model", load)
    first = PaddleCellRecognizer(LabConfig())
    second = PaddleCellRecognizer(LabConfig())
    crop = np.full((20, 80, 3), 255, dtype=np.uint8)
    assert first.recognize(crop) == Recognition("SS400", 0.97)
    assert second.recognize(crop).text == "SS400"
    assert len(loads) == 1
    assert all(isinstance(call[0], np.ndarray) and call[1] == 1 for call in calls)


def test_inference_failure_does_not_leak_document_text(monkeypatch):
    class Model:
        def predict(self, **kwargs):
            raise RuntimeError("secret-customer-drawing-content")

    monkeypatch.setattr("bom_ocr.recognition._create_model", lambda config: Model())
    with pytest.raises(RecognitionError) as raised:
        PaddleCellRecognizer().recognize(np.zeros((20, 80, 3), dtype=np.uint8))
    assert "secret-customer" not in str(raised.value)


def test_cached_model_uses_verified_cpu_acceleration(tmp_path, monkeypatch):
    config = replace(LabConfig(), model_cache=tmp_path)
    config.model_dir.mkdir(parents=True)
    for name in ("inference.json", "inference.pdiparams", "inference.yml"):
        (config.model_dir / name).touch()
    constructor_arguments = []
    model = object()

    def construct(**kwargs):
        constructor_arguments.append(kwargs)
        return model

    monkeypatch.setitem(sys.modules, "paddleocr", SimpleNamespace(TextRecognition=construct))
    assert _create_model(config) is model
    assert constructor_arguments == [
        {
            "model_name": config.model_name,
            "model_dir": str(config.model_dir),
            "device": "cpu",
            "enable_hpi": False,
            "enable_mkldnn": True,
            "cpu_threads": 2,
        }
    ]


@pytest.mark.model
def test_cpu_model_smoke_with_synthetic_text():
    from PIL import Image, ImageDraw, ImageFont

    image = Image.new("RGB", (320, 64), "white")
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 32)
    ImageDraw.Draw(image).text((12, 10), "SS400", fill="black", font=font)
    result = PaddleCellRecognizer().recognize(np.asarray(image))
    assert result.text.strip()
    assert 0 <= result.confidence <= 1
