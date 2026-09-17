"""Pure, conservative text equivalences; uncertain values are never guessed."""

import re

from .models import CellValue

FIELDS = frozenset(("no", "description", "dimension", "material", "qty", "hrc", "remark"))
_DIAMETERS = str.maketrans({"⌀": "Ø", "ø": "Ø", "Φ": "Ø", "φ": "Ø"})
_DASHES = str.maketrans({"–": "-", "—": "-", "−": "-"})
_SEPARATOR = r"[xX×✕✖ｘＸ]"
_NUMBER = r"[0-9]+(?:\.[0-9]+)?"
_NUMERIC_DIMENSION = re.compile(rf"Ø?\s*{_NUMBER}(?:\s*{_SEPARATOR}\s*Ø?\s*{_NUMBER})+")


def normalize_value(field: str, raw: str) -> CellValue:
    if field not in FIELDS:
        raise ValueError(f"Unknown BOM field: {field}")
    text = " ".join(raw.split())
    if not text:
        return None
    if field == "qty":
        if not re.fullmatch(r"[0-9]+", text):
            return None
        # Avoid oversized integer conversion while preserving all practical counts.
        digits = text.lstrip("0")
        if not digits or len(digits) > 100:
            return None
        return int(digits)
    if field == "dimension":
        text = re.sub(r"Ø\s+(?=[0-9])", "Ø", text.translate(_DIAMETERS))
        if _NUMERIC_DIMENSION.fullmatch(text):
            text = re.sub(rf"\s*{_SEPARATOR}\s*", "x", text)
        return text
    if field == "material":
        return text.upper()
    if field == "hrc":
        text = re.sub(r"\s*-\s*", "-", text.translate(_DASHES).upper())
        return re.sub(r"(?<=[0-9])\s*HRC$", " HRC", text)
    return text
