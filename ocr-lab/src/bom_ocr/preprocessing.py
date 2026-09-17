"""Bounded PNG/JPEG loading and reversible table-image preparation.

All public coordinates refer to the EXIF-normalized original raster. Deskewing
is a separate affine transform; it never changes the image used for overlays.
"""

import warnings
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from bom_ocr.config import LabConfig
from bom_ocr.models import BoundingBox, SourceMetadata


class InputImageError(ValueError):
    """A safe public error without paths, decoder details, or document content."""

    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


@dataclass(frozen=True)
class PreparedImage:
    original: np.ndarray
    working: np.ndarray
    gray: np.ndarray
    binary: np.ndarray
    horizontal_mask: np.ndarray
    vertical_mask: np.ndarray
    original_to_working: np.ndarray
    working_to_original: np.ndarray
    scale_x: float
    scale_y: float
    deskew_degrees: float
    source: SourceMetadata
    source_format: str

    def original_bbox(self, box: BoundingBox) -> BoundingBox:
        """Enclose all inverse-transformed corners, clamped to the source image."""
        corners = np.array(
            [
                [box.left, box.top, 1],
                [box.right, box.top, 1],
                [box.right, box.bottom, 1],
                [box.left, box.bottom, 1],
            ],
            dtype=float,
        ).T
        mapped = self.working_to_original @ corners
        width, height = self.source.width, self.source.height
        left = max(0, min(width - 1, int(np.floor(mapped[0].min() + 1e-8))))
        top = max(0, min(height - 1, int(np.floor(mapped[1].min() + 1e-8))))
        right = max(left + 1, min(width, int(np.ceil(mapped[0].max() - 1e-8))))
        bottom = max(top + 1, min(height, int(np.ceil(mapped[1].max() - 1e-8))))
        return BoundingBox(left, top, right, bottom)


_FORMATS = {
    ".png": ("PNG", "image/png"),
    ".jpg": ("JPEG", "image/jpeg"),
    ".jpeg": ("JPEG", "image/jpeg"),
}


def _read_rgb(path: Path, config: LabConfig, mime_type: str | None) -> tuple[np.ndarray, str]:
    expected = _FORMATS.get(path.suffix.lower())
    if expected is None or (mime_type is not None and mime_type.lower() != expected[1]):
        raise InputImageError(
            "unsupported_type", "Only matching PNG or JPEG image inputs are supported."
        )
    try:
        if path.stat().st_size > config.max_file_bytes:
            raise InputImageError(
                "image_too_large", "Image exceeds the configured file-byte limit."
            )
        with path.open("rb") as source:
            payload = source.read(config.max_file_bytes + 1)
    except OSError:
        raise InputImageError("invalid_image", "The input image could not be read.") from None
    if len(payload) > config.max_file_bytes:
        raise InputImageError("image_too_large", "Image exceeds the configured file-byte limit.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(payload)) as candidate:
                if candidate.format != expected[0]:
                    raise InputImageError(
                        "unsupported_type", "Image content does not match its file type."
                    )
                width, height = candidate.size
                if (
                    width <= 0
                    or height <= 0
                    or max(width, height) > config.max_dimension
                    or width * height > config.max_pixels
                ):
                    raise InputImageError(
                        "image_too_large", "Image exceeds the configured pixel limits."
                    )
                if getattr(candidate, "n_frames", 1) != 1:
                    raise InputImageError(
                        "animated_image", "Animated or multi-frame images are unsupported."
                    )
                candidate.verify()
            with Image.open(BytesIO(payload)) as decoded:
                oriented = ImageOps.exif_transpose(decoded)
                if "A" in oriented.getbands() or "transparency" in oriented.info:
                    rgba = oriented.convert("RGBA")
                    background = Image.new("RGBA", rgba.size, "white")
                    rgb = Image.alpha_composite(background, rgba).convert("RGB")
                else:
                    rgb = oriented.convert("RGB")
                return np.array(rgb), expected[0]
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise InputImageError(
            "image_too_large", "Image exceeds safe decompression limits."
        ) from None
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as error:
        if isinstance(error, InputImageError):
            raise
        raise InputImageError(
            "invalid_image", "The PNG/JPEG image is corrupt or cannot be decoded."
        ) from None


def _binary(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
    return gray, binary


def _deskew(binary: np.ndarray) -> float:
    """Estimate a small skew only from several long nearly horizontal segments."""
    height, width = binary.shape
    minimum_length = max(30, width // 4)
    segments = cv2.HoughLinesP(
        binary,
        1,
        np.pi / 1800,
        threshold=max(20, width // 12),
        minLineLength=minimum_length,
        maxLineGap=max(3, width // 150),
    )
    if segments is None:
        return 0.0
    angles = []
    lengths = []
    for x1, y1, x2, y2 in segments[:, 0]:
        dx, dy = float(x2 - x1), float(y2 - y1)
        if dx == 0:
            continue
        angle = float(np.degrees(np.arctan(dy / dx)))
        if abs(angle) <= 5:
            angles.append(angle)
            lengths.append(abs(dx))
    if len(angles) < 3:
        return 0.0
    order = np.argsort(angles)
    weighted = np.cumsum(np.array(lengths)[order])
    angle = float(np.array(angles)[order][np.searchsorted(weighted, weighted[-1] / 2)])
    # Do not rotate an already aligned raster because of subpixel Hough noise.
    if abs(angle) < 0.15 or np.median(np.abs(np.array(angles) - angle)) > 0.6:
        return 0.0
    return angle


def preprocess_image(
    path: str | Path, config: LabConfig, mime_type: str | None = None
) -> PreparedImage:
    path = Path(path)
    original, image_format = _read_rgb(path, config, mime_type)
    height, width = original.shape[:2]
    scale = min(1.0, config.max_long_edge / max(width, height))
    working_width = max(1, round(width * scale))
    working_height = max(1, round(height * scale))
    scale_x, scale_y = working_width / width, working_height / height
    working = cv2.resize(original, (working_width, working_height), interpolation=cv2.INTER_AREA)
    transform = np.diag([scale_x, scale_y, 1.0])
    _, initial_binary = _binary(working)
    angle = _deskew(initial_binary)
    if angle:
        rotation = cv2.getRotationMatrix2D((working_width / 2, working_height / 2), angle, 1)
        working = cv2.warpAffine(
            working,
            rotation,
            (working_width, working_height),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255),
        )
        transform = np.vstack((rotation, [0, 0, 1])) @ transform
    gray, binary = _binary(working)
    horizontal = cv2.morphologyEx(
        binary,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (max(15, working_width // 30), 1)),
    )
    vertical = cv2.morphologyEx(
        binary,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(15, working_height // 20))),
    )
    return PreparedImage(
        original=original,
        working=working,
        gray=gray,
        binary=binary,
        horizontal_mask=horizontal,
        vertical_mask=vertical,
        original_to_working=transform,
        working_to_original=np.linalg.inv(transform),
        scale_x=scale_x,
        scale_y=scale_y,
        deskew_degrees=angle,
        source=SourceMetadata(path.name, width, height),
        source_format=image_format,
    )
