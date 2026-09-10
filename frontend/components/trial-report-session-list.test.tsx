import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { TrialReportSessionList } from "./trial-report-session-list";
import type { TrialSession } from "@/lib/types";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/lib/auth";

const mockSessions: TrialSession[] = [
  {
    id: "session-1",
    joId: "jo1",
    name: "Trial 1",
    trialDate: "2026-09-01",
    updateDate: "2026-09-01",
    customer: "PT TEST",
    jobNo: "JO-01",
    picName: "PIC",
    approvedByName: "Manager",
    findings: [],
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
];

describe("TrialReportSessionList", () => {
  it("hides print checkboxes and print footer when user is a viewer", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, name: "Viewer User", email: "viewer@example.com", role: "viewer" },
      token: "mock-token",
      role: "viewer",
      isController: false,
      isViewer: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchRoleDemo: vi.fn(),
    });

    render(
      <TrialReportSessionList
        projectId="p1"
        joId="jo1"
        sessions={mockSessions}
        selectedId="session-1"
        onSelectSession={vi.fn()}
        printSelectedIds={[]}
        onTogglePrintSelect={vi.fn()}
        onCreateNew={vi.fn()}
        onDuplicate={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.queryByTitle("Pilih untuk print")).toBeNull();
    expect(screen.queryByText(/Print Terpilih/i)).toBeNull();
    expect(screen.queryByText(/Centang session untuk print/i)).toBeNull();
  });

  it("shows print checkboxes and print footer when user is a controller", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, name: "Admin User", email: "admin@example.com", role: "controller" },
      token: "mock-token",
      role: "controller",
      isController: true,
      isViewer: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchRoleDemo: vi.fn(),
    });

    render(
      <TrialReportSessionList
        projectId="p1"
        joId="jo1"
        sessions={mockSessions}
        selectedId="session-1"
        onSelectSession={vi.fn()}
        printSelectedIds={["session-1"]}
        onTogglePrintSelect={vi.fn()}
        onCreateNew={vi.fn()}
        onDuplicate={vi.fn()}
        onDeleteSession={vi.fn()}
      />
    );

    expect(screen.getByTitle("Pilih untuk print")).toBeInTheDocument();
    expect(screen.getByText(/Print Terpilih/i)).toBeInTheDocument();
  });
});
