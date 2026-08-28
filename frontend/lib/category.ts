// ---------------------------------------------------------------------------
// Category → process mapping and helpers.
// ---------------------------------------------------------------------------
import type {
  CategoryKind,
  ProcessName,
  StandardCategoryKey,
  PartCategoryKey,
  ComponentCategoryKey,
  Control,
} from "./types";
import {
  PART_CATEGORIES,
  COMPONENT_CATEGORIES,
  PART_PROCESSES,
  COMPONENT_PROCESSES,
} from "./types";

/** Determine the kind of a standard category key. */
export function categoryKind(key: StandardCategoryKey): CategoryKind {
  if ((PART_CATEGORIES as readonly string[]).includes(key)) return "Part";
  return "Component";
}

/** Return the process names for a given category kind. */
export function processesForKind(kind: CategoryKind): readonly ProcessName[] {
  return kind === "Part" ? PART_PROCESSES : COMPONENT_PROCESSES;
}

/** Return the process names for a standard category key. */
export function processesForCategory(key: StandardCategoryKey): readonly ProcessName[] {
  return processesForKind(categoryKind(key));
}

/** Check whether a key belongs to the Part group. */
export function isPartCategory(key: string): key is PartCategoryKey {
  return (PART_CATEGORIES as readonly string[]).includes(key);
}

/** Check whether a key belongs to the Component group. */
export function isComponentCategory(key: string): key is ComponentCategoryKey {
  return (COMPONENT_CATEGORIES as readonly string[]).includes(key);
}

/** Create default controls for a new item (all statuses set to `-`). */
export function defaultControls(kind: CategoryKind): Control[] {
  const processes = processesForKind(kind);
  return processes.map((process) => ({
    process,
    status: "-" as const,
    notes: "",
  }));
}
