"""Ruled grids with explicit, review-only bounds for tables clipped by the source."""

from dataclasses import dataclass

import cv2
import numpy as np

from bom_ocr.config import LabConfig
from bom_ocr.models import Grid, Warning
from bom_ocr.preprocessing import PreparedImage


@dataclass(frozen=True)
class GridDetection:
    grid: Grid | None
    warnings: tuple[Warning, ...] = ()


def _merge_lines(projection: np.ndarray, threshold: float, tolerance: int) -> tuple[int, ...]:
    points = np.flatnonzero(projection >= threshold)
    if not len(points):
        return ()
    groups = np.split(points, np.flatnonzero(np.diff(points) > max(1, tolerance)) + 1)
    return tuple(int(round(np.average(group, weights=projection[group]))) for group in groups)


def _coverage(
    mask: np.ndarray, coordinate: int, start: int, end: int, radius: int, *, horizontal: bool
) -> float:
    if horizontal:
        section = mask[max(0, coordinate - radius) : coordinate + radius + 1, start : end + 1]
        return float(np.mean(np.any(section > 0, axis=0)))
    section = mask[start : end + 1, max(0, coordinate - radius) : coordinate + radius + 1]
    return float(np.mean(np.any(section > 0, axis=1)))


def _has_partial_separator(
    mask: np.ndarray,
    boundaries: tuple[int, ...],
    cross_boundaries: tuple[int, ...],
    radius: int,
    *,
    horizontal: bool,
) -> bool:
    """Retain evidence discarded by the full-rule projection threshold.

    A fragment aligned with at least two perpendicular rules is structural
    evidence. Text strokes confined inside a cell do not meet that condition.
    """
    projection = np.count_nonzero(mask, axis=1 if horizontal else 0)
    span = cross_boundaries[-1] - cross_boundaries[0]
    for coordinate in _merge_lines(projection, max(10, span * 0.05), radius):
        if not boundaries[0] + radius < coordinate < boundaries[-1] - radius:
            continue
        if any(abs(coordinate - boundary) <= radius for boundary in boundaries):
            continue
        intersections = 0
        for cross in cross_boundaries:
            row, column = (coordinate, cross) if horizontal else (cross, coordinate)
            region = mask[
                max(0, row - radius) : row + radius + 1,
                max(0, column - radius) : column + radius + 1,
            ]
            intersections += bool(np.any(region))
        if intersections >= 2:
            return True
    return False


def _source_edge_bounds(
    boundaries: tuple[int, ...],
    crossings: tuple[int, ...],
    perpendicular_mask: np.ndarray,
    source_binary: np.ndarray,
    radius: int,
    *,
    horizontal: bool,
) -> tuple[tuple[int, ...], tuple[str, ...]]:
    """Use a crop edge only when every observed crossing rule reaches it.

    No pixels or internal separators are synthesized. Right/bottom coordinates
    are exclusive image bounds so the outer cell retains its last visible pixel.
    """
    size = perpendicular_mask.shape[0 if horizontal else 1]
    gaps = np.diff(boundaries)
    minimum = max(8, float(min(gaps)) * 0.5)
    maximum = float(np.median(gaps) if horizontal else max(gaps)) * 1.5
    added = []
    result = list(boundaries)
    for leading, label in (
        (True, "top" if horizontal else "left"),
        (False, "bottom" if horizontal else "right"),
    ):
        boundary = boundaries[0] if leading else boundaries[-1]
        edge_pixel = 0 if leading else size - 1
        distance = abs(edge_pixel - boundary)
        if not minimum <= distance <= maximum:
            continue
        start, end = sorted((edge_pixel, boundary))
        if not all(
            _coverage(perpendicular_mask, cross, start, end, radius, horizontal=not horizontal)
            >= 0.98
            and _coverage(
                source_binary,
                cross,
                edge_pixel,
                edge_pixel,
                radius,
                horizontal=not horizontal,
            )
            > 0
            for cross in crossings
        ):
            continue
        if leading:
            result.insert(0, 0)
        else:
            result.append(size)
        added.append(label)
    return tuple(result), tuple(added)


def _grid_candidate(
    prepared: PreparedImage, component: tuple[int, int, int, int], config: LabConfig
) -> GridDetection | None:
    x, y, width, height = component
    horizontal_mask = prepared.horizontal_mask[y : y + height, x : x + width]
    vertical_mask = prepared.vertical_mask[y : y + height, x : x + width]
    horizontal = tuple(
        y + p
        for p in _merge_lines(
            np.count_nonzero(horizontal_mask, axis=1),
            max(10, width * 0.5),
            config.line_tolerance,
        )
    )
    vertical = tuple(
        x + p
        for p in _merge_lines(
            np.count_nonzero(vertical_mask, axis=0),
            max(10, height * 0.5),
            config.line_tolerance,
        )
    )
    if len(horizontal) < 2 or len(vertical) < 3:
        return None
    radius = max(2, config.line_tolerance)
    observed_horizontal, observed_vertical = horizontal, vertical
    cropped_sides = ()
    # A deskewed canvas has padded edges that are not source-image crop edges.
    if not prepared.deskew_degrees:
        horizontal, cropped_rows = _source_edge_bounds(
            observed_horizontal,
            observed_vertical,
            prepared.vertical_mask,
            prepared.binary,
            radius,
            horizontal=True,
        )
        vertical, cropped_columns = _source_edge_bounds(
            observed_vertical,
            observed_horizontal,
            prepared.horizontal_mask,
            prepared.binary,
            radius,
            horizontal=False,
        )
        cropped_sides = (*cropped_rows, *cropped_columns)
    if _has_partial_separator(
        prepared.horizontal_mask, horizontal, vertical, radius, horizontal=True
    ) or _has_partial_separator(
        prepared.vertical_mask, vertical, horizontal, radius, horizontal=False
    ):
        return None
    intersections = []
    for row in observed_horizontal:
        for column in observed_vertical:
            region = np.s_[
                max(0, row - radius) : row + radius + 1,
                max(0, column - radius) : column + radius + 1,
            ]
            intersections.append(
                bool(np.any(prepared.horizontal_mask[region]))
                and bool(np.any(prepared.vertical_mask[region]))
            )
    coverages = [
        _coverage(
            prepared.horizontal_mask,
            row,
            vertical[0],
            min(vertical[-1], prepared.gray.shape[1] - 1),
            radius,
            horizontal=True,
        )
        for row in observed_horizontal
    ] + [
        _coverage(
            prepared.vertical_mask,
            column,
            horizontal[0],
            min(horizontal[-1], prepared.gray.shape[0] - 1),
            radius,
            horizontal=False,
        )
        for column in observed_vertical
    ]
    # Minimum line coverage penalizes one broken separator, even in a tall table.
    intersection_score = float(np.mean(intersections))
    coverage_score = min(coverages)
    spacing_score = float(min(np.diff(horizontal)) >= 6 and min(np.diff(vertical)) >= 6)
    confidence = min(1.0, 0.45 * intersection_score + 0.45 * coverage_score + 0.1 * spacing_score)
    # A disconnected partial outer rule must not be mistaken for a smaller table.
    margin = radius + 2
    if (
        vertical[0] - x > margin
        or x + width - 1 - vertical[-1] > margin
        or horizontal[0] - y > margin
        or y + height - 1 - horizontal[-1] > margin
    ):
        confidence *= 0.5
    warnings = ()
    if cropped_sides:
        confidence *= 0.89
        warnings = (
            Warning(
                "cropped_table_border",
                "Table reaches the source image edge ("
                + ", ".join(cropped_sides)
                + "); check outer cells and column identities against the original.",
            ),
        )
    return GridDetection(
        Grid(
            horizontal=horizontal,
            vertical=vertical,
            confidence=confidence,
            cropped_sides=cropped_sides,
        ),
        warnings,
    )


def detect_grid(prepared: PreparedImage, config: LabConfig) -> GridDetection:
    merged = cv2.bitwise_or(prepared.horizontal_mask, prepared.vertical_mask)
    # A tiny join restores antialiasing gaps at intersections; never fabricate lines.
    joined = cv2.dilate(merged, np.ones((3, 3), np.uint8))
    count, _, statistics, _ = cv2.connectedComponentsWithStats(joined, connectivity=8)
    candidates = []
    for index in range(1, count):
        x, y, width, height, area = (int(value) for value in statistics[index])
        if width < 40 or height < 20 or area < 100:
            continue
        candidate = _grid_candidate(prepared, (x, y, width, height), config)
        if candidate is not None:
            candidates.append(candidate)
    plausible = [
        candidate
        for candidate in candidates
        if candidate.grid is not None and candidate.grid.confidence >= config.min_grid_confidence
    ]
    if len(plausible) > 1:
        return GridDetection(
            None, (Warning("ambiguous_table", "Multiple ruled tables were detected."),)
        )
    if not plausible:
        return GridDetection(
            None, (Warning("no_table", "No single stable ruled table was found."),)
        )
    detection = plausible[0]
    grid = detection.grid
    assert grid is not None
    if grid.column_count not in (6, 7):
        return GridDetection(
            None,
            (
                Warning(
                    "unsupported_column_count",
                    "The ruled table must contain exactly six or seven columns.",
                ),
            ),
        )
    return detection
