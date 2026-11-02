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
      description: "First Oldest Item",
      dimension: "10x10",
      material: "SS400",
      qty: 1,
      hrc: "-",
      createdAt: "2026-08-01T10:00:00Z",
      controls: [{ process: "Material", status: "Not Started", notes: "" }],
    },
    {
      id: "item-2",
      no: "02",
      description: "Second Middle Item",
      dimension: "20x20",
      material: "S45C",
      qty: 1,
      hrc: "-",
      createdAt: "2026-08-05T10:00:00Z",
      controls: [{ process: "Material", status: "Not Started", notes: "" }],
    },
    {
      id: "item-3",
      no: "03",
      description: "Third Newest Item",
      dimension: "30x30",
      material: "SKD11",
      qty: 1,
      hrc: "-",
      createdAt: "2026-08-10T10:00:00Z",
      controls: [{ process: "Material", status: "Not Started", notes: "" }],
    },
  ],
};

describe("ControlTable Sorting Functionality", () => {
  it("renders default order and cycles through Paling Terbaru, Terlama, and Default on button click", () => {
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
      "First Oldest Item",
      "Second Middle Item",
      "Third Newest Item",
    ]);
    expect(screen.getByText("Urutkan: Default")).toBeInTheDocument();

    const sortButton = screen.getByRole("button", { name: "Urutan Default" });
    expect(sortButton).toBeInTheDocument();

    // 2. Click 1 -> Switch to Paling Terbaru (newest first)
    fireEvent.click(sortButton);

    expect(screen.getByText("Paling Terbaru")).toBeInTheDocument();
    expect(getItemDescriptions()).toEqual([
      "Third Newest Item",
      "Second Middle Item",
      "First Oldest Item",
    ]);

    // 3. Click 2 -> Switch to Terlama (oldest first)
    fireEvent.click(sortButton);

    expect(screen.getByText("Terlama")).toBeInTheDocument();
    expect(getItemDescriptions()).toEqual([
      "First Oldest Item",
      "Second Middle Item",
      "Third Newest Item",
    ]);

    // 4. Click 3 -> Cycle back to Default
    fireEvent.click(sortButton);

    expect(screen.getByText("Urutkan: Default")).toBeInTheDocument();
    expect(getItemDescriptions()).toEqual([
      "First Oldest Item",
      "Second Middle Item",
      "Third Newest Item",
    ]);
  });
});
