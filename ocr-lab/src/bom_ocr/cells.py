"""Prepare row-major OCR crops while preserving source-coordinate cell bounds."""

from dataclasses import dataclass
from itertools import pairwise

import cv2
import numpy as np

from bom_ocr.config import LabConfig
from bom_ocr.models import BoundingBox, Grid
from bom_ocr.preprocessing import PreparedImage


@dataclass(frozen=True)
class CellCrop:
    image: np.ndarray
    bbox: BoundingBox
    working_box: BoundingBox
    row_index: int
    column_index: int


def _detected_grid_pixels(prepared: PreparedImage, grid: Grid, tolerance: int) -> np.ndarray:
    """Mask only morphology pixels near this grid's actual detected boundaries."""
    horizontal_band = np.zeros(prepared.gray.shape, dtype=np.uint8)
    vertical_band = np.zeros_like(horizontal_band)
    radius = max(3, tolerance + 2)
    left, right = grid.vertical[0], grid.vertical[-1]
    top, bottom = grid.horizontal[0], grid.horizontal[-1]
    for y in grid.horizontal:
        if (y == top and "top" in grid.cropped_sides) or (
            y == bottom and "bottom" in grid.cropped_sides
        ):
            continue
        horizontal_band[max(0, y - radius) : y + radius + 1, left : right + 1] = 255
    for x in grid.vertical:
        if (x == left and "left" in grid.cropped_sides) or (
            x == right and "right" in grid.cropped_sides
        ):
            continue
        vertical_band[top : bottom + 1, max(0, x - radius) : x + radius + 1] = 255
    detected = cv2.bitwise_or(
        cv2.bitwise_and(prepared.horizontal_mask, horizontal_band),
        cv2.bitwise_and(prepared.vertical_mask, vertical_band),
    )
    return cv2.dilate(detected, np.ones((3, 3), np.uint8))


def _trim_cell_whitespace(crop: np.ndarray) -> np.ndarray:
    # Recognition expects a text-line crop. Keeping a whole tall/wide cell
    # makes small glyphs unreadable when the model resizes its input.
    foreground = np.any(crop < 245, axis=2)
    y, x = np.nonzero(foreground)
    if len(x) < 3:
        # Do not turn a lone compression speck into a large apparent glyph.
        # Blank cells remain blank; no characters or fallback values are added.
        return crop
    # Keep every visible mark, including isolated decimals/dashes, plus a pixel
    # for edge antialiasing. Original cell geometry remains in the metadata.
    return crop[
        max(0, int(y.min()) - 1) : min(crop.shape[0], int(y.max()) + 2),
        max(0, int(x.min()) - 1) : min(crop.shape[1], int(x.max()) + 2),
    ]


def crop_cells(
    prepared: PreparedImage, grid: Grid, config: LabConfig
) -> tuple[tuple[CellCrop, ...], ...]:
    line_pixels = _detected_grid_pixels(prepared, grid, config.line_tolerance)
    rows = []
    for row_index, (top, bottom) in enumerate(pairwise(grid.horizontal)):
        row = []
        for column_index, (left, right) in enumerate(pairwise(grid.vertical)):
            working_box = BoundingBox(left, top, right, bottom)
            crop = prepared.working[top:bottom, left:right].copy()
            crop[line_pixels[top:bottom, left:right] > 0] = 255
            crop = _trim_cell_whitespace(crop)
            padding = config.cell_padding
            crop = cv2.copyMakeBorder(
                crop,
                padding,
                padding,
                padding,
                padding,
                cv2.BORDER_CONSTANT,
                value=(255, 255, 255),
            )
            if config.cell_scale != 1:
                crop = cv2.resize(
                    crop,
                    None,
                    fx=config.cell_scale,
                    fy=config.cell_scale,
                    interpolation=cv2.INTER_CUBIC,
                )
            row.append(
                CellCrop(
                    image=crop,
                    bbox=prepared.original_bbox(working_box),
                    working_box=working_box,
                    row_index=row_index,
                    column_index=column_index,
                )
            )
        rows.append(tuple(row))
    return tuple(rows)
