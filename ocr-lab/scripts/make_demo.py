"""Generate a clearly synthetic, readable BOM fixture; no customer data or model used."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

LAB = Path(__file__).resolve().parents[1]


def main():
    widths = [90, 360, 300, 160, 80, 160, 180]
    rows = [
        ["10A", "PUNCH FORMING", "45x250x330", "SKD11", "2", "58-60", "-"],
        ["04B", "GUIDE POST", "Ø30x58", "S50C", "4", "35-40", "-"],
        ["S1", "SPRING", "MYAP32-200", "STD", "6", "-", "-"],
        ["NO", "DESCRIPTION", "DIMENSION", "MATERIAL", "QTY", "HRC", "REMARK"],
    ]
    margin, height = 28, 76
    image = Image.new("RGB", (sum(widths) + margin * 2, len(rows) * height + margin * 2), "white")
    draw = ImageDraw.Draw(image)
    # Windows Arial contains the engineering diameter glyph used by this demo.
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
    positions = [margin]
    for width in widths:
        positions.append(positions[-1] + width)
    for x in positions:
        draw.line((x, margin, x, image.height - margin), fill="#bb0088", width=3)
    for row in range(len(rows) + 1):
        y = margin + row * height
        draw.line((margin, y, image.width - margin, y), fill="#bb0088", width=3)
    for row, values in enumerate(rows):
        for column, text in enumerate(values):
            draw.text((positions[column] + 12, margin + row * height + 25), text, "black", font)
    target = LAB / "fixtures" / "synthetic" / "readable-bom.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target)
    print("Synthetic demo written to fixtures/synthetic/readable-bom.png")


if __name__ == "__main__":
    main()
