from dataclasses import replace

import numpy as np
import pytest
from PIL import Image, ImageDraw

from bom_ocr.config import LabConfig
from bom_ocr.grid import detect_grid
from bom_ocr.preprocessing import preprocess_image
from tests.support.synthetic_table import synthetic_table


def detect(tmp_path, image, config=None):
    path = tmp_path / "grid.png"
    image.save(path)
    config = config or LabConfig()
    prepared = preprocess_image(path, config)
    return prepared, detect_grid(prepared, config)


@pytest.mark.parametrize("columns", [6, 7])
@pytest.mark.parametrize("header", ["absent", "top", "bottom"])
@pytest.mark.parametrize("color", ["black", "#c000c0"])
def test_detects_six_seven_columns_independently_of_header_text(tmp_path, columns, header, color):
    _, result = detect(tmp_path, synthetic_table(columns, 3, header=header, color=color))
    assert result.grid is not None
    assert result.grid.column_count == columns
    assert result.grid.row_count == 3 + (header != "absent")
    assert result.grid.confidence >= LabConfig().min_grid_confidence
    assert tuple(sorted(set(result.grid.horizontal))) == result.grid.horizontal
    assert tuple(sorted(set(result.grid.vertical))) == result.grid.vertical


@pytest.mark.parametrize("thickness", [1, 3, 5])
def test_merges_thick_lines_and_handles_different_image_scale(tmp_path, thickness):
    _, result = detect(
        tmp_path,
        synthetic_table(7, 4, thickness=thickness, cell_width=170, cell_height=85),
    )
    assert result.grid is not None
    assert result.grid.column_count == 7
    assert result.grid.row_count == 4


def test_outer_border_at_image_crop_edge_does_not_add_fake_boundaries(tmp_path):
    image = synthetic_table(6, 3, thickness=3).crop((25, 25, 626, 194))
    _, result = detect(tmp_path, image)
    assert result.grid is not None
    assert result.grid.column_count == 6
    assert result.grid.row_count == 3
    assert result.grid.vertical[0] <= 2


@pytest.mark.parametrize("rotation", [-2.0, 1.5])
def test_deskew_detects_minor_rotation_and_preserves_inverse_coordinates(tmp_path, rotation):
    prepared, result = detect(tmp_path, synthetic_table(6, 4, rotation=rotation))
    assert result.grid is not None
    assert (result.grid.column_count, result.grid.row_count) == (6, 4)
    assert abs(prepared.deskew_degrees) > 0.5
    np.testing.assert_allclose(
        prepared.working_to_original @ prepared.original_to_working,
        np.eye(3),
        atol=1e-9,
    )


def test_missing_column_line_is_not_invented(tmp_path):
    _, result = detect(tmp_path, synthetic_table(6, 3, missing_vertical=3))
    assert result.grid is None
    assert "unsupported_column_count" in {warning.code for warning in result.warnings}


def test_missing_outer_border_fails_safely(tmp_path):
    _, result = detect(tmp_path, synthetic_table(6, 3, missing_vertical=0))
    assert result.grid is None
    assert result.warnings


def test_non_grid_image_reports_no_table(tmp_path):
    image = Image.new("RGB", (800, 400), "white")
    ImageDraw.Draw(image).text((80, 80), "Only text without a ruled table", fill="black")
    _, result = detect(tmp_path, image)
    assert result.grid is None
    assert {warning.code for warning in result.warnings} == {"no_table"}


def test_multiple_plausible_framed_tables_are_ambiguous(tmp_path):
    image = Image.new("RGB", (700, 550), "white")
    image.paste(synthetic_table(6, 3), (0, 0))
    image.paste(synthetic_table(6, 3), (0, 300))
    _, result = detect(tmp_path, image)
    assert result.grid is None
    assert {warning.code for warning in result.warnings} == {"ambiguous_table"}


def test_detection_threshold_is_distinct_from_review_threshold(tmp_path):
    config = replace(LabConfig(), min_grid_confidence=0.75, review_grid_confidence=0.99)
    image = synthetic_table(6, 3)
    draw = ImageDraw.Draw(image)
    draw.rectangle((320, 22, 337, 26), fill="white")
    _, result = detect(tmp_path, image, config)
    assert result.grid is not None
    assert result.grid.confidence >= config.min_grid_confidence
    assert result.grid.confidence < config.review_grid_confidence


def test_badly_broken_grid_is_rejected_before_ocr(tmp_path):
    image = synthetic_table(6, 3, text=False)
    draw = ImageDraw.Draw(image)
    draw.rectangle((80, 23, 560, 26), fill="white")
    _, result = detect(tmp_path, image)
    assert result.grid is None
    assert result.warnings


@pytest.mark.parametrize(
    ("columns", "erased"),
    [(6, (80, 79, 560, 82)), (7, (323, 60, 326, 170))],
)
def test_partial_internal_separator_cannot_silently_merge_cells(tmp_path, columns, erased):
    image = synthetic_table(columns, 3, text=False)
    ImageDraw.Draw(image).rectangle(erased, fill="white")
    _, result = detect(tmp_path, image)
    assert result.grid is None
    assert result.warnings


@pytest.mark.parametrize("columns", [6, 7])
@pytest.mark.parametrize(
    "sides", [("right",), ("bottom",), ("left", "right"), ("top", "bottom", "left")]
)
def test_table_cut_at_source_edges_retains_visible_cells_and_requires_review(
    tmp_path, columns, sides
):
    image = synthetic_table(columns, 4, text=False)
    image = image.crop(
        (
            26 if "left" in sides else 0,
            26 if "top" in sides else 0,
            24 + columns * 100 if "right" in sides else image.width,
            24 + 4 * 56 if "bottom" in sides else image.height,
        )
    )
    prepared, result = detect(tmp_path, image)
    assert result.grid is not None
    assert (result.grid.column_count, result.grid.row_count) == (columns, 4)
    assert "cropped_table_border" in {warning.code for warning in result.warnings}
    assert result.grid.confidence < LabConfig().review_grid_confidence
    if "right" in sides:
        assert result.grid.vertical[-1] == prepared.working.shape[1]
    if "bottom" in sides:
        assert result.grid.horizontal[-1] == prepared.working.shape[0]


def test_crop_recovery_does_not_invent_missing_internal_column(tmp_path):
    image = synthetic_table(6, 4, missing_vertical=3, text=False)
    image = image.crop((0, 0, 624, image.height))
    _, result = detect(tmp_path, image)
    assert result.grid is None


def test_crop_recovery_rejects_internal_broken_separator(tmp_path):
    image = synthetic_table(6, 4, text=False)
    ImageDraw.Draw(image).rectangle((80, 79, 560, 82), fill="white")
    image = image.crop((0, 0, 624, image.height))
    _, result = detect(tmp_path, image)
    assert result.grid is None


def test_crop_recovery_rejects_an_implausibly_tall_final_row(tmp_path):
    image = synthetic_table(6, 5, text=False)
    draw = ImageDraw.Draw(image)
    for y in (24 + 3 * 56, 24 + 4 * 56):
        draw.rectangle((24, y, 624, y + 1), fill="white")
    image = image.crop((0, 0, image.width, 24 + 5 * 56))
    _, result = detect(tmp_path, image)
    assert result.grid is None


def test_a_short_stub_at_crop_edge_is_not_a_new_column(tmp_path):
    image = synthetic_table(6, 4, text=False)
    image = image.crop((0, 0, 24 + 5 * 100 + 5, image.height))
    _, result = detect(tmp_path, image)
    assert result.grid is None


@pytest.mark.parametrize("margin", [1, 2, 3])
def test_missing_outer_border_with_real_white_margin_is_not_a_crop(tmp_path, margin):
    image = synthetic_table(6, 4, text=False, missing_vertical=6)
    image = image.crop((0, 0, 625 + margin, image.height))
    _, result = detect(tmp_path, image)
    assert result.grid is None


@pytest.mark.parametrize("short_by", [1, 14])
def test_each_crossing_rule_must_reach_the_crop_edge(tmp_path, short_by):
    image = synthetic_table(6, 4, text=False).crop((0, 0, 624, 273))
    ImageDraw.Draw(image).rectangle((624 - short_by, 135, 623, 139), fill="white")
    _, result = detect(tmp_path, image)
    assert result.grid is None


def test_partial_separator_in_recovered_outer_row_is_rejected(tmp_path):
    image = synthetic_table(6, 4, text=False).crop((0, 0, 649, 248))
    ImageDraw.Draw(image).line((24, 220, 330, 220), fill="#c000c0", width=2)
    _, result = detect(tmp_path, image)
    assert result.grid is None


def test_recovery_is_disabled_for_deskewed_canvas_edges(tmp_path):
    prepared, _ = detect(tmp_path, synthetic_table(6, 4, text=False).crop((0, 0, 624, 273)))
    result = detect_grid(replace(prepared, deskew_degrees=1.0), LabConfig())
    assert result.grid is None


def test_recovered_and_complete_tables_still_require_disambiguation(tmp_path):
    image = Image.new("RGB", (650, 590), "white")
    cropped = synthetic_table(6, 4, text=False).crop((26, 0, 649, 273))
    image.paste(cropped, (0, 0))
    image.paste(synthetic_table(6, 4, text=False), (0, 300))
    _, result = detect(tmp_path, image)
    assert result.grid is None
    assert {warning.code for warning in result.warnings} == {"ambiguous_table"}


@pytest.mark.parametrize("stub", [3, 5, 7])
@pytest.mark.parametrize("side", ["right", "bottom"])
def test_truncated_stub_cannot_disappear_into_a_supported_smaller_table(tmp_path, stub, side):
    image = synthetic_table(7, 5, text=False)
    image = image.crop((0, 0, 624 + stub if side == "right" else image.width,
                        248 + stub if side == "bottom" else image.height))
    _, result = detect(tmp_path, image)
    assert result.grid is None
