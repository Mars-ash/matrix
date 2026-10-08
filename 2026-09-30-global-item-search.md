# Global Cross-JO Item Search — Implementation Plan

> **Target repo:** MATRIX (`frontend/` only — no backend change)
> **Suggested location:** `docs/superpowers/plans/2026-09-30-global-item-search.md`
> **Written for:** a smaller model executing step by step. Follow the tasks **in order**. Do not skip the "Do NOT" lines.

---

## 0. Goal in one paragraph

From the **Dashboard**, a user types a part name (e.g. `guide pin`) and sees **where that part lives**, not a flat list of names. Results are grouped per JO, each row shows a location path (`PART › 03 — GUIDE PIN`), size/material for telling duplicates apart, and the most urgent process status (`Grinding · Problem`). Filters narrow the result (JO state, process status, subcont supplier). Results are sorted by work urgency (Problem → Not Started → In Progress → Done). Clicking a row opens that JO and **scrolls to and highlights the exact row**.

Core idea: **search for the location of a part, not the name of a part.** Duplicate names stop being a problem because the path differs.

---

## 1. Rules for the executing agent (read first)

1. Work only inside `frontend/`. **Do not touch `backend/`, `docker/`, `ocr-lab/`, or `docs/` (except adding this file).**
2. `frontend/AGENTS.md` says this is **not the Next.js you know** (Next 16.3, React 19.2). Before writing code that uses `next/link`, `next/navigation` or App Router features, skim the matching guide in `frontend/node_modules/next/dist/docs/`. If `node_modules` is missing, run `npm ci` in `frontend/` first.
3. **No new npm dependencies.**
4. Reuse existing things: `StatusBadge` (`components/status-badge.tsx`), `poTrackingLabel` (`lib/po-tracking.ts`), CSS classes `input`, `select`, and the CSS tokens in `app/globals.css` (`--color-*`, `--radius-*`). Styling in this repo = global CSS classes + inline styles. **Do not introduce Tailwind utility classes or a new styling approach.**
5. UI text language: this app mixes English and Indonesian. Use the Indonesian strings given in this plan exactly (tests depend on them).
6. **Never claim something passed unless you actually ran it.** At the end, report each command as `ran: passed`, `ran: failed`, or `not run`.
7. If something in the repo differs from what this plan says, **stop and report the difference** instead of improvising.

---

## 2. Design decisions (and why)

| # | Decision | Reason |
|---|---|---|
| D1 | **Search runs client-side over the existing store. No new API endpoint.** | `GET /api/projects` already returns the full tree `projects → jos → categories → items → controls` (`ProjectController::index` eager-loads it) and `lib/store.tsx` keeps it in memory. With 5–10 users the data is small. A backend `ILIKE` endpoint would duplicate data, miss un-synced optimistic edits, and cannot be tested on the backend test DB (`phpunit.xml` uses **SQLite in-memory**, which has no `ILIKE`; production is PostgreSQL). |
| D2 | Component lives on the **Dashboard**, as a separate box above the project list. | Requirement says "from the dashboard". The existing dashboard `Search...` input only filters projects/JOs by name and is left as is (see Task 5 for a small relabel). |
| D3 | "Project status (active/archive)" from the earlier idea is replaced by **JO state: `Semua JO` / `JO Aktif` / `JO Selesai`**. | There is **no archive field** on projects. The closest real data is `jo.finishDate` (set by "Finish JO"). Active = no `finishDate`. Default = `Semua JO` so nothing is hidden by surprise. |
| D4 | Supplier filter = **subcont supplier** (`item.subcontSupplier` where `item.isSubcont`). Options are derived from the data. | Matches the earlier idea ("supplier if the part is subcont"). PO supplier (`control.poTracking.supplier`) is out of scope. |
| D5 | Query = **whitespace-separated tokens, all must match (AND)** against: JO number, JO product, project name, customer, category label, item no, description, dimension, material, subcont supplier. | Lets users narrow by typing more: `guide pin 126.110`, `plate skd11`. |
| D6 | `×` is normalised to `x` on both sides. | Seed data stores dimensions like `400×300×30`; users type `400x300`. Without this, dimension search silently fails. |
| D7 | Minimum query length = 2 characters. | Avoids dumping the whole database on 1 character. |
| D8 | Result "urgency" rank: `Problem 0 → Not Started 1 → In Progress 2 → In Progress SC 3 → Done 4`; items whose controls are all `-` get rank 5. Status `-` is ignored. | Finished items are rarely what people look for; they sink, they are not hidden. |
| D9 | Navigation reuses the **existing deep link** on the JO page: `/projects/{projectId}/jos/{joId}?item={itemId}` (the JO page already reads `?item=`, sets `highlightedItemId`, and scrolls to `#item-{id}`). Task 6 makes that logic robust. | No new highlight mechanism needed. |

---

## 3. Verified facts about the current code (do not re-derive)

- Types: `frontend/lib/types.ts` — `Project { id, name, customer, company?, jos }`, `JO { id, joNumber, product, type, finishDate?, categories, activities }`, `Category { id, label, kind, isCustom, items }`, `Item { id, no, description, dimension, material, qty, hrc, controls, isSubcont?, subcontSupplier?, ... }`, `Control { process, status, notes, ... }`. `ControlStatus` = `"-" | "Not Started" | "In Progress" | "In Progress SC" | "Done" | "Problem"`.
- Pattern to imitate: `frontend/lib/po-tracking.ts` (`collectPoTrackingRows` walks `projects → jos → categories → items → controls` and returns rows that keep references to `project/jo/category/item/control`).
- Existing per-JO search: `frontend/components/jo-item-search.tsx` (dropdown, 20-result cap). **Leave it unchanged.**
- JO page: `frontend/app/projects/[projectId]/jos/[joId]/page.tsx`. Table rows render as `<tr id={`item-${item.id}`} className={highlightedItemId === item.id ? "row-highlight" : ""}>` in `components/control-table.tsx`. `.row-highlight` = 2.5 s blue pulse (`globals.css`). Categories are **not collapsible**, so every item row is always in the DOM.
- Current JO-page deep-link effect runs **once on mount** with a fixed 150 ms `setTimeout`. If the JO is not in the store yet (page shows "Loading Job Order..."), the row does not exist and the jump silently fails. Task 6 fixes this.
- Dashboard: `frontend/app/page.tsx`. It gets `projects` from `useAppState()`. Header row = `<div className="dashboard-header">…</div>`, then `{/* Project sections */}`.
- Test setup: Vitest + jsdom + React Testing Library (`vitest.config.mts`, alias `@` → `frontend/`). `next/navigation` is mocked in existing tests like this:
  ```ts
  vi.mock("next/navigation", () => ({
    usePathname: () => "/",
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  }));
  ```
- E2E: Playwright, page objects in `frontend/e2e/pages/`. Login helper: `LoginPage.quickLoginController()`. **Existing mismatch:** `DashboardPage.search()` looks for placeholder `"Search projects or JOs..."`, but the real dashboard input has placeholder `"Search..."`.
- Seed data (`backend/database/seeders/DemoSeeder.php`): JO `126.110` has parts such as `Die Plate` (subcont CHIYODA), `Punch Holder`, `Piercing Punch A/B`, `Guide Post`, `Lifter Guide` (has a `Problem` status). Dimensions use `×`.

---

## 4. Files to create / change

| Action | File |
|---|---|
| **Create** | `frontend/lib/global-search.ts` |
| **Create** | `frontend/lib/global-search.test.ts` |
| **Create** | `frontend/components/global-item-search.tsx` |
| **Create** | `frontend/components/global-item-search.test.tsx` |
| **Create** | `frontend/e2e/global-search.spec.ts` |
| Edit | `frontend/app/globals.css` (append a block) |
| Edit | `frontend/app/page.tsx` (mount the component) |
| Edit | `frontend/app/projects/[projectId]/jos/[joId]/page.tsx` (robust deep link) |
| Edit | `frontend/e2e/pages/dashboard.page.ts` (new helper) |

---

## Task 1 — Pure search logic: `frontend/lib/global-search.ts`

Create the file with **exactly** this content. (This code was executed with Node's type-stripping against the test in Task 2 — 11/11 checks passed — but it has not been through `tsc` or the real Vitest. Task 9 does that.)

```ts
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
```

**Do NOT:** import React here, add regex-based matching (user input must never be turned into a RegExp), or change the rank order.

**Acceptance:** file compiles under `npm run typecheck`.

---

## Task 2 — Unit tests: `frontend/lib/global-search.test.ts`

Create with **exactly** this content:

```ts
import { describe, it, expect } from "vitest";
import {
  DEFAULT_FILTERS,
  NO_PROCESS_RANK,
  collectSubcontSuppliers,
  itemHref,
  searchItems,
  type SearchFilters,
} from "./global-search";
import type { Category, Control, ControlStatus, Item, JO, Project } from "./types";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------
function ctrl(process: Control["process"], status: ControlStatus): Control {
  return { process, status, notes: "" };
}

function makeItem(
  id: string,
  no: string,
  description: string,
  controls: Control[],
  extra: Partial<Item> = {}
): Item {
  return { id, no, description, dimension: "", material: "SKD11", qty: 1, hrc: "-", controls, ...extra };
}

function makeCat(id: string, label: string, items: Item[]): Category {
  return { id, label, kind: "Part", isCustom: false, items };
}

function makeJo(id: string, joNumber: string, categories: Category[], finishDate?: string): JO {
  return { id, joNumber, product: "Bracket", type: "PROGRESSIVE", categories, activities: [], finishDate };
}

/**
 * "GUIDE PIN" exists 4x: twice in JO 126.110 (same category), once in the
 * finished JO 126.111 (subcont GEMA) and once in JO 126.112 (subcont CHIYODA).
 */
function fixture(): Project[] {
  return [
    {
      id: "p1",
      name: "Mercedes",
      customer: "PT A",
      jos: [
        makeJo("j1", "126.110", [
          makeCat("c1", "PART", [
            makeItem("i1", "01", "GUIDE PIN", [ctrl("Machining", "Done"), ctrl("Grinding", "Problem")], { dimension: "10 x 20" }),
            makeItem("i2", "02", "GUIDE PIN", [ctrl("Machining", "Not Started")], { dimension: "12 x 30" }),
            makeItem("i3", "03", "PLATE", [ctrl("Machining", "-")]),
          ]),
        ]),
        makeJo(
          "j2",
          "126.111",
          [
            makeCat("c2", "PART DIES", [
              makeItem("i4", "01", "GUIDE PIN", [ctrl("Machining", "Done"), ctrl("Assembly", "Done")], {
                isSubcont: true,
                subcontSupplier: "GEMA",
              }),
            ]),
          ],
          "2026-09-01"
        ),
        makeJo("j3", "126.112", [
          makeCat("c3", "COMPONENT", [
            makeItem("i5", "05", "GUIDE PIN", [ctrl("Machining", "In Progress SC")], {
              isSubcont: true,
              subcontSupplier: "CHIYODA",
            }),
          ]),
        ]),
      ],
    },
  ];
}

const ids = (r: ReturnType<typeof searchItems>) => r.groups.flatMap((g) => g.hits.map((h) => h.item.id));
const withFilters = (patch: Partial<SearchFilters>): SearchFilters => ({ ...DEFAULT_FILTERS, ...patch });

// ---------------------------------------------------------------------------
describe("searchItems — matching", () => {
  it("returns nothing for empty, whitespace or 1-character queries", () => {
    expect(searchItems(fixture(), "").totalHits).toBe(0);
    expect(searchItems(fixture(), "   ").totalHits).toBe(0);
    expect(searchItems(fixture(), "g").totalHits).toBe(0);
  });

  it("keeps duplicate names as separate hits, grouped per JO", () => {
    const r = searchItems(fixture(), "guide pin");
    expect(r.totalHits).toBe(4);
    expect(r.groups).toHaveLength(3);
    const j110 = r.groups.find((g) => g.jo.joNumber === "126.110")!;
    expect(j110.hits.map((h) => h.item.id)).toEqual(["i1", "i2"]);
    expect(new Set(j110.hits.map((h) => h.href)).size).toBe(2);
  });

  it("requires every token to match (AND), including the JO number", () => {
    expect(ids(searchItems(fixture(), "guide pin 126.111"))).toEqual(["i4"]);
    expect(ids(searchItems(fixture(), "guide nonexistent"))).toEqual([]);
  });

  it("matches dimension typed with x against data stored with ×", () => {
    const p = fixture();
    p[0].jos[0].categories[0].items[2].dimension = "400×300×30";
    expect(ids(searchItems(p, "400x300"))).toEqual(["i3"]);
    expect(ids(searchItems(p, "400×300"))).toEqual(["i3"]);
  });
});

describe("searchItems — filters", () => {
  it("joState active/finished", () => {
    expect(ids(searchItems(fixture(), "guide", withFilters({ joState: "active" })))).toEqual(["i1", "i2", "i5"]);
    expect(ids(searchItems(fixture(), "guide", withFilters({ joState: "finished" })))).toEqual(["i4"]);
  });

  it("status filter matches when ANY applicable control has the status", () => {
    expect(ids(searchItems(fixture(), "guide", withFilters({ statuses: ["Problem"] })))).toEqual(["i1"]);
    const done = searchItems(fixture(), "guide", withFilters({ statuses: ["Done"] }));
    expect(ids(done).sort()).toEqual(["i1", "i4"]);
    expect(done.groups.find((g) => g.jo.joNumber === "126.110")!.hits[0].focusControl?.process).toBe("Machining");
  });

  it("supplier filter is case-insensitive and only matches subcont items", () => {
    expect(ids(searchItems(fixture(), "guide", withFilters({ supplier: "GEMA" })))).toEqual(["i4"]);
    expect(ids(searchItems(fixture(), "guide", withFilters({ supplier: "gema" })))).toEqual(["i4"]);
    expect(ids(searchItems(fixture(), "guide", withFilters({ supplier: "PUTRA" })))).toEqual([]);
  });

  it("an item whose controls are all '-' has no focus and fails any status filter", () => {
    const plain = searchItems(fixture(), "plate");
    expect(plain.groups[0].hits[0].focusControl).toBeNull();
    expect(plain.groups[0].hits[0].rank).toBe(NO_PROCESS_RANK);
    expect(searchItems(fixture(), "plate", withFilters({ statuses: ["Problem"] })).totalHits).toBe(0);
  });
});

describe("searchItems — ordering", () => {
  it("sorts groups by most urgent status, and hits inside a group by rank", () => {
    const r = searchItems(fixture(), "guide pin");
    // 126.110 has a Problem (rank 0); 126.112 is In Progress SC (3); 126.111 is all Done (4)
    expect(r.groups.map((g) => g.jo.joNumber)).toEqual(["126.110", "126.112", "126.111"]);
    expect(r.groups[0].hits.map((h) => h.rank)).toEqual([0, 1]);
    expect(r.groups[0].hits[0].focusControl?.process).toBe("Grinding");
  });
});

describe("helpers", () => {
  it("itemHref builds the JO deep link", () => {
    const p = fixture();
    expect(itemHref(p[0], p[0].jos[0], p[0].jos[0].categories[0].items[2])).toBe("/projects/p1/jos/j1?item=i3");
  });

  it("collectSubcontSuppliers returns distinct sorted suppliers of subcont items", () => {
    expect(collectSubcontSuppliers(fixture())).toEqual(["CHIYODA", "GEMA"]);
  });
});
```

Run: `cd frontend && npx vitest run lib/global-search.test.ts --pool=threads`

**Acceptance:** 11 tests pass. If one fails, fix the **code** only if the test encodes a rule from section 2; otherwise report the mismatch.

---

## Task 3 — UI component: `frontend/components/global-item-search.tsx`

Behaviour spec (the code below implements it — this is a reference implementation, **not yet compiled**; fix type errors if `tsc` complains, but keep behaviour and the exact Indonesian strings):

- Props: `{ projects: Project[] }`. The component does **not** read the store itself (keeps it testable).
- Input: `type="search"`, `aria-label="Cari part di semua JO"`. `Escape` clears it.
- Nothing but the input is shown while the query is empty. Filters appear once the query has ≥ 1 character. Results appear at ≥ 2 characters.
- Summary line (`role="status"`): `"{N} item di {M} JO"`.
- Groups (one per JO): header button with `aria-expanded`. **≤ 3 groups → all open by default; > 3 groups → all collapsed** (user picks a JO first). User toggles override the default until the query changes.
- Inside a group: max **10 rows**, then a "Tampilkan semua {n} item" button. Max **50 groups**, then a note.
- Each row is a real `<Link>` (so middle-click / open-in-new-tab works) to `hit.href`.
- Empty state text: `Tidak ada item yang cocok. Coba kata kunci lain atau longgarkan filter.`
- `Reset filter` button appears only when a filter differs from default.

```tsx
"use client";
import React, { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { poTrackingLabel } from "@/lib/po-tracking";
import {
  DEFAULT_FILTERS,
  FILTERABLE_STATUSES,
  MIN_QUERY_LENGTH,
  collectSubcontSuppliers,
  searchItems,
  type FilterableStatus,
  type JoStateFilter,
  type SearchFilters,
  type SearchHit,
} from "@/lib/global-search";
import type { Project } from "@/lib/types";

const MAX_GROUPS = 50;
const ROW_CAP = 10;
const AUTO_OPEN_MAX_GROUPS = 3;

const JO_STATE_OPTIONS: { value: JoStateFilter; label: string }[] = [
  { value: "all", label: "Semua JO" },
  { value: "active", label: "JO Aktif" },
  { value: "finished", label: "JO Selesai" },
];

function isDefaultFilters(f: SearchFilters): boolean {
  return f.joState === "all" && f.statuses.length === 0 && f.supplier === "";
}

function HitRow({ hit }: { hit: SearchHit }) {
  const { item, category, focusControl } = hit;
  const meta = [
    item.dimension,
    item.material,
    `Qty ${item.qty}`,
    item.hrc && item.hrc !== "-" ? `HRc ${item.hrc}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link href={hit.href} className="gs-hit">
        <span className="gs-hit-main">
          <span className="gs-hit-title">
            <span className="gs-hit-path">{category.label} › </span>
            {item.no && item.no !== "-" ? `${item.no} — ` : ""}
            {item.description}
          </span>
          <span className="gs-hit-meta">{meta}</span>
        </span>
        <span className="gs-hit-side">
          {item.isSubcont && (
            <span className="gs-tag">
              {item.subcontSupplier ? `SC · ${item.subcontSupplier}` : "SC"}
            </span>
          )}
          {focusControl ? (
            <>
              <span>{poTrackingLabel(focusControl.process)}</span>
              <StatusBadge status={focusControl.status} />
            </>
          ) : (
            <span>Tidak ada proses</span>
          )}
        </span>
      </Link>
    </li>
  );
}

export function GlobalItemSearch({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const deferredQuery = useDeferredValue(query);
  const suppliers = useMemo(() => collectSubcontSuppliers(projects), [projects]);
  const response = useMemo(
    () => searchItems(projects, deferredQuery, filters),
    [projects, deferredQuery, filters]
  );

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const isActive = trimmed.length >= MIN_QUERY_LENGTH;
  const defaultOpen = response.groups.length <= AUTO_OPEN_MAX_GROUPS;
  const visibleGroups = response.groups.slice(0, MAX_GROUPS);

  const updateQuery = (value: string) => {
    setQuery(value);
    setToggled({});
    setExpandedRows({});
  };

  const toggleStatus = (status: FilterableStatus) => {
    setFilters((f) => ({
      ...f,
      statuses: f.statuses.includes(status)
        ? f.statuses.filter((s) => s !== status)
        : [...f.statuses, status],
    }));
  };

  return (
    <section className="gs" aria-label="Pencarian part lintas JO">
      <div className="gs-input-row">
        <input
          className="input"
          type="search"
          aria-label="Cari part di semua JO"
          placeholder="Cari part / komponen di semua JO… (mis. guide pin 126.110)"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") updateQuery("");
          }}
        />
      </div>

      {hasQuery && (
        <div className="gs-filters">
          <div className="gs-seg" role="group" aria-label="Filter status JO">
            {JO_STATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={filters.joState === opt.value}
                onClick={() => setFilters((f) => ({ ...f, joState: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="gs-chips" role="group" aria-label="Filter status proses">
            {FILTERABLE_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className="gs-chip"
                aria-pressed={filters.statuses.includes(s)}
                onClick={() => toggleStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {suppliers.length > 0 && (
            <select
              className="select"
              aria-label="Filter supplier subcont"
              value={filters.supplier}
              onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))}
            >
              <option value="">Semua supplier</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {!isDefaultFilters(filters) && (
            <button type="button" className="gs-reset" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset filter
            </button>
          )}
        </div>
      )}

      {isActive && response.totalHits > 0 && (
        <>
          <p className="gs-summary" role="status">
            {`${response.totalHits} item di ${response.groups.length} JO`}
          </p>
          {response.groups.length > MAX_GROUPS && (
            <p className="gs-summary">
              {`Menampilkan ${MAX_GROUPS} JO teratas — persempit pencarian atau gunakan filter.`}
            </p>
          )}
          <div className="gs-results">
            {visibleGroups.map((g) => {
              const open = toggled[g.jo.id] ?? defaultOpen;
              const showAll = Boolean(expandedRows[g.jo.id]);
              const rows = showAll ? g.hits : g.hits.slice(0, ROW_CAP);
              return (
                <div className="gs-group" key={g.jo.id}>
                  <button
                    type="button"
                    className="gs-group-header"
                    aria-expanded={open}
                    onClick={() => setToggled((t) => ({ ...t, [g.jo.id]: !open }))}
                  >
                    <span className={`gs-chevron ${open ? "is-open" : ""}`} aria-hidden="true">
                      ▶
                    </span>
                    <span className="gs-group-title">{`JO ${g.jo.joNumber}`}</span>
                    <span className="gs-group-sub">
                      {`${g.jo.product} · ${g.project.name} (${g.project.customer})`}
                    </span>
                    {g.project.company && <span className="gs-tag">{g.project.company}</span>}
                    {g.finished && <span className="gs-tag">SELESAI</span>}
                    <span className="gs-group-count">{`${g.hits.length} item`}</span>
                  </button>
                  {open && (
                    <>
                      <ul className="gs-hit-list">
                        {rows.map((hit) => (
                          <HitRow key={hit.item.id} hit={hit} />
                        ))}
                      </ul>
                      {!showAll && g.hits.length > ROW_CAP && (
                        <button
                          type="button"
                          className="gs-more"
                          onClick={() => setExpandedRows((r) => ({ ...r, [g.jo.id]: true }))}
                        >
                          {`Tampilkan semua ${g.hits.length} item`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {isActive && response.totalHits === 0 && (
        <p className="gs-empty">
          Tidak ada item yang cocok. Coba kata kunci lain atau longgarkan filter.
        </p>
      )}
    </section>
  );
}
```

**Do NOT:** read `useAppState()` inside this component, add `useRouter().push` (rows are `<Link>`s), or use `dangerouslySetInnerHTML` for highlighting matches.

---

## Task 4 — CSS: append to `frontend/app/globals.css`

Open the file, scroll to the very end, and confirm the last rule is **not inside an `@media` block** (if it is, put the new block after that block's closing `}`). Append:

```css
/* ---- Global cross-JO item search (components/global-item-search.tsx) ---- */
.gs { margin-bottom: 20px; }
.gs-input-row { display: flex; gap: 8px; align-items: center; }
.gs-input-row .input { flex: 1 1 auto; font-size: 13px; }
.gs-filters { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin-top: 8px; }
.gs-seg { display: inline-flex; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
.gs-seg button { border: none; background: var(--color-bg-raised); color: var(--color-text-secondary); font: inherit; font-size: 12px; padding: 4px 10px; cursor: pointer; }
.gs-seg button + button { border-left: 1px solid var(--color-border); }
.gs-seg button[aria-pressed="true"] { background: var(--color-accent); color: #fff; }
.gs-chips { display: inline-flex; flex-wrap: wrap; gap: 6px; }
.gs-chip { border: 1px solid var(--color-border); background: var(--color-bg-raised); color: var(--color-text-secondary); font: inherit; font-size: 12px; padding: 3px 10px; border-radius: 999px; cursor: pointer; }
.gs-chip[aria-pressed="true"] { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.gs-filters .select { font-size: 12px; padding: 4px 8px; width: auto; }
.gs-reset { border: none; background: none; color: var(--color-accent); font: inherit; font-size: 12px; cursor: pointer; padding: 4px; }
.gs-summary { margin: 10px 0 6px; font-size: 12px; color: var(--color-text-muted); }
.gs-empty { margin-top: 10px; padding: 14px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); font-size: 13px; color: var(--color-text-muted); text-align: center; }
.gs-results { max-height: 60vh; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-raised); }
.gs-group + .gs-group { border-top: 1px solid var(--color-border); }
.gs-group-header { width: 100%; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 9px 12px; border: none; background: var(--color-bg-wash); color: var(--color-text); font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.gs-group-header:hover { background: var(--color-bg-hover); }
.gs-chevron { display: inline-block; transition: transform 120ms; font-size: 10px; color: var(--color-text-muted); }
.gs-chevron.is-open { transform: rotate(90deg); }
.gs-group-title { font-weight: 700; }
.gs-group-sub { font-size: 12px; color: var(--color-text-muted); }
.gs-group-count { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.gs-hit-list { list-style: none; margin: 0; padding: 0; }
.gs-hit { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px 8px 30px; border-top: 1px solid var(--color-border-subtle); color: var(--color-text); text-decoration: none; }
.gs-hit:hover, .gs-hit:focus-visible { background: var(--color-bg-hover); }
.gs-hit-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gs-hit-title { font-size: 13px; font-weight: 600; }
.gs-hit-path { font-weight: 500; color: var(--color-text-muted); }
.gs-hit-meta { font-size: 11px; color: var(--color-text-muted); }
.gs-hit-side { display: flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 11px; color: var(--color-text-muted); }
.gs-tag { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: var(--radius-sm); background: var(--color-bg-hover); color: var(--color-text-secondary); letter-spacing: 0.04em; }
.gs-more { width: 100%; border: none; border-top: 1px solid var(--color-border-subtle); background: none; color: var(--color-accent); font: inherit; font-size: 12px; padding: 8px 12px 8px 30px; text-align: left; cursor: pointer; }
@media (max-width: 640px) {
  .gs-hit { flex-direction: column; align-items: flex-start; padding-left: 16px; }
  .gs-more { padding-left: 16px; }
  .gs-group-count { margin-left: 0; }
}
```

**Do NOT:** hard-code colours (use the tokens), or edit existing rules.

---

## Task 5 — Mount on the Dashboard: `frontend/app/page.tsx`

1. Add the import next to the other component imports:
   ```tsx
   import { GlobalItemSearch } from "@/components/global-item-search";
   ```
2. Insert **between** the closing `</div>` of `<div className="dashboard-header">` and the comment `{/* Project sections */}`:
   ```tsx
   {/* Global cross-JO part search */}
   <GlobalItemSearch projects={projects} />
   ```
   Pass `projects` (the full list from `useAppState()`), **not** `filteredProjects`.
3. **Avoid two confusing search boxes:** change the placeholder of the *existing* input from `"Search..."` to `"Filter project / JO..."`. Then, in `frontend/e2e/pages/dashboard.page.ts`, change `DashboardPage.search()` to use that same placeholder (`getByPlaceholder("Filter project / JO...")`). Before editing, run `grep -rn "\.search(" frontend/e2e` to see which specs call it; if any spec asserts the old placeholder text elsewhere, report instead of guessing.

**Do NOT:** remove or change the existing filtering logic (`filteredProjects`).

---

## Task 6 — Harden the JO-page deep link: `frontend/app/projects/[projectId]/jos/[joId]/page.tsx`

Problem: the existing effect (comment `// Handle direct item jump from URL or notification link`) runs once on mount and looks for the row after a fixed 150 ms. If the JO is not in the store yet, the row does not exist and nothing happens.

Replace **only that effect** with:

```tsx
  // Handle direct item jump from URL (?item=<id> or #item-<id>) — used by global search and notification links.
  // Waits until the JO is in the store, then retries briefly until the row exists in the DOM.
  useEffect(() => {
    if (typeof window === "undefined" || !jo) return;
    const params = new URLSearchParams(window.location.search);
    const targetItemId = params.get("item") || window.location.hash.replace("#item-", "").replace("#", "");
    if (!targetItemId) return;

    setHighlightedItemId(targetItemId);
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tryScroll = () => {
      const el = document.getElementById(`item-${targetItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (attempts < 20) {
        attempts += 1;
        timer = setTimeout(tryScroll, 100);
      }
    };
    timer = setTimeout(tryScroll, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jo?.id]);
```

Rules:
- Keep it **above** the `if (!project || !jo) { return … }` early return (hooks must not be conditional).
- **Do not** add a "has jumped" `useRef` guard — React StrictMode runs effects twice in dev and a guard would cancel the scroll.
- Keep the other effect (`Clear highlight after timeout`, 2.5 s) and `handleSearchSelect` unchanged.

---

## Task 7 — Component tests: `frontend/components/global-item-search.test.tsx`

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GlobalItemSearch } from "./global-item-search";
import type { Category, Control, ControlStatus, Item, JO, Project } from "@/lib/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

function pin(id: string, process: Control["process"], status: ControlStatus): Item {
  return {
    id,
    no: "01",
    description: "GUIDE PIN",
    dimension: "10 x 20",
    material: "SKD11",
    qty: 1,
    hrc: "-",
    controls: [{ process, status, notes: "" }],
  };
}

function jo(id: string, joNumber: string, items: Item[]): JO {
  const category: Category = { id: `c-${id}`, label: "PART", kind: "Part", isCustom: false, items };
  return { id, joNumber, product: "Bracket", type: "PROGRESSIVE", categories: [category], activities: [] };
}

/** 3 JOs, 4 "GUIDE PIN" hits. 126.110 holds a Problem so it sorts first. */
function threeJoProjects(): Project[] {
  return [
    {
      id: "p1",
      name: "Mercedes",
      customer: "PT A",
      jos: [
        jo("j1", "126.110", [pin("i1", "Grinding", "Problem"), pin("i2", "Machining", "Not Started")]),
        jo("j2", "126.111", [pin("i3", "Machining", "Done")]),
        jo("j3", "126.112", [pin("i4", "Machining", "In Progress")]),
      ],
    },
  ];
}

function fourJoProjects(): Project[] {
  const p = threeJoProjects();
  p[0].jos.push(jo("j4", "126.113", [pin("i5", "Machining", "Done")]));
  return p;
}

const searchbox = () => screen.getByRole("searchbox", { name: /Cari part di semua JO/i });

describe("GlobalItemSearch", () => {
  it("shows only the input until the user types", () => {
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    expect(searchbox()).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Problem$/ })).not.toBeInTheDocument();
  });

  it("ignores a single character", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "g");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Tidak ada item yang cocok/)).not.toBeInTheDocument();
  });

  it("groups duplicates per JO and links every row to its deep link", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "guide pin");

    expect(await screen.findByText("4 item di 3 JO")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute("href", "/projects/p1/jos/j1?item=i1");
    links.forEach((a) => expect(a.getAttribute("href")).toContain("?item="));
  });

  it("narrows results with the Problem status chip and can reset", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "guide pin");
    await screen.findByText("4 item di 3 JO");

    const chip = screen.getByRole("button", { name: /^Problem$/ });
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("1 item di 1 JO")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(await screen.findByText("4 item di 3 JO")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={threeJoProjects()} />);
    await user.type(searchbox(), "zzzz");
    expect(await screen.findByText(/Tidak ada item yang cocok/)).toBeInTheDocument();
  });

  it("collapses groups when there are more than 3 JOs and expands on click", async () => {
    const user = userEvent.setup();
    render(<GlobalItemSearch projects={fourJoProjects()} />);
    await user.type(searchbox(), "guide pin");
    await screen.findByText("5 item di 4 JO");

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    await user.click(screen.getAllByRole("button", { expanded: false })[0]);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});
```

Run: `cd frontend && npx vitest run components/global-item-search.test.tsx --pool=threads`

If a query like `getByRole("status")` finds more than one element, keep the component's single `role="status"` line and fix the test, not the reverse.

---

## Task 8 — E2E (needs backend + seeded DB + `npm run dev`)

1. Add to `frontend/e2e/pages/dashboard.page.ts` inside the class:
   ```ts
   async globalSearch(query: string) {
     const input = this.page.getByRole("searchbox", { name: "Cari part di semua JO" });
     await input.fill(query);
   }
   ```
2. Create `frontend/e2e/global-search.spec.ts`:
   ```ts
   import { test, expect } from "@playwright/test";
   import { LoginPage } from "./pages/login.page";
   import { DashboardPage } from "./pages/dashboard.page";

   test.describe("Global item search", () => {
     test.beforeEach(async ({ page }) => {
       const login = new LoginPage(page);
       await login.goto();
       await login.quickLoginController();
     });

     test("finds a part across JOs and jumps to its highlighted row", async ({ page }) => {
       const dashboard = new DashboardPage(page);
       await dashboard.goto();
       await dashboard.globalSearch("die plate");

       await expect(page.getByRole("status").filter({ hasText: /item di \d+ JO/ })).toBeVisible();
       await page.locator("a.gs-hit").first().click();

       await expect(page).toHaveURL(/\/projects\/.+\/jos\/.+\?item=/);
       await expect(page.locator("tr.row-highlight")).toBeVisible();
     });

     test("status filter never increases the result count", async ({ page }) => {
       const dashboard = new DashboardPage(page);
       await dashboard.goto();
       await dashboard.globalSearch("lifter guide");

       const summary = page.getByRole("status").filter({ hasText: /item di \d+ JO/ });
       await expect(summary).toBeVisible();
       const before = Number(((await summary.textContent()) ?? "").match(/^(\d+)/)?.[1] ?? "0");

       await page.getByRole("button", { name: /^Problem$/ }).click();
       await expect(summary).toBeVisible();
       const after = Number(((await summary.textContent()) ?? "").match(/^(\d+)/)?.[1] ?? "0");
       expect(after).toBeGreaterThan(0); // seed: "Lifter Guide" has a Problem control
       expect(after).toBeLessThanOrEqual(before);
     });

     test("dimension typed with x matches seed data stored with ×", async ({ page }) => {
       const dashboard = new DashboardPage(page);
       await dashboard.goto();
       await dashboard.globalSearch("400x300");
       await expect(page.getByRole("status").filter({ hasText: /item di \d+ JO/ })).toBeVisible();
     });
   });
   ```
3. Before writing the assertions, **confirm the seed still contains** `Die Plate`, `Lifter Guide` and a `400×300` dimension (`grep -n "Die Plate\|Lifter Guide\|400×300" backend/database/seeders/DemoSeeder.php`). If the seed changed, pick other real values.

If the backend / DB is not available, write the files, **do not run them**, and report `e2e: not run`.

---

## Task 9 — Verification (report each as ran/not run)

From `frontend/`:

```bash
npm run typecheck
npm run lint
npm run test              # whole Vitest suite, must stay green
npm run build
npm run test:e2e -- e2e/global-search.spec.ts   # only if backend + seed are up
```

### Manual QA script (dev server, `npm run dev`, controller AND viewer login)

1. Dashboard → type `p` → nothing appears. Type `pu` → results appear, grouped per JO.
2. Type `guide` / `punch` → summary reads `N item di M JO`. With ≤ 3 JOs groups are open; with more they are collapsed and open on click.
3. Two rows with the same description in one JO are both listed and differ by number / dimension / material.
4. Add token `126.110` → only JO 126.110 remains.
5. Click `Problem` chip → only items with a Problem control remain; the row shows `<process> Problem`.
6. Pick a supplier in the dropdown → only subcont items of that supplier remain; `SC · SUPPLIER` tag visible.
7. `JO Selesai` shows only finished JOs (may be empty if none finished).
8. Click a row → JO page opens, scrolls to the row, row pulses blue ~2.5 s.
9. Hard-reload (F5) directly on a URL ending `?item=<id>` → the jump still works after the JO loads.
10. Open a result with middle-click → opens in a new tab.
11. Resize to ≤ 640 px → rows stack vertically, nothing overflows horizontally.
12. Press `Escape` in the box → clears it.
13. Log in as **viewer** → search works identically (read-only feature).

---

## 5. Edge cases already handled (don't re-implement)

| Case | Handling |
|---|---|
| Same name in many JOs / categories / twice in one JO | Grouped per JO; each hit has its own row + own `?item=` link |
| `no` is `-` or empty | Row shows the description only |
| Empty dimension / material / hrc `-` | Skipped in the meta line |
| All controls `-` | Rank 5, shows "Tidak ada proses"; excluded when a status filter is on |
| Dimension typed `x`, stored `×` | Normalised in `normalizeText` |
| Special characters in query | Plain `includes`, no RegExp — safe |
| Huge result set | Max 50 JO groups, max 10 rows per group (expand button), list scrolls in a 60 vh box |
| Fast typing | `useDeferredValue` keeps the input responsive |
| Store still loading / empty | Component just shows the empty state for a ≥ 2-char query |
| Read-only role | Feature only reads data already available to viewers |

---

## 6. Out of scope (do not build now)

- Backend search endpoint. **Revisit only if** `GET /api/projects` becomes slow or too large. If added later, remember the test DB is SQLite: use `LOWER(col) LIKE ?` (portable) instead of `ILIKE`, or run those tests on PostgreSQL.
- `pg_trgm` / typo tolerance, highlighting the matched substring, arrow-key navigation, a `Ctrl+K` shortcut in `AppShell`, filter-only browsing (empty query + filters), PO-supplier filter, searching trial reports.

---

## 7. Definition of done

- [ ] Tasks 1–8 implemented exactly as written; no other files changed.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all reported with real results.
- [ ] Manual QA steps 1–13 walked through (or clearly reported as not done).
- [ ] Final report lists: files changed, commands with ran/passed/failed/not-run, and any place where the repo differed from this plan.

## 8. Rollback

All changes are additive except three small edits (`globals.css` append, `page.tsx` mount + placeholder, JO-page effect). Revert those three plus delete the five new files to fully remove the feature.
