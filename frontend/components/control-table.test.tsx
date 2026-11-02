import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ControlTable } from "@/components/control-table";
import type { Category } from "@/lib/types";

// Mock auth hook
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { role: "controller", username: "staff" },
    isController: true,
    isViewer: false,
    logout: vi.fn(),
  }),
}));

// Mock app dispatch
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => vi.fn(),
}));

const mockCategory: Category = {
  id: "cat-test",
  label: "PART",
  kind: "Part",
  isCustom: false,
  items: [
    {
      id: "item-1",
      no: "01",
      description: "First Added - But Last Updated",
      dimension: "10x10",
      material: "SS400",
      qty: 1,
      hrc: "-",
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-20T10:00:00Z", // Most recently updated!
      controls: [{ process: "Material", status: "Not Started", notes: "" }],
    },
    {
      id: "item-2",
      no: "02",
      description: "Second Added - Middle Updated",
      dimension: "20x20",
      material: "S45C",
      qty: 1,
      hrc: "-",
      createdAt: "2026-08-05T10:00:00Z",
      updatedAt: "2026-08-05T10:00:00Z",
      controls: [{ process: "Material", status: "Not Started", notes: "" }],
    },
    {
      id: "item-3",
      no: "03",
      description: "Third Added - Oldest Updated",
      dimension: "30x30",
      material: "SKD11",
      qty: 1,
      hrc: "-",
      createdAt: "2026-08-10T10:00:00Z",
      updatedAt: "2026-08-02T10:00:00Z", // Created newest, but updated oldest
      controls: [{ process: "Material", status: "Not Started", notes: "" }],
    },
  ],
};

describe("ControlTable Sorting Functionality", () => {
  it("renders default order and cycles through Terbaru, Terlama, and Default based on updatedAt", () => {
    const { container } = render(
      <ControlTable
        category={mockCategory}
        projectId="p-1"
        joId="jo-1"
        onAddData={vi.fn()}
      />
    );

    // Helper to get descriptions from rendered table rows
    const getItemDescriptions = () => {
      const rows = container.querySelectorAll("tbody tr");
      return Array.from(rows).map((row) => {
        const descCell = row.querySelector(".td-sticky-desc");
        return descCell?.textContent?.trim();
      });
    };

    // 1. Initial Default State
    expect(getItemDescriptions()).toEqual([
      "First Added - But Last Updated",
      "Second Added - Middle Updated",
      "Third Added - Oldest Updated",
    ]);
    expect(screen.getByText("Default")).toBeInTheDocument();

    const sortButton = screen.getByRole("button", { name: "Urutan Default" });
    expect(sortButton).toBeInTheDocument();

    // 2. Click 1 -> Switch to Terbaru (most recently updated first: item-1 at Aug 20, then item-2 at Aug 5, then item-3 at Aug 2)
    fireEvent.click(sortButton);

    expect(screen.getByText("Terbaru")).toBeInTheDocument();
    expect(getItemDescriptions()).toEqual([
      "First Added - But Last Updated",
      "Second Added - Middle Updated",
      "Third Added - Oldest Updated",
    ]);

    // 3. Click 2 -> Switch to Terlama (oldest updated first: item-3 at Aug 2, then item-2 at Aug 5, then item-1 at Aug 20)
    fireEvent.click(sortButton);

    expect(screen.getByText("Terlama")).toBeInTheDocument();
    expect(getItemDescriptions()).toEqual([
      "Third Added - Oldest Updated",
      "Second Added - Middle Updated",
      "First Added - But Last Updated",
    ]);

    // 4. Click 3 -> Cycle back to Default
    fireEvent.click(sortButton);

    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(getItemDescriptions()).toEqual([
      "First Added - But Last Updated",
      "Second Added - Middle Updated",
      "Third Added - Oldest Updated",
    ]);
  });
});
