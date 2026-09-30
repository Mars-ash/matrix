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
