"""Generate ruled tables without depending on OCR or proprietary drawings."""

from PIL import Image, ImageDraw


def synthetic_table(
    columns: int = 6,
    rows: int = 3,
    *,
    header: str = "absent",
    color: str = "#c000c0",
    thickness: int = 2,
    margin: int = 24,
    cell_width: int = 100,
    cell_height: int = 56,
    text: bool = True,
    rotation: float = 0,
    missing_vertical: int | None = None,
) -> Image.Image:
    """`rows` counts data rows; top/bottom headers add one physical row."""
    if header not in {"absent", "top", "bottom"}:
        raise ValueError("Unknown header location")
    physical_rows = rows + (header != "absent")
    width = columns * cell_width + 2 * margin + 1
    height = physical_rows * cell_height + 2 * margin + 1
    result = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(result)
    for column in range(columns + 1):
        if column != missing_vertical:
            x = margin + column * cell_width
            draw.line((x, margin, x, margin + physical_rows * cell_height), color, thickness)
    for row in range(physical_rows + 1):
        y = margin + row * cell_height
        draw.line((margin, y, margin + columns * cell_width, y), color, thickness)
    labels = ("NO", "DESCRIPTION", "DIMENSION", "MATERIAL", "QTY", "HRC", "REMARK")
    if text:
        for row in range(physical_rows):
            is_header = (header == "top" and row == 0) or (
                header == "bottom" and row == physical_rows - 1
            )
            for column in range(columns):
                value = labels[column % len(labels)] if is_header else f"R{row}C{column}"
                draw.text(
                    (margin + column * cell_width + 9, margin + row * cell_height + 18),
                    value,
                    fill="black",
                )
    if rotation:
        return result.rotate(
            rotation, resample=Image.Resampling.BICUBIC, expand=True, fillcolor="white"
        )
    return result
