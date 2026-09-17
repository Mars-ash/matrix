from dataclasses import replace

import numpy as np
import pytest
from PIL import ImageDraw, ImageFont

from bom_ocr.cells import crop_cells
from bom_ocr.config import LabConfig
from bom_ocr.grid import detect_grid
from bom_ocr.preprocessing import preprocess_image
from tests.support.synthetic_table import synthetic_table


def prepare(tmp_path, image, config):
    path = tmp_path / "cells.png"
    image.save(path)
    prepared = preprocess_image(path, config)
    detection = detect_grid(prepared, config)
    assert detection.grid is not None
    return prepared, detection.grid


def test_crops_are_row_major_with_original_bounding_boxes(tmp_path):
    config = replace(LabConfig(), cell_scale=1, cell_padding=4)
    prepared, grid = prepare(tmp_path, synthetic_table(6, 3), config)
    rows = crop_cells(prepared, grid, config)
    assert len(rows) == 3
    assert all(len(row) == 6 for row in rows)
    for row_index, row in enumerate(rows):
        for column_index, cell in enumerate(row):
            assert (cell.row_index, cell.column_index) == (row_index, column_index)
            assert abs(cell.bbox.left - (24 + column_index * 100)) <= 2
            assert abs(cell.bbox.top - (24 + row_index * 56)) <= 2
            assert cell.image.shape[0] <= cell.working_box.bottom - cell.working_box.top + 8
            assert cell.image.shape[1] <= cell.working_box.right - cell.working_box.left + 8


@pytest.mark.parametrize("side", ["left", "right", "top", "bottom"])
def test_source_crop_boundary_does_not_erase_glyph_strokes(tmp_path, side):
    image = synthetic_table(6, 4, text=False)
    box = {
        "left": (26, 0, image.width, image.height),
        "right": (0, 0, 624, image.height),
        "top": (0, 26, image.width, image.height),
        "bottom": (0, 0, image.width, 248),
    }[side]
    image = image.crop(box)
    draw = ImageDraw.Draw(image)
    if side in ("left", "right"):
        x = 1 if side == "left" else image.width - 2
        draw.line((x, 40, x, 65), fill="black", width=1)
        row, column = 0, 0 if side == "left" else 5
    else:
        y = 1 if side == "top" else image.height - 2
        draw.line((42, y, 95, y), fill="black", width=1)
        row, column = (0 if side == "top" else 3), 0
    config = replace(LabConfig(), cell_scale=1, cell_padding=0)
    prepared, grid = prepare(tmp_path, image, config)
    cropped = crop_cells(prepared, grid, config)[row][column]
    expected = 26 if side in ("left", "right") else 54
    assert np.count_nonzero(np.all(cropped.image < 50, axis=2)) == expected


def test_content_crop_removes_whitespace_before_padding_and_upscale(tmp_path):
    image = synthetic_table(6, 2, text=False, cell_width=220, cell_height=76)
    ImageDraw.Draw(image).text(
        (40, 50), "45x250x330", fill="black", font=ImageFont.load_default(size=24)
    )
    config = replace(LabConfig(), cell_scale=1, cell_padding=4)
    prepared, grid = prepare(tmp_path, image, config)
    crop = crop_cells(prepared, grid, config)[0][0]
    black_pixels = np.count_nonzero(np.all(np.array(image) < 80, axis=2))
    assert np.count_nonzero(np.all(crop.image < 80, axis=2)) == black_pixels
    assert crop.image.shape[0] <= 36
    assert crop.image.shape[1] < 190
    assert np.all(crop.image[: config.cell_padding] == 255)
    assert np.all(crop.image[-config.cell_padding :] == 255)
    assert crop.working_box.bottom - crop.working_box.top == 76
    scaled = crop_cells(prepared, grid, replace(config, cell_scale=2))[0][0]
    assert scaled.image.shape[:2] == tuple(size * 2 for size in crop.image.shape[:2])
    assert scaled.bbox == crop.bbox
    assert scaled.working_box == crop.working_box


@pytest.mark.parametrize("rotation", [0, -1.5, 1.5])
def test_content_crop_preserves_diameter_decimal_and_dash_strokes(tmp_path, rotation):
    image = synthetic_table(6, 3, text=False, cell_width=180, cell_height=76)
    draw = ImageDraw.Draw(image)
    draw.ellipse((42, 48, 55, 66), outline="black", width=2)
    draw.line((41, 67, 56, 47), fill="black", width=2)
    draw.line((66, 59, 76, 59), fill="black", width=2)
    draw.rectangle((87, 64, 88, 65), fill="black")
    if rotation:
        image = image.rotate(rotation, resample=3, expand=True, fillcolor="white")
    config = replace(LabConfig(), cell_scale=1, cell_padding=4)
    prepared, grid = prepare(tmp_path, image, config)
    crop = crop_cells(prepared, grid, config)[0][0]
    box = crop.working_box
    original_cell = prepared.working[box.top : box.bottom, box.left : box.right]
    assert np.count_nonzero(np.all(crop.image < 80, axis=2)) == np.count_nonzero(
        np.all(original_cell < 80, axis=2)
    )
    assert crop.image.shape[0] < 48
    assert crop.image.shape[1] < 85


def test_content_crop_keeps_single_dash_and_all_remote_marks(tmp_path):
    image = synthetic_table(6, 2, text=False, cell_width=180, cell_height=76)
    draw = ImageDraw.Draw(image)
    draw.line((46, 60, 53, 60), fill="black", width=2)
    draw.point((150, 82), fill="black")
    config = replace(LabConfig(), cell_scale=1, cell_padding=4)
    prepared, grid = prepare(tmp_path, image, config)
    crop = crop_cells(prepared, grid, config)[0][0]
    assert np.count_nonzero(np.all(crop.image < 80, axis=2)) == 17
    assert crop.image.shape[0] < 50
    assert crop.image.shape[1] > 100


def test_isolated_single_pixel_noise_is_not_enlarged_into_a_tight_glyph(tmp_path):
    image = synthetic_table(6, 2, text=False, cell_width=180, cell_height=76)
    ImageDraw.Draw(image).point((100, 60), fill="black")
    config = replace(LabConfig(), cell_scale=1, cell_padding=4)
    prepared, grid = prepare(tmp_path, image, config)
    crop = crop_cells(prepared, grid, config)[0][0]
    assert crop.image.shape[:2] == (84, 188)
    assert np.count_nonzero(np.all(crop.image < 80, axis=2)) == 1


def test_grid_pixels_removed_and_blank_cells_stay_white(tmp_path):
    config = replace(LabConfig(), cell_scale=2)
    prepared, grid = prepare(tmp_path, synthetic_table(6, 3, text=False), config)
    rows = crop_cells(prepared, grid, config)
    assert all(np.mean(cell.image < 230) < 0.002 for row in rows for cell in row)


def test_only_detected_grid_lines_are_removed_text_strokes_survive(tmp_path):
    config = replace(LabConfig(), cell_scale=1, cell_padding=0)
    image = synthetic_table(6, 3, text=False)
    ImageDraw.Draw(image).line((35, 48, 112, 48), fill="black", width=2)
    prepared, grid = prepare(tmp_path, image, config)
    crop = crop_cells(prepared, grid, config)[0][0]
    assert np.count_nonzero(np.all(crop.image < 50, axis=2)) >= 100


def test_resized_cell_box_returns_to_original_coordinates(tmp_path):
    config = replace(LabConfig(), max_long_edge=500, cell_scale=1)
    prepared, grid = prepare(tmp_path, synthetic_table(6, 3, cell_width=150), config)
    first = crop_cells(prepared, grid, config)[0][0]
    assert abs(first.bbox.left - 24) < 4
    assert abs(first.bbox.right - 174) < 4
    assert first.bbox.right > first.working_box.right


def test_rotated_cell_bbox_encloses_inverse_transformed_corners(tmp_path):
    config = LabConfig()
    prepared, grid = prepare(tmp_path, synthetic_table(6, 3, rotation=1.5), config)
    cell = crop_cells(prepared, grid, config)[1][2]
    box = cell.working_box
    corners = np.array([[box.left, box.top, 1], [box.right, box.bottom, 1]]).T
    original = prepared.working_to_original @ corners
    assert cell.bbox.left <= original[0, 0] <= cell.bbox.right
    assert cell.bbox.top <= original[1, 0] <= cell.bbox.bottom
    assert cell.bbox.left <= original[0, 1] <= cell.bbox.right
    assert cell.bbox.top <= original[1, 1] <= cell.bbox.bottom
