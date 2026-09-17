import hashlib
from dataclasses import replace

import pytest

from bom_ocr.config import LabConfig
from bom_ocr.pipeline import extract_image
from bom_ocr.recognition import FakeRecognizer, Recognition, RecognitionError
from tests.support.synthetic_table import synthetic_table

DATA = ["04B", "PUNCH FORMING", "Ø30X58", "SKD11", "2", "58-60"]
HEADER = ["NO.", "DESC", "SIZE", "MATL", "QT'Y", "HARDNESS"]


def run(tmp_path, rows, *, header="absent", columns=6):
    source = tmp_path / "table.png"
    synthetic_table(columns, len(rows) - (header != "absent"), header=header).save(source)
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    result = extract_image(
        source, FakeRecognizer(Recognition(text, 0.99) for row in rows for text in row)
    )
    assert hashlib.sha256(source.read_bytes()).hexdigest() == before
    assert sorted(p.name for p in tmp_path.iterdir()) == ["table.png"]
    return result


def test_bottom_header_is_excluded_and_rows_preserve_source_order(tmp_path):
    result = run(tmp_path, [DATA, ["S1", *DATA[1:]], HEADER], header="bottom")
    assert result.success
    assert result.table.header_location == "bottom"
    assert [row.cells["no"].value for row in result.rows] == ["04B", "S1"]
    assert [row.source_row_index for row in result.rows] == [0, 1]
    assert result.rows[0].cells["dimension"].value == "Ø30x58"
    assert result.rows[0].cells["dimension"].raw == "Ø30X58"
    assert all(row.status == "ready_for_review" for row in result.rows)


def test_invalid_qty_is_retained_with_warning_and_no_guess(tmp_path):
    result = run(tmp_path, [[*DATA[:4], "1O", DATA[5]]])
    assert result.success
    assert result.rows[0].cells["qty"].value is None
    assert result.rows[0].status == "needs_review"
    assert "invalid_qty" in {w.code for w in result.rows[0].warnings}


def test_optional_remark_dashes_and_blank_row(tmp_path):
    result = run(tmp_path, [["-", *DATA[1:], "-"], [""] * 7], columns=7)
    assert len(result.rows) == 1
    assert result.rows[0].cells["remark"].value == "-"
    assert result.rows[0].cells["no"].value == "-"


@pytest.mark.parametrize("columns", [4, 8])
def test_unsupported_grid_returns_no_guessed_rows(tmp_path, columns):
    result = run(tmp_path, [["1"] * columns], columns=columns)
    assert not result.success
    assert not result.rows
    assert "unsupported_column_count" in {w.code for w in result.warnings}


def test_no_table_does_not_call_recognizer(tmp_path):
    from PIL import Image

    source = tmp_path / "blank.png"
    Image.new("RGB", (200, 100), "white").save(source)
    result = extract_image(source, FakeRecognizer([]))
    assert not result.success
    assert not result.rows
    assert result.warnings[0].code == "no_table"


def test_model_failure_cannot_return_partial_or_example_rows(tmp_path):
    class Broken:
        def recognize(self, image):
            raise RecognitionError("private-source-text")

    source = tmp_path / "table.png"
    synthetic_table().save(source)
    result = extract_image(source, Broken(), LabConfig())
    assert not result.success
    assert result.rows == ()
    assert result.warnings[0].code == "recognition_failed"
    assert "private-source-text" not in result.to_json()


def test_invalid_image_returns_sanitized_failure(tmp_path):
    source = tmp_path / "bad.png"
    source.write_bytes(b"corrupt")
    result = extract_image(source, FakeRecognizer([]))
    assert not result.success
    assert not result.rows
    assert result.warnings[0].code == "invalid_image"


def test_ambiguous_header_flags_retained_rows(tmp_path):
    result = run(tmp_path, [["NO", "DESC", "?", "MATERIAL", "QTY", "HRC"], DATA])
    assert result.success
    assert all(row.status == "needs_review" for row in result.rows)
    assert result.warnings[0].code == "ambiguous_header"


def test_cropped_table_warning_reaches_all_rows_even_with_lower_review_threshold(tmp_path):
    source = tmp_path / "clipped.png"
    synthetic_table(6, 3).crop((0, 0, 624, 217)).save(source)
    reader = FakeRecognizer([Recognition(text, 0.99) for _ in range(3) for text in DATA])
    result = extract_image(source, reader, replace(LabConfig(), review_grid_confidence=0.8))
    assert result.success
    assert len(result.rows) == 3
    assert "cropped_table_border" in {w.code for w in result.warnings}
    for row in result.rows:
        assert row.status == "needs_review"
        assert "cropped_table_border" in {w.code for w in row.warnings}
