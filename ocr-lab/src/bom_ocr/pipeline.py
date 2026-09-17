"""Pure orchestration: image in, review contract out; no artifact writes."""

from dataclasses import replace
from pathlib import Path

from .cells import crop_cells
from .config import LabConfig
from .grid import detect_grid
from .models import ExtractionResult, RecognizedCell, SourceMetadata, TableMetadata, Warning
from .normalization import normalize_value
from .preprocessing import InputImageError, preprocess_image
from .recognition import CellRecognizer, RecognitionError
from .schema import UnsupportedColumnCount, schema_for_column_count, select_header
from .validation import mark_duplicate_item_numbers, validate_row


def extract_image(
    path: Path | str,
    recognizer: CellRecognizer,
    config: LabConfig | None = None,
) -> ExtractionResult:
    config = config or LabConfig()
    path = Path(path)
    try:
        prepared = preprocess_image(path, config)
    except InputImageError as error:
        return ExtractionResult(
            False, SourceMetadata(path.name, 0, 0), warnings=(Warning(error.code, str(error)),)
        )
    detection = detect_grid(prepared, config)
    if detection.grid is None:
        return ExtractionResult(False, prepared.source, warnings=detection.warnings)
    grid = detection.grid
    try:
        schema = schema_for_column_count(grid.column_count)
    except UnsupportedColumnCount as error:
        return ExtractionResult(False, prepared.source, warnings=(error.warning,))
    crops = crop_cells(prepared, grid, config)
    try:
        recognized = tuple(tuple(recognizer.recognize(cell.image) for cell in row) for row in crops)
    except RecognitionError:
        return ExtractionResult(
            False,
            prepared.source,
            warnings=(
                Warning("recognition_failed", "Local OCR failed. Check the model cache and image."),
            ),
        )
    header = select_header(tuple(tuple(cell.text for cell in row) for row in recognized), schema)
    rows = []
    for source_index in header.data_row_indices:
        values = recognized[source_index]
        if not any(cell.text.strip() for cell in values):
            continue
        cells = {
            field: RecognizedCell(
                value.text, normalize_value(field, value.text), value.confidence, crop.bbox
            )
            for field, value, crop in zip(schema, values, crops[source_index], strict=True)
        }
        row = validate_row(len(rows), cells, schema, grid.confidence, config)
        warnings = (*row.warnings, *header.warnings, *detection.warnings)
        row = replace(
            row,
            source_row_index=source_index,
            warnings=warnings,
            status="needs_review" if warnings else "ready_for_review",
        )
        rows.append(row)
    if not rows:
        return ExtractionResult(
            False,
            prepared.source,
            warnings=(Warning("empty_table", "The table contains no recognized data rows."),),
        )
    return ExtractionResult(
        True,
        prepared.source,
        table=TableMetadata(grid.column_count, header.location, grid.confidence),
        rows=mark_duplicate_item_numbers(tuple(rows)),
        warnings=(*detection.warnings, *header.warnings),
    )
