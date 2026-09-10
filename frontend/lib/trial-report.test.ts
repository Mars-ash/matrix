import { describe, it, expect } from "vitest";
import {
  formatDateDDMMYYYY,
  formatTrialDateSuffix,
  buildTrialSessionName,
  deriveTrialSessionStatus,
  deriveTrialFindingStatus,
  sortTrialFindings,
  sortTrialEntries,
  formatFindingNumber,
  formatFindingLetter,
  cloneTrialSessionWithoutPhotos,
  createTrialSessionSnapshot,
  hasUnpublishedTrialChanges,
  formatDateTimeDDMMYYYYHHmm,
} from "./trial-report";
import type {
  TrialSession,
  TrialFinding,
  TrialTextEntry,
  TrialCorrectiveActionEntry,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers for building test data
// ---------------------------------------------------------------------------
function makeTextEntry(
  overrides: Partial<TrialTextEntry> = {}
): TrialTextEntry {
  return {
    id: `te-${Math.random()}`,
    order: 1,
    text: "sample text",
    photos: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

function makeActionEntry(
  overrides: Partial<TrialCorrectiveActionEntry> = {}
): TrialCorrectiveActionEntry {
  return {
    id: `ca-${Math.random()}`,
    order: 1,
    text: "sample action",
    targetDate: "2026-09-01",
    pic: "Budi",
    status: "On Process",
    photos: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

function makeFinding(
  overrides: Partial<TrialFinding> = {}
): TrialFinding {
  return {
    id: `f-${Math.random()}`,
    order: 1,
    problems: [makeTextEntry({ text: "test problem" })],
    causes: [makeTextEntry({ text: "test cause" })],
    correctiveActions: [makeActionEntry({ text: "test action" })],
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
// formatFindingNumber
// ---------------------------------------------------------------------------
describe("formatFindingNumber", () => {
  it("formats 1-based order to numeric string 1, 2, 3...", () => {
    expect(formatFindingNumber(1)).toBe("1");
    expect(formatFindingNumber(2)).toBe("2");
    expect(formatFindingNumber(3)).toBe("3");
    expect(formatFindingNumber(26)).toBe("26");
    expect(formatFindingNumber(27)).toBe("27");
  });

  it("handles non-positive numbers safely", () => {
    expect(formatFindingNumber(0)).toBe("1");
    expect(formatFindingNumber(-1)).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// formatFindingLetter
// ---------------------------------------------------------------------------
describe("formatFindingLetter", () => {
  it("formats 1-based order to letter A, B, C...", () => {
    expect(formatFindingLetter(1)).toBe("A");
    expect(formatFindingLetter(2)).toBe("B");
    expect(formatFindingLetter(3)).toBe("C");
    expect(formatFindingLetter(26)).toBe("Z");
    expect(formatFindingLetter(27)).toBe("AA");
  });

  it("handles non-positive numbers safely", () => {
    expect(formatFindingLetter(0)).toBe("A");
    expect(formatFindingLetter(-1)).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// sortTrialEntries
// ---------------------------------------------------------------------------
describe("sortTrialEntries", () => {
  it("sorts entries by order without mutating the input array", () => {
    const entries = [
      { id: "3", order: 3, text: "c" },
      { id: "1", order: 1, text: "a" },
      { id: "2", order: 2, text: "b" },
    ];
    const sorted = sortTrialEntries(entries);
    expect(sorted.map((e) => e.text)).toEqual(["a", "b", "c"]);
    expect(entries[0].id).toBe("3");
  });
});

// ---------------------------------------------------------------------------
// deriveTrialSessionStatus
// ---------------------------------------------------------------------------
describe("deriveTrialSessionStatus", () => {
  it("returns 'On Process' when findings are empty", () => {
    expect(deriveTrialSessionStatus(makeSession())).toBe("On Process");
  });

  it("returns 'On Process' when findings have no corrective actions", () => {
    const session = makeSession({
      findings: [
        makeFinding({
          correctiveActions: [],
        }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("On Process");
  });

  it("returns 'On Process' when any corrective action in any finding is 'On Process'", () => {
    const session = makeSession({
      findings: [
        makeFinding({
          correctiveActions: [
            makeActionEntry({ status: "Close" }),
            makeActionEntry({ status: "On Process" }),
          ],
        }),
        makeFinding({
          correctiveActions: [makeActionEntry({ status: "Close" })],
        }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("On Process");
  });

  it("returns 'Close' when all corrective actions across all findings are 'Close'", () => {
    const session = makeSession({
      findings: [
        makeFinding({
          correctiveActions: [
            makeActionEntry({ status: "Close" }),
            makeActionEntry({ status: "Close" }),
          ],
        }),
        makeFinding({
          correctiveActions: [makeActionEntry({ status: "Close" })],
        }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("Close");
  });

  it("returns 'On Process' for a single 'On Process' corrective action", () => {
    const session = makeSession({
      findings: [
        makeFinding({
          correctiveActions: [makeActionEntry({ status: "On Process" })],
        }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("On Process");
  });

  it("returns 'Close' for a single 'Close' corrective action", () => {
    const session = makeSession({
      findings: [
        makeFinding({
          correctiveActions: [makeActionEntry({ status: "Close" })],
        }),
      ],
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
      makeFinding({ order: 3, id: "f-3" }),
      makeFinding({ order: 1, id: "f-1" }),
      makeFinding({ order: 2, id: "f-2" }),
    ];
    const sorted = sortTrialFindings(findings);
    expect(sorted.map((f) => f.id)).toEqual(["f-1", "f-2", "f-3"]);
  });

  it("sorts nested problem, cause, and corrective action entries by order", () => {
    const finding = makeFinding({
      order: 1,
      problems: [
        makeTextEntry({ order: 2, text: "p2" }),
        makeTextEntry({ order: 1, text: "p1" }),
      ],
      causes: [
        makeTextEntry({ order: 2, text: "c2" }),
        makeTextEntry({ order: 1, text: "c1" }),
      ],
      correctiveActions: [
        makeActionEntry({ order: 2, text: "a2" }),
        makeActionEntry({ order: 1, text: "a1" }),
      ],
    });
    const sorted = sortTrialFindings([finding]);
    expect(sorted[0].problems.map((p) => p.text)).toEqual(["p1", "p2"]);
    expect(sorted[0].causes.map((c) => c.text)).toEqual(["c1", "c2"]);
    expect(sorted[0].correctiveActions.map((a) => a.text)).toEqual(["a1", "a2"]);
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

  it("copies findings and nested entries without photos", () => {
    const samplePhoto = {
      id: "ph-1",
      name: "crack.jpg",
      previewUrl: "/report-placeholder-1.svg",
      addedAt: "2026-08-27T00:00:00Z",
    };
    const source = makeSession({
      findings: [
        makeFinding({
          order: 1,
          problems: [
            makeTextEntry({ order: 1, text: "Crack on surface", photos: [samplePhoto] }),
            makeTextEntry({ order: 2, text: "Burr on edge", photos: [samplePhoto] }),
          ],
          causes: [
            makeTextEntry({ order: 1, text: "Punch worn", photos: [samplePhoto] }),
          ],
          correctiveActions: [
            makeActionEntry({
              order: 1,
              text: "Sharpen punch",
              targetDate: "2026-09-02",
              pic: "Andi",
              status: "Close",
              photos: [samplePhoto],
            }),
            makeActionEntry({
              order: 2,
              text: "Replace punch",
              targetDate: "2026-09-05",
              pic: "Budi",
              status: "On Process",
              photos: [],
            }),
          ],
        }),
      ],
    });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.findings).toHaveLength(1);
    const f = cloned.findings[0];
    expect(f.problems).toHaveLength(2);
    expect(f.problems[0].text).toBe("Crack on surface");
    expect(f.problems[0].photos).toEqual([]);
    expect(f.problems[1].text).toBe("Burr on edge");
    expect(f.problems[1].photos).toEqual([]);

    expect(f.causes).toHaveLength(1);
    expect(f.causes[0].text).toBe("Punch worn");
    expect(f.causes[0].photos).toEqual([]);

    expect(f.correctiveActions).toHaveLength(2);
    expect(f.correctiveActions[0].text).toBe("Sharpen punch");
    expect(f.correctiveActions[0].targetDate).toBe("2026-09-02");
    expect(f.correctiveActions[0].pic).toBe("Andi");
    expect(f.correctiveActions[0].status).toBe("Close");
    expect(f.correctiveActions[0].photos).toEqual([]);
    expect(f.correctiveActions[1].text).toBe("Replace punch");
    expect(f.correctiveActions[1].status).toBe("On Process");
    expect(f.correctiveActions[1].photos).toEqual([]);
  });

  it("re-sequences finding and nested entry order values starting at 1", () => {
    const source = makeSession({
      findings: [
        makeFinding({
          order: 5,
          problems: [
            makeTextEntry({ order: 10, text: "p1" }),
            makeTextEntry({ order: 20, text: "p2" }),
          ],
          causes: [makeTextEntry({ order: 15, text: "c1" })],
          correctiveActions: [makeActionEntry({ order: 50, text: "a1" })],
        }),
        makeFinding({
          order: 10,
          problems: [makeTextEntry({ order: 3, text: "p3" })],
          causes: [],
          correctiveActions: [],
        }),
      ],
    });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    expect(cloned.findings.map((f) => f.order)).toEqual([1, 2]);
    expect(cloned.findings[0].problems.map((p) => p.order)).toEqual([1, 2]);
    expect(cloned.findings[0].causes.map((c) => c.order)).toEqual([1]);
    expect(cloned.findings[0].correctiveActions.map((a) => a.order)).toEqual([1]);
    expect(cloned.findings[1].problems.map((p) => p.order)).toEqual([1]);
  });

  it("generates new IDs for findings and all nested entries", () => {
    const origFindingId = "orig-f-1";
    const origProblemId = "orig-p-1";
    const origCauseId = "orig-c-1";
    const origActionId = "orig-a-1";

    const source = makeSession({
      findings: [
        makeFinding({
          id: origFindingId,
          problems: [makeTextEntry({ id: origProblemId })],
          causes: [makeTextEntry({ id: origCauseId })],
          correctiveActions: [makeActionEntry({ id: origActionId })],
        }),
      ],
    });
    const cloned = cloneTrialSessionWithoutPhotos(source);
    const f = cloned.findings[0];
    expect(f.id).not.toBe(origFindingId);
    expect(f.problems[0].id).not.toBe(origProblemId);
    expect(f.causes[0].id).not.toBe(origCauseId);
    expect(f.correctiveActions[0].id).not.toBe(origActionId);
  });

  it("does not mutate the source session", () => {
    const photo = {
      id: "ph-1",
      name: "img.jpg",
      previewUrl: "/test.svg",
      addedAt: "2026-08-27T00:00:00Z",
    };
    const source = makeSession({
      findings: [
        makeFinding({
          problems: [makeTextEntry({ photos: [photo] })],
        }),
      ],
    });
    cloneTrialSessionWithoutPhotos(source);
    expect(source.findings[0].problems[0].photos).toHaveLength(1);
    expect(source.findings[0].problems[0].photos[0].id).toBe("ph-1");
  });
});

describe("deriveTrialFindingStatus", () => {
  it("returns 'On Process' if finding has no corrective actions", () => {
    const finding = makeFinding({ correctiveActions: [] });
    expect(deriveTrialFindingStatus(finding)).toBe("On Process");
  });

  it("returns 'On Process' if any corrective action is 'On Process'", () => {
    const finding = makeFinding({
      correctiveActions: [
        makeActionEntry({ status: "Close" }),
        makeActionEntry({ status: "On Process" }),
      ],
    });
    expect(deriveTrialFindingStatus(finding)).toBe("On Process");
  });

  it("returns 'Close' if all corrective actions are 'Close'", () => {
    const finding = makeFinding({
      correctiveActions: [
        makeActionEntry({ status: "Close" }),
        makeActionEntry({ status: "Close" }),
      ],
    });
    expect(deriveTrialFindingStatus(finding)).toBe("Close");
  });
});

describe("deriveTrialSessionStatus", () => {
  it("returns 'On Process' if session has no corrective actions", () => {
    const session = makeSession({ findings: [makeFinding({ correctiveActions: [] })] });
    expect(deriveTrialSessionStatus(session)).toBe("On Process");
  });

  it("returns 'Close' when all findings are Close", () => {
    const session = makeSession({
      findings: [
        makeFinding({
          correctiveActions: [makeActionEntry({ status: "Close" })],
        }),
      ],
    });
    expect(deriveTrialSessionStatus(session)).toBe("Close");
  });
});

describe("createTrialSessionSnapshot and hasUnpublishedTrialChanges", () => {
  it("detects unpublished changes when publishedSnapshot is undefined", () => {
    const session = makeSession();
    expect(hasUnpublishedTrialChanges(session)).toBe(true);
  });

  it("creates a snapshot and recognizes that there are no unpublished changes", () => {
    const session = makeSession();
    const snapshot = createTrialSessionSnapshot(session);
    session.publishedSnapshot = snapshot;
    expect(hasUnpublishedTrialChanges(session)).toBe(false);
  });

  it("detects unpublished changes when session findings are updated", () => {
    const session = makeSession();
    session.publishedSnapshot = createTrialSessionSnapshot(session);
    expect(hasUnpublishedTrialChanges(session)).toBe(false);

    // Modify a finding problem text
    session.findings.push(makeFinding({ order: 2 }));
    expect(hasUnpublishedTrialChanges(session)).toBe(true);
  });

  it("detects unpublished changes when session metadata like name or trialDate is changed", () => {
    const session = makeSession();
    session.publishedSnapshot = createTrialSessionSnapshot(session);
    expect(hasUnpublishedTrialChanges(session)).toBe(false);

    session.name = "Updated Session Name";
    expect(hasUnpublishedTrialChanges(session)).toBe(true);
  });
});

describe("formatDateTimeDDMMYYYYHHmm", () => {
  it("returns '—' when input is undefined or empty", () => {
    expect(formatDateTimeDDMMYYYYHHmm()).toBe("—");
    expect(formatDateTimeDDMMYYYYHHmm("")).toBe("—");
  });

  it("formats date-only string with 00:00 time", () => {
    expect(formatDateTimeDDMMYYYYHHmm("2026-08-25")).toBe("25-08-2026 00:00");
  });

  it("formats ISO string with date and time", () => {
    const formatted = formatDateTimeDDMMYYYYHHmm("2026-08-25T10:30:00Z");
    // Verify it contains dd-mm-yyyy and hh:mm format
    expect(formatted).toMatch(/^\d{2}-\d{2}-2026 \d{2}:\d{2}$/);
  });
});

