import { describe, it, expect } from "vitest";
import {
  formatDateDDMMYYYY,
  formatTrialDateSuffix,
  buildTrialSessionName,
  deriveTrialSessionStatus,
  sortTrialFindings,
  cloneTrialSessionWithoutPhotos,
} from "./trial-report";
import type { TrialSession, TrialFinding } from "./types";

// ---------------------------------------------------------------------------
// Helpers for building test data
// ---------------------------------------------------------------------------
function makeFinding(
  overrides: Partial<TrialFinding> = {}
): TrialFinding {
  return {
    id: `f-${Math.random()}`,
    order: 1,
    problem: "test problem",
    cause: "test cause",
    correctiveAction: "test action",
    targetDate: "2026-09-01",
    pic: "Budi",
    status: "On Process",
    photos: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<TrialSession> = {}
): TrialSession {
  return {
    id: "s-1",
    joId: "jo-1",
    name: "Trial Lower Arm 270826",
    trialDate: "2026-08-27",
    updateDate: "2026-08-27",
    customer: "PT. Mercedes",
    jobNo: "126.110",
    picName: "Budi",
    approvedByName: "Pak Hendra",
    findings: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatDateDDMMYYYY
// ---------------------------------------------------------------------------
describe("formatDateDDMMYYYY", () => {
  it("converts YYYY-MM-DD to dd-mm-yyyy", () => {
    expect(formatDateDDMMYYYY("2026-08-27")).toBe("27-08-2026");
    expect(formatDateDDMMYYYY("2024-07-26")).toBe("26-07-2024");
    expect(formatDateDDMMYYYY("2025-01-05")).toBe("05-01-2025");
  });

  it("handles ISO strings with timestamps", () => {
    expect(formatDateDDMMYYYY("2026-08-14T00:00:00.000Z")).toBe("14-08-2026");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateDDMMYYYY("")).toBe("");
  });

  it("returns original string if format does not have 3 parts", () => {
    expect(formatDateDDMMYYYY("2026-08")).toBe("2026-08");
    expect(formatDateDDMMYYYY("already-not-date")).toBe("already-not-date");
  });
});

// ---------------------------------------------------------------------------
// formatTrialDateSuffix
// ---------------------------------------------------------------------------
describe("formatTrialDateSuffix", () => {
  it("converts a valid YYYY-MM-DD to ddmmyy", () => {
    expect(formatTrialDateSuffix("2026-08-27")).toBe("270826");
    expect(formatTrialDateSuffix("2024-07-26")).toBe("260724");
    expect(formatTrialDateSuffix("2025-01-05")).toBe("050125");
  });

  it("returns empty string for empty input", () => {
    expect(formatTrialDateSuffix("")).toBe("");
  });

  it("returns empty string for invalid date formats", () => {
    expect(formatTrialDateSuffix("not-a-date")).toBe("");
    expect(formatTrialDateSuffix("2026")).toBe("");
    expect(formatTrialDateSuffix("2026-08")).toBe("");
    expect(formatTrialDateSuffix("08-27-2026")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildTrialSessionName
// ---------------------------------------------------------------------------
describe("buildTrialSessionName", () => {
  it("combines prefix and date suffix", () => {
    expect(buildTrialSessionName("Trial Lower Arm", "2024-07-26")).toBe(
      "Trial Lower Arm 260724"
    );
  });

  it("uses date-only name when prefix is empty", () => {
    expect(buildTrialSessionName("", "2024-07-26")).toBe("260724");
  });

  it("uses date-only name when prefix is whitespace", () => {
    expect(buildTrialSessionName("   ", "2024-07-26")).toBe("260724");
  });

  it("trims prefix whitespace", () => {
    expect(buildTrialSessionName("  Trial  ", "2026-08-27")).toBe(
      "Trial 270826"
    );
  });

  it("returns prefix only when date is invalid", () => {
    expect(buildTrialSessionName("Trial", "")).toBe("Trial");
  });

  it("returns empty string when both are empty", () => {
    expect(buildTrialSessionName("", "")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// deriveTrialSessionStatus
// ---------------------------------------------------------------------------
describe("deriveTrialSessionStatus", () => {
  it("returns 'On Process' when findings are empty", () => {
    expect(deriveTrialSessionStatus(makeSession())).toBe("On Process");
  });

  it("returns 'On Process' when any finding is 'On Process'", () => {
    const session = makeSession({
      findings: [
        makeFinding({ status: "Close" }),
        makeFinding({ status: "On Process" }),
        makeFinding({ status: "Close" }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("On Process");
  });

  it("returns 'Close' when all findings are 'Close'", () => {
    const session = makeSession({
      findings: [
        makeFinding({ status: "Close" }),
        makeFinding({ status: "Close" }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("Close");
  });

  it("returns 'On Process' for a single 'On Process' finding", () => {
    const session = makeSession({
      findings: [makeFinding({ status: "On Process" })],
    });
    expect(deriveTrialSessionStatus(session)).toBe("On Process");
  });

  it("returns 'Close' for a single 'Close' finding", () => {
    const session = makeSession({
      findings: [makeFinding({ status: "Close" })],
    });
    expect(deriveTrialSessionStatus(session)).toBe("Close");
  });
});

// ---------------------------------------------------------------------------
// sortTrialFindings
// ---------------------------------------------------------------------------
describe("sortTrialFindings", () => {
  it("returns findings sorted by order", () => {
    const findings = [
      makeFinding({ order: 3, problem: "third" }),
      makeFinding({ order: 1, problem: "first" }),
      makeFinding({ order: 2, problem: "second" }),
    ];
    const sorted = sortTrialFindings(findings);
    expect(sorted.map((f) => f.problem)).toEqual(["first", "second", "third"]);
  });

  it("does not mutate the input array", () => {
    const findings = [
      makeFinding({ order: 2 }),
      makeFinding({ order: 1 }),
    ];
    const original = [...findings];
    sortTrialFindings(findings);
    expect(findings[0].order).toBe(original[0].order);
    expect(findings[1].order).toBe(original[1].order);
  });
});

// ---------------------------------------------------------------------------
// cloneTrialSessionWithoutPhotos
// ---------------------------------------------------------------------------
describe("cloneTrialSessionWithoutPhotos", () => {
  it("generates a new session ID", () => {
    const source = makeSession();
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.id).not.toBe(source.id);
  });

  it("copies session text fields", () => {
    const source = makeSession({ customer: "ACME Corp", jobNo: "200.001" });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.customer).toBe("ACME Corp");
    expect(cloned.jobNo).toBe("200.001");
    expect(cloned.picName).toBe(source.picName);
  });

  it("applies overrides", () => {
    const source = makeSession();
    const cloned = cloneTrialSessionWithoutPhotos(source, {
      name: "New Name",
      trialDate: "2026-09-01",
    });
    expect(cloned.name).toBe("New Name");
    expect(cloned.trialDate).toBe("2026-09-01");
  });

  it("copies findings without photos", () => {
    const source = makeSession({
      findings: [
        makeFinding({
          order: 1,
          problem: "Crack on surface",
          status: "On Process",
          photos: [
            {
              id: "ph-1",
              name: "crack.jpg",
              previewUrl: "/report-placeholder-1.svg",
              addedAt: "2026-08-27T00:00:00Z",
            },
          ],
        }),
        makeFinding({
          order: 2,
          problem: "Dimension off",
          status: "Close",
          photos: [],
        }),
      ],
    });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.findings).toHaveLength(2);
    expect(cloned.findings[0].problem).toBe("Crack on surface");
    expect(cloned.findings[0].status).toBe("On Process");
    expect(cloned.findings[0].photos).toEqual([]);
    expect(cloned.findings[1].problem).toBe("Dimension off");
    expect(cloned.findings[1].photos).toEqual([]);
  });

  it("re-sequences finding order values starting at 1", () => {
    const source = makeSession({
      findings: [
        makeFinding({ order: 5 }),
        makeFinding({ order: 10 }),
        makeFinding({ order: 15 }),
      ],
    });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.findings.map((f) => f.order)).toEqual([1, 2, 3]);
  });

  it("generates new finding IDs", () => {
    const source = makeSession({
      findings: [makeFinding({ id: "original-id" })],
    });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.findings[0].id).not.toBe("original-id");
  });

  it("does not mutate the source session", () => {
    const photo = {
      id: "ph-1",
      name: "img.jpg",
      previewUrl: "/test.svg",
      addedAt: "2026-08-27T00:00:00Z",
    };
    const source = makeSession({
      findings: [makeFinding({ photos: [photo] })],
    });
    cloneTrialSessionWithoutPhotos(source);
    expect(source.findings[0].photos).toHaveLength(1);
    expect(source.findings[0].photos[0].id).toBe("ph-1");
  });
});
