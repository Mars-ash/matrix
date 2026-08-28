import { describe, it, expect } from "vitest";
import {
  calculateProgress,
  categoryProgress,
  joProgress,
  joProblemCount,
  joStatusSummary,
} from "./progress";
import type { Control, Category, JO } from "./types";

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
