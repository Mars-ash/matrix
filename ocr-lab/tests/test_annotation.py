import json
from pathlib import Path

import pytest
from PIL import Image

from bom_ocr.annotation import OutputPathError, validate_output_path, write_artifacts
from bom_ocr.models import ExtractionResult, SourceMetadata, Warning


def test_output_outside_lab_is_refused_unless_deliberate_override(tmp_path):
    with pytest.raises(OutputPathError):
        validate_output_path(tmp_path)
    assert validate_output_path(tmp_path, allow_outside=True) == tmp_path.resolve()
    lab = Path(__file__).resolve().parents[1]
    assert validate_output_path(lab / "output" / "demo") == lab / "output" / "demo"
    with pytest.raises(OutputPathError):
        validate_output_path(lab / "output" / ".." / "fixtures")


def test_failed_parse_writes_red_diagnostic_and_empty_result(tmp_path):
    source = tmp_path / "source.png"
    Image.new("RGB", (200, 100), "white").save(source)
    result = ExtractionResult(
        False,
        SourceMetadata(source.name, 200, 100),
        warnings=(Warning("no_table", "No usable grid."),),
    )
    output = tmp_path / "out"
    updated = write_artifacts(source, result, output, allow_outside=True)
    assert {p.name for p in output.iterdir()} == {
        "result.json",
        "annotated.png",
        "diagnostics.json",
    }
    assert json.loads((output / "result.json").read_text())["rows"] == []
    assert updated.artifacts.annotated_image
    with Image.open(output / "annotated.png") as overlay:
        assert overlay.size == (200, 100)
        r, g, b = overlay.convert("RGB").getpixel((2, 2))
        assert r > g and r > b


def test_artifact_output_must_not_overwrite_input(tmp_path):
    source = tmp_path / "annotated.png"
    Image.new("RGB", (200, 100), "white").save(source)
    original = source.read_bytes()
    result = ExtractionResult(False, SourceMetadata(source.name, 200, 100))
    with pytest.raises(OutputPathError):
        write_artifacts(source, result, tmp_path, allow_outside=True)
    assert source.read_bytes() == original
