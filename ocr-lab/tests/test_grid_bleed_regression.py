"""Regression: border-bleed at crop edge (must PASS) vs truncated stub (must REJECT)."""

from PIL import ImageDraw

from bom_ocr.config import LabConfig
from bom_ocr.grid import detect_grid
from bom_ocr.preprocessing import preprocess_image
from tests.support.synthetic_table import synthetic_table


def detect(tmp_path, image, config=None):
    path = tmp_path / "bleed.png"
    image.save(path)
    config = config or LabConfig()
    prepared = preprocess_image(path, config)
    return prepared, detect_grid(prepared, config)


def test_truncated_stub_is_rejected(tmp_path):
    image = synthetic_table(6, 4, text=False)
    image = image.crop((0, 0, 24 + 5 * 100 + 5, image.height))
    _, result = detect(tmp_path, image)
    assert result.grid is None


def border_bleed_touching_crop_edge():
    image = synthetic_table(6, 4, text=False)
    draw = ImageDraw.Draw(image)
    for y in (24, 80, 136, 192, 248):
        draw.line((600, y, 626, y), fill="#c000c0", width=2)
    return image.crop((0, 0, 627, image.height))


def test_border_bleed_past_complete_outer_border_is_accepted(tmp_path):
    _, result = detect(tmp_path, border_bleed_touching_crop_edge())
    assert result.grid is not None
    assert (result.grid.column_count, result.grid.row_count) == (6, 4)
