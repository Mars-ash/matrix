from dataclasses import replace

import pytest

from bom_ocr.config import LabConfig
from bom_ocr.models import BoundingBox, RecognizedCell
from bom_ocr.normalization import normalize_value
from bom_ocr.schema import schema_for_column_count
from bom_ocr.validation import mark_duplicate_item_numbers, validate_row

SCHEMA = schema_for_column_count(7)


def cells_for(**overrides):
    raw = {
        "no": "04B",
        "description": "PUNCH FORMING",
        "dimension": "30x50",
        "material": "SKD11",
        "qty": "2",
        "hrc": "58-60",
        "remark": "",
    }
    raw.update(overrides)
    return {
        field: RecognizedCell(text, normalize_value(field, text), 0.99, BoundingBox(0, 0, 10, 10))
        for field, text in raw.items()
    }


def warnings_for(cells, table_confidence=0.99):
    return validate_row(0, cells, SCHEMA, table_confidence, LabConfig())


def test_clean_row_with_empty_optional_remark_remains_review_only():
    row = warnings_for(cells_for())
    assert row.status == "ready_for_review"
    assert row.warnings == ()
    assert row.cells["remark"].value is None


@pytest.mark.parametrize("qty", ["", "0", "1O", "1.0", "-", "+1"])
def test_invalid_or_missing_quantity_requires_review(qty):
    row = warnings_for(cells_for(qty=qty))
    assert row.status == "needs_review"
    assert any(warning.code == "invalid_qty" and warning.field == "qty" for warning in row.warnings)
    assert row.cells["qty"].value is None


@pytest.mark.parametrize("field", ["no", "description", "dimension", "material", "hrc"])
def test_missing_required_values_are_flagged_without_fallback(field):
    row = warnings_for(cells_for(**{field: ""}))
    assert row.status == "needs_review"
    assert any(
        warning.code == "missing_required_value" and warning.field == field
        for warning in row.warnings
    )
    assert row.cells[field].value is None


def test_low_confidence_in_required_cell_and_table_compose_warnings():
    cells = cells_for()
    cells["no"] = replace(cells["no"], confidence=0.5)
    row = warnings_for(cells, 0.81)
    assert row.status == "needs_review"
    assert [(warning.code, warning.field) for warning in row.warnings] == [
        ("low_confidence", None),
        ("low_confidence", "no"),
    ]
    assert all(warning.row == 0 for warning in row.warnings)


def test_optional_empty_remark_does_not_trigger_low_confidence():
    cells = cells_for()
    cells["remark"] = replace(cells["remark"], confidence=0)
    assert warnings_for(cells).warnings == ()


@pytest.mark.parametrize("item_no", ["10A", "04B", "S1", "-", "001", "2"])
def test_approved_item_number_patterns_pass(item_no):
    assert warnings_for(cells_for(no=item_no)).warnings == ()


@pytest.mark.parametrize("item_no", ["PUNCH", "1/2", "1?", "O4B", "١", "1 2"])
def test_unexpected_item_number_patterns_require_review(item_no):
    row = warnings_for(cells_for(no=item_no))
    assert any(
        warning.code == "unexpected_item_no" and warning.field == "no" for warning in row.warnings
    )


@pytest.mark.parametrize("change", ["missing", "extra", "wrong_key"])
def test_cell_count_or_schema_mismatch_is_structural_warning(change):
    cells = cells_for()
    if change in ("missing", "wrong_key"):
        del cells["dimension"]
    if change in ("extra", "wrong_key"):
        cells["unknown"] = cells["no"]
    row = warnings_for(cells)
    assert row.status == "needs_review"
    assert any(warning.code == "malformed_row" for warning in row.warnings)


@pytest.mark.parametrize(
    ("field", "raw", "code"),
    [
        ("dimension", "3Ox5?", "ambiguous_dimension"),
        ("dimension", "Ø3O", "ambiguous_dimension"),
        ("dimension", "030x58", "ambiguous_dimension"),
        ("dimension", "030", "ambiguous_dimension"),
        ("hrc", "58-6O", "ambiguous_hrc"),
        ("hrc", "60-58", "ambiguous_hrc"),
        ("hrc", "1?", "ambiguous_hrc"),
    ],
)
def test_ambiguous_dimension_or_hardness_is_retained_and_flagged(field, raw, code):
    row = warnings_for(cells_for(**{field: raw}))
    assert row.cells[field].raw == raw
    assert any(warning.code == code and warning.field == field for warning in row.warnings)


@pytest.mark.parametrize(
    "dimension", ["MYAP32-200", "MAX32-200", "AB32X50", "Ø30x58", "45x250x330", "0.5x30", "-"]
)
def test_valid_technical_dimension_codes_are_not_flagged(dimension):
    assert warnings_for(cells_for(dimension=dimension)).warnings == ()


def test_duplicates_flag_all_occurrences_preserve_order_and_leave_dash_ids_alone():
    inputs = (
        warnings_for(cells_for(no="04B")),
        replace(warnings_for(cells_for(no="-")), index=1),
        replace(warnings_for(cells_for(no="04B")), index=2),
        replace(warnings_for(cells_for(no="-")), index=3),
    )
    marked = mark_duplicate_item_numbers(inputs)
    assert [row.index for row in marked] == [0, 1, 2, 3]
    assert [row.status for row in marked] == [
        "needs_review",
        "ready_for_review",
        "needs_review",
        "ready_for_review",
    ]
    for index in (0, 2):
        assert marked[index].warnings[-1].code == "duplicate_item_no"
        assert marked[index].warnings[-1].field == "no"
        assert marked[index].warnings[-1].row == index
    assert inputs[0].warnings == ()
    assert mark_duplicate_item_numbers(marked) == marked


def test_distinct_leading_zero_ids_are_not_collapsed_into_duplicate_numbers():
    rows = (warnings_for(cells_for(no="04")), replace(warnings_for(cells_for(no="4")), index=1))
    assert all(row.status == "ready_for_review" for row in mark_duplicate_item_numbers(rows))


def test_sided_quantity_is_preserved_and_requires_explicit_review():
    row = warnings_for(cells_for(qty="1R/1L"))
    assert row.cells["qty"].raw == "1R/1L"
    assert row.cells["qty"].value == "1R / 1L"
    assert row.status == "needs_review"
    assert [(w.code, w.field) for w in row.warnings] == [("sided_quantity", "qty")]
