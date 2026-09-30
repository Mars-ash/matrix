// ---------------------------------------------------------------------------
// Global (cross-JO) item search — pure functions, no React.
// Follows the same shape as lib/po-tracking.ts (rows carry project/jo/...).
// ---------------------------------------------------------------------------
import type { Category, Control, ControlStatus, Item, JO, Project } from "./types";

export const MIN_QUERY_LENGTH = 2;

/** Statuses a user can filter on (`-` means "not applicable", never filterable). */
export type FilterableStatus = Exclude<ControlStatus, "-">;
export const FILTERABLE_STATUSES: FilterableStatus[] = [
  "Problem",
  "Not Started",
  "In Progress",
  "In Progress SC",
  "Done",
];

export type JoStateFilter = "all" | "active" | "finished";

export interface SearchFilters {
  joState: JoStateFilter;
  /** Empty = no status filter. Item matches if ANY applicable control has one of these. */
  statuses: FilterableStatus[];
  /** "" = no supplier filter. Matches items with isSubcont && subcontSupplier === supplier. */
  supplier: string;
}

export const DEFAULT_FILTERS: SearchFilters = { joState: "all", statuses: [], supplier: "" };

/** Lower = more urgent = shown first. */
const STATUS_RANK: Record<FilterableStatus, number> = {
  Problem: 0,
  "Not Started": 1,
  "In Progress": 2,
  "In Progress SC": 3,
  Done: 4,
};
/** Rank for items whose controls are all `-` (or that have no controls). */
export const NO_PROCESS_RANK = 5;

/** Process order used only as a tie-break when two controls share a status. */
const PROCESS_ORDER: Record<string, number> = {
  Material: 0,
  PO: 0,
  Arrival: 1,
  Machining: 2,
  Hardening: 3,
  Grinding: 4,
  Wirecut: 5,
  Assembly: 6,
};

export interface SearchHit {
  project: Project;
  jo: JO;
  category: Category;
  item: Item;
  /** The control that decided the rank (shown as "Machining · Problem"). Null when nothing applies. */
  focusControl: Control | null;
  rank: number;
  /** Traversal index — stable tie-break. */
  order: number;
  href: string;
}

export interface SearchGroup {
  project: Project;
  jo: JO;
  finished: boolean;
  bestRank: number;
  hits: SearchHit[];
}

export interface SearchResponse {
  groups: SearchGroup[];
  totalHits: number;
}

const EMPTY_RESPONSE: SearchResponse = { groups: [], totalHits: 0 };

/** Lower-case and unify look-alike characters (seed/BOM data uses "×" for dimensions, users type "x"). */
export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[×✕]/g, "x");
}

export function tokenize(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

export function itemHref(project: Project, jo: JO, item: Item): string {
  return `/projects/${project.id}/jos/${jo.id}?item=${encodeURIComponent(item.id)}`;
}

/**
 * Pick the control that represents the item's "attention level".
 * Returns `undefined` when a status filter is active and no control matches
 * (=> the item must be excluded). Returns `{control: null}` when the item has
 * no applicable controls and no status filter is active.
 */
function pickFocus(
  item: Item,
  statuses: FilterableStatus[]
): { control: Control | null; rank: number } | undefined {
  const applicable = item.controls.filter((c) => c.status !== "-");
  if (applicable.length === 0) {
    return statuses.length > 0 ? undefined : { control: null, rank: NO_PROCESS_RANK };
  }
  const pool =
    statuses.length > 0
      ? applicable.filter((c) => statuses.includes(c.status as FilterableStatus))
      : applicable;
  if (pool.length === 0) return undefined;

  let best = pool[0];
  for (const c of pool.slice(1)) {
    const a = STATUS_RANK[c.status as FilterableStatus];
    const b = STATUS_RANK[best.status as FilterableStatus];
    if (a < b || (a === b && (PROCESS_ORDER[c.process] ?? 99) < (PROCESS_ORDER[best.process] ?? 99))) {
      best = c;
    }
  }
  return { control: best, rank: STATUS_RANK[best.status as FilterableStatus] };
}

function haystackOf(project: Project, jo: JO, category: Category, item: Item): string {
  return normalizeText(
    [
      jo.joNumber,
      jo.product,
      project.name,
      project.customer,
      category.label,
      item.no,
      item.description,
      item.dimension,
      item.material,
      item.subcontSupplier ?? "",
    ].join(" ")
  );
}

export function searchItems(
  projects: Project[],
  query: string,
  filters: SearchFilters = DEFAULT_FILTERS
): SearchResponse {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return EMPTY_RESPONSE;
  const tokens = tokenize(trimmed);
  const supplier = filters.supplier.trim().toLowerCase();

  const groups = new Map<string, SearchGroup>();
  let order = 0;
  let totalHits = 0;

  for (const project of projects) {
    for (const jo of project.jos) {
      const finished = Boolean(jo.finishDate);
      if (filters.joState === "active" && finished) continue;
      if (filters.joState === "finished" && !finished) continue;

      for (const category of jo.categories) {
        for (const item of category.items) {
          order += 1;
          if (supplier) {
            if (!item.isSubcont || (item.subcontSupplier ?? "").trim().toLowerCase() !== supplier) continue;
          }
          const haystack = haystackOf(project, jo, category, item);
          if (!tokens.every((t) => haystack.includes(t))) continue;

          const focus = pickFocus(item, filters.statuses);
          if (!focus) continue;

          const hit: SearchHit = {
            project,
            jo,
            category,
            item,
            focusControl: focus.control,
            rank: focus.rank,
            order,
            href: itemHref(project, jo, item),
          };
          let group = groups.get(jo.id);
          if (!group) {
            group = { project, jo, finished, bestRank: hit.rank, hits: [] };
            groups.set(jo.id, group);
          }
          group.hits.push(hit);
          totalHits += 1;
        }
      }
    }
  }

  const sorted = Array.from(groups.values());
  for (const g of sorted) {
    g.hits.sort((a, b) => a.rank - b.rank || a.order - b.order);
    g.bestRank = g.hits[0].rank;
  }
  sorted.sort(
    (a, b) =>
      a.bestRank - b.bestRank ||
      Number(a.finished) - Number(b.finished) ||
      b.jo.joNumber.localeCompare(a.jo.joNumber, undefined, { numeric: true })
  );

  return { groups: sorted, totalHits };
}

/** Distinct, sorted subcont suppliers present in the data (for the filter dropdown). */
export function collectSubcontSuppliers(projects: Project[]): string[] {
  const set = new Set<string>();
  for (const p of projects)
    for (const jo of p.jos)
      for (const cat of jo.categories)
        for (const item of cat.items) {
          const s = item.subcontSupplier?.trim();
          if (item.isSubcont && s) set.add(s);
        }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
