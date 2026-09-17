"""Pure row validation; all output remains subject to human review."""

import re
from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import replace

from .config import LabConfig
from .models import BomRow, RecognizedCell, Warning, _confidence

_ITEM_NUMBER = re.compile(r"(?:[0-9]+[A-Za-z]*|S[0-9]+[A-Za-z]*|-)")
_HRC = re.compile(r"([0-9]+(?:\.[0-9]+)?)(?:-([0-9]+(?:\.[0-9]+)?))?(?: HRC)?")


def _ambiguous_dimension(value: str) -> bool:
    if re.search(r"[?\ufffd|]", value):
        return True
    # A real model smoke case read Ø30x58 as 030x58. A leading-zero
    # measurement needs review; never guess that its zero means diameter.
    if re.match(r"^0[0-9]+(?:\.[0-9]+)?(?:x|$)", value):
        return True
    # Letter O in an otherwise numerical dimension is ambiguous; technical part
    # codes (MYAP32-200, MAX32-200, AB32X50) remain valid free-form identifiers.
    numeric_candidate = re.sub(r"[0-9\sØøΦφ⌀xX×✕✖ｘＸ.,+\-±/()Oo]", "", value)
    return not numeric_candidate and bool(re.search(r"[Oo]", value))


def _ambiguous_hrc(value: str) -> bool:
    if value == "-":
        return False
    match = _HRC.fullmatch(value)
    if not match:
        return True
    start = float(match.group(1))
    end = float(match.group(2)) if match.group(2) else start
    return not 0 <= start <= end <= 100


def validate_row(
    index: int,
    cells: Mapping[str, RecognizedCell],
    schema: Sequence[str],
    table_confidence: float,
    config: LabConfig,
) -> BomRow:
    _confidence(table_confidence, "table confidence")
    warnings: list[Warning] = []

    def flag(code: str, message: str, field: str | None = None) -> None:
        warnings.append(Warning(code, message, field, index))

    if set(cells) != set(schema) or len(cells) != len(schema):
        flag("malformed_row", "Row cells do not match the selected column schema.")
    if table_confidence < config.review_grid_confidence:
        flag("low_confidence", "Table geometry confidence is below the review threshold.")
    for field in schema:
        cell = cells.get(field)
        if cell is None:
            if field != "remark":
                code = "invalid_qty" if field == "qty" else "missing_required_value"
                flag(code, "Required cell is missing.", field)
            continue
        value = cell.value
        empty = value is None or isinstance(value, str) and not value.strip()
        if field != "remark" and cell.confidence < config.min_cell_confidence:
            flag(
                "low_confidence",
                "Cell recognition confidence is below the review threshold.",
                field,
            )
        if field == "qty":
            if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                flag("invalid_qty", "Quantity must be an unambiguous positive whole number.", field)
        elif empty:
            if field != "remark":
                flag(
                    "missing_required_value",
                    "Required value is empty; no fallback was supplied.",
                    field,
                )
        elif field == "no" and (not isinstance(value, str) or not _ITEM_NUMBER.fullmatch(value)):
            flag(
                "unexpected_item_no",
                "Item number does not match an expected BOM identifier pattern.",
                field,
            )
        elif field == "dimension" and (not isinstance(value, str) or _ambiguous_dimension(value)):
            flag(
                "ambiguous_dimension",
                "Dimension contains ambiguous characters or a leading zero; review the source.",
                field,
            )
        elif field == "hrc" and (not isinstance(value, str) or _ambiguous_hrc(value)):
            flag("ambiguous_hrc", "Hardness is not a clear value, ordered range, or dash.", field)
    return BomRow(index, cells, tuple(warnings))


def mark_duplicate_item_numbers(rows: Sequence[BomRow]) -> tuple[BomRow, ...]:
    counts = Counter(
        row.cells["no"].value
        for row in rows
        if "no" in row.cells and row.cells["no"].value not in (None, "", "-")
    )
    marked = []
    for row in rows:
        cell = row.cells.get("no")
        duplicate = (
            cell is not None and cell.value not in (None, "", "-") and counts[cell.value] > 1
        )
        if duplicate and not any(warning.code == "duplicate_item_no" for warning in row.warnings):
            warning = Warning(
                "duplicate_item_no",
                "Item number appears in more than one data row.",
                "no",
                row.index,
            )
            row = replace(row, warnings=(*row.warnings, warning), status="needs_review")
        marked.append(row)
    return tuple(marked)
