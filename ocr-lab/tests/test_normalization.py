import pytest

from bom_ocr.normalization import normalize_value


@pytest.mark.parametrize(
    ("field", "raw", "expected"),
    [
        ("description", "  PUNCH\n  FORMING\t ", "PUNCH FORMING"),
        ("remark", "  GUIDE   ONLY ", "GUIDE ONLY"),
        ("no", "10A", "10A"),
        ("no", "04B", "04B"),
        ("no", "S1", "S1"),
        ("no", " 001 ", "001"),
        ("no", "-", "-"),
        ("dimension", "45x250x330", "45x250x330"),
        ("dimension", " 45 X 250 X 330 ", "45x250x330"),
        ("dimension", "45 × 250 ✕ 330", "45x250x330"),
        ("dimension", "45ｘ250Ｘ330", "45x250x330"),
        ("dimension", "⌀30 X 58", "Ø30x58"),
        ("dimension", "ø 30×58", "Ø30x58"),
        ("dimension", "Φ30x58", "Ø30x58"),
        ("dimension", "φ30x58", "Ø30x58"),
        ("dimension", "MYAP32-200", "MYAP32-200"),
        ("dimension", "MAX32-200", "MAX32-200"),
        ("dimension", "X30", "X30"),
        ("dimension", "AB32X50", "AB32X50"),
        ("material", "SS400", "SS400"),
        ("material", "S50C", "S50C"),
        ("material", "SKD11", "SKD11"),
        ("material", "SKS3", "SKS3"),
        ("material", "STD", "STD"),
        ("material", " skd11 ", "SKD11"),
        ("qty", "1", 1),
        ("qty", " 06 ", 6),
        ("hrc", "58-60", "58-60"),
        ("hrc", "58 - 60 hrc", "58-60 HRC"),
        ("hrc", "35–40", "35-40"),
        ("hrc", "35—40", "35-40"),
        ("hrc", " 58HRC ", "58 HRC"),
        ("hrc", "-", "-"),
    ],
)
def test_normalization_only_applies_supported_equivalence(field, raw, expected):
    assert normalize_value(field, raw) == expected


@pytest.mark.parametrize(
    "raw", ["", " ", "-", "0", "-1", "+1", "1.0", "1,000", "1 2", "O", "1O", "1/2", "two", "١", "²"]
)
def test_quantity_never_guesses_an_invalid_or_ambiguous_value(raw):
    assert normalize_value("qty", raw) is None


@pytest.mark.parametrize(
    "field", ["no", "description", "dimension", "material", "qty", "hrc", "remark"]
)
def test_empty_input_has_no_invented_fallback(field):
    assert normalize_value(field, " \t\n") is None


def test_unrecognized_field_is_rejected():
    with pytest.raises(ValueError, match="field"):
        normalize_value("invented", "text")


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("1R / 1L", "1R / 1L"),
        ("1R/1L", "1R / 1L"),
        ("2L / 3R", "2L / 3R"),
        (" 02R / 01L ", "02R / 01L"),
    ],
)
def test_sided_quantity_preserves_counts_labels_and_order(raw, expected):
    assert normalize_value("qty", raw) == expected


@pytest.mark.parametrize(
    "raw",
    [
        "0R/1L",
        "1R/0L",
        "1R/1R",
        "1L/2L",
        "1R/",
        "1/1L",
        "1R+1L",
        "1R/1l",
        "1R/1L/1R",
        "1 R / 1 L",
        "1.5R/1L",
    ],
)
def test_sided_quantity_does_not_guess_missing_or_ambiguous_labels(raw):
    assert normalize_value("qty", raw) is None
