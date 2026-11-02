import { describe, it, expect } from "vitest";
import {
  calculateProgress,
  categoryProgress,
  categoryLastUpdated,
  joProgress,
  joProblemCount,
  joStatusSummary,
} from "./progress";
import { formatDdMmYy } from "./format";
import type { Control, Category, JO, Item } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ctrl(status: Control["status"], notes = ""): Control {
  return { process: "Material", status, notes };
}

function makeCat(controls: Control[], kind: "Part" | "Component" = "Part"): Category {
  return {
    id: "cat-1",
    label: "PART",
    kind,
    isCustom: false,
    items: [
      {
        id: "item-1",
        no: "1",
        description: "Test",
        dimension: "",
        material: "",
        qty: 1,
        hrc: "",
        controls,
      },
    ],
  };
}

function makeJo(categories: Category[]): JO {
  return {
    id: "jo-1",
    joNumber: "126.110",
    product: "Test Product",
    type: "PROGRESSIVE",
    categories,
    activities: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("calculateProgress", () => {
  it("returns null for an empty array", () => {
    expect(calculateProgress([])).toBeNull();
  });

  it("returns null when every control is '-'", () => {
    const controls = [ctrl("-"), ctrl("-"), ctrl("-")];
    expect(calculateProgress(controls)).toBeNull();
  });

  it("returns 0 for all Not Started", () => {
    const controls = [ctrl("Not Started"), ctrl("Not Started")];
    expect(calculateProgress(controls)).toBe(0);
  });

  it("returns 50 for all In Progress", () => {
    const controls = [ctrl("In Progress"), ctrl("In Progress")];
    expect(calculateProgress(controls)).toBe(50);
  });

  it("returns 100 for all Done", () => {
    const controls = [ctrl("Done"), ctrl("Done"), ctrl("Done")];
    expect(calculateProgress(controls)).toBe(100);
  });

  it("returns 0 for all Problem", () => {
    const controls = [ctrl("Problem"), ctrl("Problem")];
    expect(calculateProgress(controls)).toBe(0);
  });

  it("excludes '-' from denominator in mixed set", () => {
    // 1 Done (1.0) + 1 '-' (excluded) + 1 Not Started (0) → 1/2 = 50%
    const controls = [ctrl("Done"), ctrl("-"), ctrl("Not Started")];
    expect(calculateProgress(controls)).toBe(50);
  });

  it("calculates mixed statuses correctly", () => {
    // 4 Done (4.0) + 2 In Progress (1.0) + 3 Not Started (0) + 1 Problem (0) = 5.0 / 10 = 50%
    const controls = [
      ctrl("Done"), ctrl("Done"), ctrl("Done"), ctrl("Done"),
      ctrl("In Progress"), ctrl("In Progress"),
      ctrl("Not Started"), ctrl("Not Started"), ctrl("Not Started"),
      ctrl("Problem"),
    ];
    expect(calculateProgress(controls)).toBe(50);
  });

  it("handles single Done among '-' controls", () => {
    // 1 Done + 5 '-' → 1/1 = 100%
    const controls = [ctrl("-"), ctrl("-"), ctrl("Done"), ctrl("-"), ctrl("-"), ctrl("-")];
    expect(calculateProgress(controls)).toBe(100);
  });
});

describe("categoryProgress", () => {
  it("returns null for an empty category", () => {
    const cat: Category = {
      id: "c-empty",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [],
    };
    expect(categoryProgress(cat)).toBeNull();
  });

  it("calculates from all items in the category", () => {
    const cat: Category = {
      id: "c-multi",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [
        {
          id: "i-1", no: "1", description: "", dimension: "", material: "", qty: 1, hrc: "",
          controls: [ctrl("Done"), ctrl("Done")],
        },
        {
          id: "i-2", no: "2", description: "", dimension: "", material: "", qty: 1, hrc: "",
          controls: [ctrl("Not Started"), ctrl("Not Started")],
        },
      ],
    };
    // 2 Done + 2 Not Started → 2/4 = 50%
    expect(categoryProgress(cat)).toBe(50);
  });
});

describe("joProgress", () => {
  it("returns null for JO with no categories", () => {
    expect(joProgress(makeJo([]))).toBeNull();
  });

  it("returns null when all controls across categories are '-'", () => {
    const jo = makeJo([
      makeCat([ctrl("-"), ctrl("-")]),
      makeCat([ctrl("-")]),
    ]);
    expect(joProgress(jo)).toBeNull();
  });

  it("aggregates across Part and Component categories", () => {
    const partCat = makeCat([ctrl("Done"), ctrl("Done")], "Part");
    const compCat: Category = {
      id: "c-comp", label: "COMPONENT", kind: "Component", isCustom: false,
      items: [{
        id: "ci-1", no: "1", description: "", dimension: "", material: "", qty: 1, hrc: "",
        controls: [
          { process: "PO", status: "Not Started", notes: "" },
          { process: "Arrival", status: "Not Started", notes: "" },
        ],
      }],
    };
    // 2 Done (2.0) + 2 Not Started (0) = 2/4 = 50%
    expect(joProgress(makeJo([partCat, compCat]))).toBe(50);
  });
});

describe("joProblemCount", () => {
  it("returns 0 when no Problem statuses", () => {
    expect(joProblemCount(makeJo([makeCat([ctrl("Done")])]))).toBe(0);
  });

  it("counts Problem across multiple categories", () => {
    const jo = makeJo([
      makeCat([ctrl("Problem"), ctrl("Done")]),
      makeCat([ctrl("Problem"), ctrl("Problem")]),
    ]);
    expect(joProblemCount(jo)).toBe(3);
  });
});

describe("joStatusSummary", () => {
  it("excludes '-' from summary", () => {
    const jo = makeJo([makeCat([ctrl("-"), ctrl("Done"), ctrl("Problem")])]);
    const summary = joStatusSummary(jo);
    expect(summary).toEqual({
      "Not Started": 0,
      "In Progress": 0,
      "In Progress SC": 0,
      Done: 1,
      Problem: 1,
    });
  });
});

describe("formatDdMmYy", () => {
  it("returns '-' for empty or invalid values", () => {
    expect(formatDdMmYy(null)).toBe("-");
    expect(formatDdMmYy(undefined)).toBe("-");
    expect(formatDdMmYy("")).toBe("-");
    expect(formatDdMmYy("invalid-date")).toBe("-");
  });

  it("formats date strings in YYYY-MM-DD format correctly without TZ shift", () => {
    expect(formatDdMmYy("2026-11-02")).toBe("02-11-26");
    expect(formatDdMmYy("2025-01-09")).toBe("09-01-25");
  });

  it("formats timestamps and Date objects correctly", () => {
    const d = new Date(2026, 10, 2); // Month is 0-indexed: 10 = November
    expect(formatDdMmYy(d)).toBe("02-11-26");
  });
});

describe("categoryLastUpdated", () => {
  it("returns '-' when category has no items", () => {
    const cat: Category = {
      id: "cat-empty",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [],
    };
    expect(categoryLastUpdated(cat)).toBe("-");
  });

  it("returns '-' when items have no dates", () => {
    const cat = makeCat([ctrl("Done")]);
    expect(categoryLastUpdated(cat)).toBe("-");
  });

  it("returns formatted date based on item.updatedAt", () => {
    const cat = makeCat([ctrl("Done")]);
    cat.items[0].updatedAt = "2026-11-02T08:30:00Z";
    expect(categoryLastUpdated(cat)).toBe(formatDdMmYy("2026-11-02T08:30:00Z"));
  });

  it("picks the latest date among multiple items", () => {
    const cat: Category = {
      id: "cat-multi",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [
        {
          id: "item-1",
          no: "1",
          description: "Old item",
          dimension: "",
          material: "",
          qty: 1,
          hrc: "",
          controls: [ctrl("Done")],
          updatedAt: "2026-10-15T10:00:00Z",
        },
        {
          id: "item-2",
          no: "2",
          description: "Recently updated item",
          dimension: "",
          material: "",
          qty: 1,
          hrc: "",
          controls: [ctrl("In Progress")],
          updatedAt: "2026-11-02T12:00:00Z",
        },
      ],
    };
    expect(categoryLastUpdated(cat)).toBe(formatDdMmYy("2026-11-02T12:00:00Z"));
  });

  it("considers control doneAt / inProgressAt if updatedAt is absent", () => {
    const cat: Category = {
      id: "cat-ctrl-date",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [
        {
          id: "item-1",
          no: "1",
          description: "Item with doneAt",
          dimension: "",
          material: "",
          qty: 1,
          hrc: "",
          controls: [
            {
              process: "Machining",
              status: "Done",
              notes: "",
              doneAt: "2026-11-01T14:00:00Z",
            },
          ],
        },
      ],
    };
    expect(categoryLastUpdated(cat)).toBe(formatDdMmYy("2026-11-01T14:00:00Z"));
  });

  it("immediately updates when an item status changes and updatedAt is modified", () => {
    const item: Item = {
      id: "item-dyn",
      no: "1",
      description: "Dynamic item",
      dimension: "",
      material: "",
      qty: 1,
      hrc: "",
      controls: [ctrl("Not Started")],
      updatedAt: "2026-09-01T00:00:00Z",
    };
    const cat: Category = {
      id: "cat-dyn",
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [item],
    };

    expect(categoryLastUpdated(cat)).toBe(formatDdMmYy("2026-09-01T00:00:00Z"));

    // Simulate status change dispatch updating updatedAt to today
    item.controls[0].status = "Done";
    item.updatedAt = new Date().toISOString();

    const todayFormatted = formatDdMmYy(item.updatedAt);
    expect(categoryLastUpdated(cat)).toBe(todayFormatted);
  });
});
