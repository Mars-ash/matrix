import pytest

from bom_ocr.schema import UnsupportedColumnCount, schema_for_column_count, select_header

DATA = ["04B", "PUNCH FORMING", "30x50", "SKD11", "2", "58-60"]
HEADER = ["NO", "DESCRIPTION", "DIMENSION", "MATERIAL", "QTY", "HRC"]


def test_schemas_have_only_approved_ordered_fields():
    assert schema_for_column_count(6) == (
        "no",
        "description",
        "dimension",
        "material",
        "qty",
        "hrc",
    )
    assert schema_for_column_count(7) == (*schema_for_column_count(6), "remark")


@pytest.mark.parametrize("count", [0, 1, 5, 8, 10])
def test_unsupported_column_count_exposes_structural_warning(count):
    with pytest.raises(UnsupportedColumnCount) as raised:
        schema_for_column_count(count)
    assert raised.value.warning.code == "unsupported_column_count"


@pytest.mark.parametrize(
    "header",
    [
        HEADER,
        ["NO.", "DESC", "SIZE", "MATL", "QT'Y", "HARDNESS"],
        ["NUMBER", "DESCRIPTION", "DIMENSION", "MATERIAL", "QUANTITY", "HRC"],
        [" no. ", " desc ", " SIZE", "matl", "QT’Y", "hardness"],
    ],
)
def test_top_header_full_ordered_synonyms_are_excluded(header):
    result = select_header([header, DATA], schema_for_column_count(6))
    assert result.location == "top"
    assert result.data_row_indices == (1,)
    assert result.warnings == ()


@pytest.mark.parametrize("remark", ["REMARK", "NOTES"])
def test_bottom_header_does_not_reverse_data_order(remark):
    result = select_header(
        [[*DATA, ""], ["S1", *DATA[1:], "-"], [*HEADER, remark]],
        schema_for_column_count(7),
    )
    assert result.location == "bottom"
    assert result.data_row_indices == (0, 1)


def test_no_header_retains_every_row_in_order():
    result = select_header([DATA, ["S1", *DATA[1:]]], schema_for_column_count(6))
    assert result.location == "absent"
    assert result.data_row_indices == (0, 1)
    assert result.warnings == ()


def test_technical_data_containing_one_header_word_is_not_removed():
    result = select_header([["1", "DESCRIPTION", *DATA[2:]]], schema_for_column_count(6))
    assert result.location == "absent"
    assert result.data_row_indices == (0,)
    assert result.warnings == ()


@pytest.mark.parametrize(
    "rows",
    [
        [HEADER, DATA, HEADER],
        [DATA, HEADER, DATA],
        [["NO", "DESC", "???", "MATERIAL", "QTY", "HRC"], DATA],
        [["DESCRIPTION", "NO", *HEADER[2:]], DATA],
    ],
)
def test_ambiguous_headers_are_flagged_and_preserved(rows):
    result = select_header(rows, schema_for_column_count(6))
    assert result.location == "ambiguous"
    assert result.data_row_indices == tuple(range(len(rows)))
    assert result.warnings[0].code == "ambiguous_header"


def test_empty_table_has_absent_header_and_no_data_rows():
    result = select_header([], schema_for_column_count(6))
    assert result.location == "absent"
    assert result.data_row_indices == ()
