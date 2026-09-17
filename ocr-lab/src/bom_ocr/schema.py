"""Fixed BOM schemas and conservative, ordered header recognition."""

from collections.abc import Sequence
from dataclasses import dataclass
from types import MappingProxyType

from .models import HeaderLocation, Warning

SIX_COLUMNS = ("no", "description", "dimension", "material", "qty", "hrc")
SEVEN_COLUMNS = (*SIX_COLUMNS, "remark")
HEADER_SYNONYMS = MappingProxyType(
    {
        "no": frozenset(("NO", "NO.", "NUMBER")),
        "description": frozenset(("DESCRIPTION", "DESC")),
        "dimension": frozenset(("DIMENSION", "SIZE")),
        "material": frozenset(("MATERIAL", "MATL")),
        "qty": frozenset(("QTY", "QT'Y", "QUANTITY")),
        "hrc": frozenset(("HRC", "HARDNESS")),
        "remark": frozenset(("REMARK", "NOTES")),
    }
)


class UnsupportedColumnCount(ValueError):
    def __init__(self, column_count: int) -> None:
        self.warning = Warning(
            "unsupported_column_count", f"Expected 6 or 7 columns; found {column_count}."
        )
        super().__init__(self.warning.message)


def schema_for_column_count(column_count: int) -> tuple[str, ...]:
    if isinstance(column_count, int) and not isinstance(column_count, bool):
        if column_count == 6:
            return SIX_COLUMNS
        if column_count == 7:
            return SEVEN_COLUMNS
    raise UnsupportedColumnCount(column_count)


@dataclass(frozen=True, slots=True)
class HeaderSelection:
    location: HeaderLocation
    data_row_indices: tuple[int, ...]
    warnings: tuple[Warning, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "data_row_indices", tuple(self.data_row_indices))
        object.__setattr__(self, "warnings", tuple(self.warnings))


def _header_text(raw: str) -> str:
    return " ".join(raw.strip().upper().replace("’", "'").split())


def select_header(raw_rows: Sequence[Sequence[str]], schema: Sequence[str]) -> HeaderSelection:
    """Remove only one full ordered header at an outer row; uncertainty retains data."""
    schema = tuple(schema)
    if schema != schema_for_column_count(len(schema)):
        raise ValueError("Schema fields must follow the approved fixed column order")
    all_indices = tuple(range(len(raw_rows)))
    all_labels = frozenset().union(*(HEADER_SYNONYMS[field] for field in schema))
    full_headers: list[int] = []
    possible_headers: list[int] = []
    for index, row in enumerate(raw_rows):
        values = tuple(_header_text(raw) for raw in row)
        if len(values) == len(schema) and all(
            value in HEADER_SYNONYMS[field] for field, value in zip(schema, values, strict=True)
        ):
            full_headers.append(index)
        elif sum(value in all_labels for value in values) >= 2:
            possible_headers.append(index)
    if len(full_headers) == 1 and not possible_headers:
        index = full_headers[0]
        if index in (0, len(raw_rows) - 1):
            return HeaderSelection(
                "top" if index == 0 else "bottom", tuple(i for i in all_indices if i != index)
            )
    if full_headers or possible_headers:
        return HeaderSelection(
            "ambiguous",
            all_indices,
            (
                Warning(
                    "ambiguous_header",
                    "Header labels are incomplete, repeated, or not at a table edge; "
                    "all rows were retained.",
                ),
            ),
        )
    return HeaderSelection("absent", all_indices)
