import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ArchivePage from "./page";
import { useAppState, useAppDispatch, AppState } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  usePathname: () => "/archive",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/lib/store", () => ({
  useAppState: vi.fn(),
  useAppDispatch: vi.fn(),
}));

const mockAppStateWithArchive: AppState = {
  projects: [
    {
      id: "p-active",
      name: "Active Dies Project",
      customer: "PT Honda",
      company: "BKP",
      jos: [
        {
          id: "jo-active",
          joNumber: "JO-ACT-001",
          product: "Bumper Bracket",
          type: "PROGRESSIVE",
          targetDate: "2026-10-01",
          categories: [],
          activities: [],
        },
      ],
    },
    {
      id: "p-archived",
      name: "Finished Mold Project",
      customer: "PT Toyota",
      company: "BMI",
      jos: [
        {
          id: "jo-archived",
          joNumber: "JO-ARC-001",
          product: "Door Trim Mold",
          type: "PROGRESSIVE",
          targetDate: "2026-08-01",
          finishDate: "2026-08-15",
          categories: [
            {
              id: "cat-1",
              label: "PART",
              kind: "Part",
              isCustom: false,
              items: [
                {
                  id: "i-1",
                  no: "1",
                  description: "Mold Core",
                  dimension: "200x200",
                  material: "NAK80",
                  qty: 1,
                  hrc: "40",
                  controls: [
                    { process: "Material", status: "Done", notes: "" },
                  ],
                },
              ],
            },
          ],
          activities: [],
        },
      ],
    },
  ],
};

describe("ArchivePage", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
  });

  it("renders page header and only archived project/JOs", () => {
    vi.mocked(useAppState).mockReturnValue(mockAppStateWithArchive);

    render(
      <AuthProvider>
        <ArchivePage />
      </AuthProvider>
    );

    expect(screen.getByText("Archive — Project & JO")).toBeInTheDocument();
    expect(screen.getByText("Kembali ke Dashboard")).toBeInTheDocument();

    // Archived project and JO must be shown
    expect(screen.getByRole("heading", { name: /Finished Mold Project/i })).toBeInTheDocument();
    expect(screen.getByText("JO-ARC-001")).toBeInTheDocument();
    expect(screen.getByText("Door Trim Mold")).toBeInTheDocument();

    // Active project and JO should NOT be rendered in Archive
    expect(screen.queryByText("Active Dies Project")).not.toBeInTheDocument();
    expect(screen.queryByText("JO-ACT-001")).not.toBeInTheDocument();
  });

  it("filters archived JOs by search query", () => {
    vi.mocked(useAppState).mockReturnValue(mockAppStateWithArchive);

    render(
      <AuthProvider>
        <ArchivePage />
      </AuthProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Cari arsip JO \/ project/i);
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    expect(screen.queryByText("JO-ARC-001")).not.toBeInTheDocument();
    expect(screen.getByText(/Tidak ada data arsip yang sesuai dengan pencarian/i)).toBeInTheDocument();

    // Type matching search
    fireEvent.change(searchInput, { target: { value: "Door Trim" } });
    expect(screen.getByText("JO-ARC-001")).toBeInTheDocument();
  });

  it("renders empty state message when no JOs are archived", () => {
    const emptyArchiveState: AppState = {
      projects: [
        {
          id: "p-1",
          name: "Project 1",
          customer: "PT Toyota",
          company: "BKP",
              jos: [
            {
              id: "jo-1",
              joNumber: "JO-001",
              product: "Part 1",
              type: "PROGRESSIVE",
              targetDate: "2026-10-01",
              categories: [],
              activities: [],
            },
          ],
        },
      ],
    };

    vi.mocked(useAppState).mockReturnValue(emptyArchiveState);

    render(
      <AuthProvider>
        <ArchivePage />
      </AuthProvider>
    );

    expect(
      screen.getByText(/Belum ada project atau Job Order yang diarsipkan/i)
    ).toBeInTheDocument();
  });
});
