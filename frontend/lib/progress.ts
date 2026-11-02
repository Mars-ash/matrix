// ---------------------------------------------------------------------------
// Pure progress & status-summary calculations.
// No React dependency — these are plain functions over domain types.
// ---------------------------------------------------------------------------
import type { ControlStatus, Control, Category, JO } from "./types";
import { formatDdMmYy } from "./format";

/** Status → weight mapping. `-` is excluded from the denominator. */
const WEIGHT: Record<ControlStatus, number | null> = {
  "-": null,
  "Not Started": 0,
  "In Progress": 0.5,
  "In Progress SC": 0.5,
  Done: 1,
  Problem: 0,
};

/**
 * Calculate progress for a flat array of controls.
 * Returns `null` when every control is `-` (display as "-").
 */
export function calculateProgress(controls: Control[]): number | null {
  let sum = 0;
  let count = 0;

  for (const c of controls) {
    const w = WEIGHT[c.status];
    if (w === null) continue; // `-` excluded
    sum += w;
    count += 1;
  }

  if (count === 0) return null;
  return (sum / count) * 100;
}

/** Gather all controls from every item in a category. */
export function categoryControls(category: Category): Control[] {
  return category.items.flatMap((item) => item.controls);
}

/** Calculate progress for a single category. */
export function categoryProgress(category: Category): number | null {
  return calculateProgress(categoryControls(category));
}

/**
 * Find the latest update date across all items and controls in a category,
 * formatted as "dd-mm-yy" (e.g. "02-11-26").
 * Returns "-" if no items or dates are present.
 */
export function categoryLastUpdated(category: Category): string {
  if (!category || !category.items || category.items.length === 0) {
    return "-";
  }

  let latestTime = 0;

  for (const item of category.items) {
    const rawUpdated = item.updatedAt || (item as any).updated_at;
    const rawCreated = item.createdAt || (item as any).created_at;

    const dates: (string | number | undefined | null)[] = [
      rawUpdated,
      rawCreated,
      item.subcontDoneAt,
      item.subcontDispatchDate,
    ];

    for (const ctrl of item.controls || []) {
      dates.push(ctrl.doneAt);
      dates.push(ctrl.inProgressAt);
      if (ctrl.poTracking?.actualArrivalDate) {
        dates.push(ctrl.poTracking.actualArrivalDate);
      }
      for (const photo of ctrl.photos || []) {
        dates.push(photo.addedAt);
      }
    }

    for (const d of dates) {
      if (d) {
        const time = new Date(d).getTime();
        if (!isNaN(time) && time > latestTime) {
          latestTime = time;
        }
      }
    }
  }

  if (latestTime === 0) return "-";
  return formatDdMmYy(latestTime);
}

/** Calculate progress for an entire JO across all categories. */
export function joProgress(jo: JO): number | null {
  const allControls = jo.categories.flatMap((cat) => categoryControls(cat));
  return calculateProgress(allControls);
}

/** Count controls with status `Problem` across a JO. */
export function joProblemCount(jo: JO): number {
  return jo.categories
    .flatMap((cat) => categoryControls(cat))
    .filter((c) => c.status === "Problem")
    .length;
}

/** Summary count of each status across a JO (excluding `-`). */
export function joStatusSummary(
  jo: JO
): Record<Exclude<ControlStatus, "-">, number> {
  const summary = {
    "Not Started": 0,
    "In Progress": 0,
    "In Progress SC": 0,
    Done: 0,
    Problem: 0,
  };

  for (const cat of jo.categories) {
    for (const item of cat.items) {
      for (const c of item.controls) {
        if (c.status !== "-" && c.status in summary) {
          summary[c.status as keyof typeof summary] += 1;
        }
      }
    }
  }

  return summary;
}
