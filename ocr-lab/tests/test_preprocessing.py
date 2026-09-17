from dataclasses import replace
from io import BytesIO

import numpy as np
import pytest
from PIL import Image

from bom_ocr.config import LabConfig
from bom_ocr.models import BoundingBox
from bom_ocr.preprocessing import InputImageError, preprocess_image


def save_image(tmp_path, image, name="sample.png", **kwargs):
    path = tmp_path / name
    image.save(path, **kwargs)
    return path


@pytest.mark.parametrize("name, mime", [("sample.png", "image/png"), ("sample.jpg", "image/jpeg")])
def test_accepts_png_jpeg_with_matching_extension_mime_decode(tmp_path, name, mime):
    path = save_image(tmp_path, Image.new("RGB", (300, 150), "white"), name)
    prepared = preprocess_image(path, LabConfig(), mime_type=mime)
    assert prepared.original.shape == (150, 300, 3)
    assert prepared.working.shape == prepared.original.shape
    assert prepared.binary.dtype == np.uint8
    assert prepared.horizontal_mask.shape == prepared.gray.shape
    assert prepared.vertical_mask.shape == prepared.gray.shape


def test_resize_preserves_aspect_ratio_and_original_mapping(tmp_path):
    path = save_image(tmp_path, Image.new("RGB", (4096, 1024), "white"))
    prepared = preprocess_image(path, LabConfig())
    assert prepared.working.shape == (512, 2048, 3)
    assert prepared.original_bbox(BoundingBox(100, 50, 400, 200)) == BoundingBox(200, 100, 800, 400)
    np.testing.assert_allclose(
        prepared.working_to_original @ prepared.original_to_working, np.eye(3)
    )


@pytest.mark.parametrize(
    "filename, mime, payload, code",
    [
        ("document.pdf", None, b"%PDF-1.7", "unsupported_type"),
        ("document.png", "application/pdf", b"%PDF-1.7", "unsupported_type"),
        ("document.png", None, b"%PDF-1.7", "invalid_image"),
        ("document.png", None, b"invalid-image", "invalid_image"),
    ],
)
def test_rejects_unsupported_or_corrupt_input(tmp_path, filename, mime, payload, code):
    path = tmp_path / filename
    path.write_bytes(payload)
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, LabConfig(), mime_type=mime)
    assert error.value.code == code
    assert str(tmp_path) not in str(error.value)


def test_decode_format_must_match_extension(tmp_path):
    path = save_image(tmp_path, Image.new("RGB", (40, 40)), "misnamed.png", format="JPEG")
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, LabConfig())
    assert error.value.code == "unsupported_type"


def test_rejects_bytes_before_decoder_opens_input(tmp_path, monkeypatch):
    path = tmp_path / "large.png"
    path.write_bytes(b"x" * 101)

    def forbidden_decode(*args, **kwargs):
        pytest.fail("Byte limit must run before image decoding")

    monkeypatch.setattr(Image, "open", forbidden_decode)
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, replace(LabConfig(), max_file_bytes=100))
    assert error.value.code == "image_too_large"


@pytest.mark.parametrize("limits", [{"max_dimension": 100}, {"max_pixels": 10_000}])
def test_rejects_decoded_dimensions_before_pixel_load(tmp_path, monkeypatch, limits):
    path = save_image(tmp_path, Image.new("RGB", (200, 150)))

    def forbidden_load(*args, **kwargs):
        pytest.fail("Dimension checks must run before loading pixels")

    from PIL.PngImagePlugin import PngImageFile

    monkeypatch.setattr(PngImageFile, "load", forbidden_load)
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, replace(LabConfig(), **limits))
    assert error.value.code == "image_too_large"


def test_decompression_bomb_header_is_rejected_without_decoding(tmp_path, monkeypatch):
    path = save_image(tmp_path, Image.new("RGB", (100, 100)))
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 100)
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, LabConfig())
    assert error.value.code == "image_too_large"


def test_rejects_animated_png(tmp_path):
    path = save_image(
        tmp_path,
        Image.new("RGB", (40, 40), "white"),
        save_all=True,
        append_images=[Image.new("RGB", (40, 40), "black")],
        duration=100,
        loop=0,
    )
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, LabConfig())
    assert error.value.code == "animated_image"


def test_normalizes_exif_orientation_before_coordinate_system(tmp_path):
    image = Image.new("RGB", (120, 60), "white")
    exif = Image.Exif()
    exif[274] = 6
    path = save_image(tmp_path, image, "rotated.jpg", exif=exif)
    prepared = preprocess_image(path, LabConfig())
    assert prepared.original.shape == (120, 60, 3)
    assert prepared.original_bbox(BoundingBox(0, 0, 60, 120)) == BoundingBox(0, 0, 60, 120)


def test_png_disguised_as_jpeg_mime_is_rejected(tmp_path):
    content = BytesIO()
    Image.new("RGB", (50, 50)).save(content, format="PNG")
    path = tmp_path / "sample.png"
    path.write_bytes(content.getvalue())
    with pytest.raises(InputImageError) as error:
        preprocess_image(path, LabConfig(), mime_type="image/jpeg")
    assert error.value.code == "unsupported_type"
