// ---------------------------------------------------------------------------
// Pure progress & status-summary calculations.
// No React dependency — these are plain functions over domain types.
// ---------------------------------------------------------------------------
import type { ControlStatus, Control, Category, JO } from "./types";

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
