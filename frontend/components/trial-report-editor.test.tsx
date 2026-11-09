import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrialReportEditor } from "./trial-report-editor";
import { createTrialSessionSnapshot } from "@/lib/trial-report";
import type { TrialSession } from "@/lib/types";

const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "u-1", name: "Controller User", role: "controller" },
    role: "controller",
    isController: true,
    isViewer: false,
    logout: vi.fn(),
  }),
}));

const sampleSession: TrialSession = {
  id: "ts-1",
  joId: "jo-1",  
  name: "Trial 1",
  trialDate: "2026-09-08",
  updateDate: "2026-09-08",
  customer: "PT Honda",
  jobNo: "J-01",
  picName: "Budi",
  approvedByName: "Andi",
  findings: [],
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("TrialReportEditor synchronization indicator", () => {
  it("displays 'Ada perubahan yang belum di-update' when session has unpublished changes", () => {
    // Session without publishedSnapshot has unpublished changes
    render(
      <TrialReportEditor
        projectId="p-1"
        joId="jo-1"
        session={sampleSession}
      />
    );

    expect(screen.getByText("Ada perubahan yang belum di-update")).toBeDefined();
    expect(screen.queryByTitle("Sudah sinkron")).toBeNull();
  });

  it("displays '✓' sign when session is synchronized", () => {
    const syncedSession: TrialSession = {
      ...sampleSession,
      publishedSnapshot: createTrialSessionSnapshot(sampleSession),
      lastPublishedAt: sampleSession.updatedAt,
    };

    render(
      <TrialReportEditor
        projectId="p-1"
        joId="jo-1"
        session={syncedSession}
      />
    );

    expect(screen.getByTitle("Sudah sinkron")).toBeDefined();
    expect(screen.getByText("✓")).toBeDefined();
    expect(screen.queryByText("Ada perubahan yang belum di-update")).toBeNull();
  });

  it("dispatches PUBLISH_TRIAL_SESSION_TO_VIEWER on UPDATE click", () => {
    render(
      <TrialReportEditor
        projectId="p-1"
        joId="jo-1"
        session={sampleSession}
      />
    );

    const updateBtn = screen.getByRole("button", { name: /UPDATE/i });
    fireEvent.click(updateBtn);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "PUBLISH_TRIAL_SESSION_TO_VIEWER",
      projectId: "p-1",
      joId: "jo-1",
      sessionId: "ts-1",
    });
  });

  it("renders finding headers with numbers instead of letters (e.g. Temuan 1, Temuan 2)", () => {
    const sessionWithFindings: TrialSession = {
      ...sampleSession,
      findings: [
        {
          id: "f-1",
          order: 1,
          problems: [],
          causes: [],
          correctiveActions: [],
          createdAt: "2026-09-08T10:00:00.000Z",
          updatedAt: "2026-09-08T10:00:00.000Z",
        },
        {
          id: "f-2",
          order: 2,
          problems: [],
          causes: [],
          correctiveActions: [],
          createdAt: "2026-09-08T10:00:00.000Z",
          updatedAt: "2026-09-08T10:00:00.000Z",
        },
      ],
    };

    render(
      <TrialReportEditor
        projectId="p-1"
        joId="jo-1"
        session={sessionWithFindings}
      />
    );

    expect(screen.getByText("Temuan 1")).toBeDefined();
    expect(screen.getByText("Temuan 2")).toBeDefined();
    expect(screen.queryByText("Temuan A")).toBeNull();
    expect(screen.queryByText("Temuan B")).toBeNull();
  });

  it("renders J.O. No. label and does not render Update date field in header", () => {
    render(
      <TrialReportEditor
        projectId="p-1"
        joId="jo-1"
        session={sampleSession}
      />
    );

    expect(screen.getByText("J.O. No.")).toBeDefined();
    expect(screen.queryByText("Job No.")).toBeNull();
    // Update button exists in the sync bar, but the header field label 'Update' is removed
    const labels = screen.queryAllByText((content, element) => {
      return element?.tagName.toLowerCase() === "label" && content.trim() === "Update";
    });
    expect(labels.length).toBe(0);
  });
});
