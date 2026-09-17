"""Explicit local output with source-coordinate review overlays."""

import json
import os
import tempfile
from dataclasses import replace
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

from .models import ArtifactPaths, ExtractionResult

LAB_ROOT = Path(__file__).resolve().parents[2]


class OutputPathError(ValueError):
    """Artifact destination is unsafe or outside the allowed output folders."""


def validate_output_path(path: Path | str, *, allow_outside=False) -> Path:
    destination = Path(path).resolve()
    allowed = (LAB_ROOT / "output", LAB_ROOT / "data" / "private" / "runs")
    if not allow_outside and not any(destination.is_relative_to(root) for root in allowed):
        raise OutputPathError(
            "Use ocr-lab/output or data/private/runs, or explicitly --allow-output-outside-lab."
        )
    if destination.exists() and not destination.is_dir():
        raise OutputPathError("The output destination must be a directory.")
    return destination


def render_annotation(source: Path, result: ExtractionResult) -> Image.Image:
    # Only already validated inputs may be decoded for diagnostics.
    if result.source.width == 0 or result.source.height == 0:
        image = Image.new("RGB", (640, 160), "white")
    else:
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
    draw = ImageDraw.Draw(image)
    if not result.success:
        draw.rectangle((2, 2, image.width - 3, image.height - 3), outline="#dc2626", width=3)
        draw.text((10, 10), "Review: " + ", ".join(w.code for w in result.warnings), fill="#dc2626")
    for row in result.rows:
        color = "#b45309" if row.status == "needs_review" else "#15803d"
        for field, cell in row.cells.items():
            box = cell.bbox
            draw.rectangle(
                (box.left, box.top, box.right - 1, box.bottom - 1), outline=color, width=2
            )
            codes = [w.code for w in row.warnings if w.field is None or w.field == field]
            label = f"{row.index + 1}:{field}"
            if codes:
                label += " " + ",".join(codes)
            draw.text((box.left + 3, box.top + 3), label, fill=color)
    return image


def write_artifacts(
    source: Path | str,
    result: ExtractionResult,
    directory: Path | str,
    *,
    allow_outside=False,
) -> ExtractionResult:
    destination = validate_output_path(directory, allow_outside=allow_outside)
    source = Path(source).resolve()
    paths = {
        name: destination / name for name in ("result.json", "annotated.png", "diagnostics.json")
    }
    for path in paths.values():
        if path.is_symlink() or path.resolve() == source:
            raise OutputPathError("Artifact paths must not overwrite or redirect the source image.")
    updated = replace(
        result,
        artifacts=ArtifactPaths(
            str(paths["annotated.png"]),
            str(paths["result.json"]),
            str(paths["diagnostics.json"]),
        ),
    )
    overlay = render_annotation(source, result)
    destination.mkdir(parents=True, exist_ok=True)
    diagnostics = {
        "success": result.success,
        "requiresReview": True,
        "coordinateSpace": "original image after EXIF orientation",
        "table": result.table.to_dict() if result.table else None,
        "warnings": [warning.to_dict() for warning in result.warnings],
        "rowWarnings": [
            {"index": row.index, "warnings": [w.to_dict() for w in row.warnings]}
            for row in result.rows
        ],
    }
    # Stage every artifact before replacing targets; a write failure never reports success.
    staged = []
    try:
        for name, path in paths.items():
            descriptor, temp_name = tempfile.mkstemp(prefix=".bom-", dir=destination)
            os.close(descriptor)
            temp_path = Path(temp_name)
            staged.append((temp_path, path))
            if name == "annotated.png":
                overlay.save(temp_path, format="PNG")
            else:
                text = (
                    updated.to_json()
                    if name == "result.json"
                    else json.dumps(diagnostics, indent=2)
                )
                temp_path.write_text(text + "\n", encoding="utf-8")
        for temp_path, path in staged:
            temp_path.replace(path)
    finally:
        overlay.close()
        for temp_path, _ in staged:
            temp_path.unlink(missing_ok=True)
    return updated
