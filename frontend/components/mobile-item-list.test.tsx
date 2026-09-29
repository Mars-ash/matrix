import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileItemList } from "@/components/mobile-item-list";
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
const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
}));

const mockCategory: Category = {
  id: "cat-1",
  label: "PART",
  kind: "Part",
  isCustom: false,
  items: [
    {
      id: "item-1",
      no: "01",
      description: "TOP SHOE",
      dimension: "35X300X400",
      material: "SS400",
      qty: 1,
      hrc: "-",
      controls: [
        { process: "Material", status: "Done", notes: "" },
        { process: "Arrival", status: "In Progress", notes: "" },
        { process: "Machining", status: "Not Started", notes: "" },
      ],
    },
    {
      id: "item-2",
      no: "02",
      description: "PUNCH BENDING",
      dimension: "25X30X55",
      material: "SKD11",
      qty: 2,
      hrc: "58-60",
      controls: [
        { process: "Material", status: "Done", notes: "" },
        { process: "Arrival", status: "Done", notes: "" },
        { process: "Machining", status: "Problem", notes: "Tool broken" },
      ],
    },
  ],
};

describe("MobileItemList", () => {
  it("renders ultra-compact list of items with part numbers and descriptions", () => {
    render(
      <MobileItemList
        category={mockCategory}
        projectId="p-1"
        joId="j-1"
      />
    );

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("TOP SHOE")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("PUNCH BENDING")).toBeInTheDocument();
  });

  it("expands accordion to reveal process controls when tapped and collapses previous item", () => {
    render(
      <MobileItemList
        category={mockCategory}
        projectId="p-1"
        joId="j-1"
      />
    );

    // Initially accordion details are not expanded
    expect(screen.queryByTestId("accordion-details-item-1")).not.toBeInTheDocument();

    // Click on item-1 to expand
    const item1Trigger = screen.getByTestId("item-row-item-1");
    fireEvent.click(item1Trigger);

    // Item 1 is now expanded
    expect(screen.getByTestId("accordion-details-item-1")).toBeInTheDocument();

    // Click on item-2: single-open behavior should expand item-2 and collapse item-1
    const item2Trigger = screen.getByTestId("item-row-item-2");
    fireEvent.click(item2Trigger);

    expect(screen.getByTestId("accordion-details-item-2")).toBeInTheDocument();
    expect(screen.queryByTestId("accordion-details-item-1")).not.toBeInTheDocument();
  });

  it("filters items using the quick search input", () => {
    render(
      <MobileItemList
        category={mockCategory}
        projectId="p-1"
        joId="j-1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari part/i);
    fireEvent.change(searchInput, { target: { value: "BENDING" } });

    expect(screen.queryByText("TOP SHOE")).not.toBeInTheDocument();
    expect(screen.getByText("PUNCH BENDING")).toBeInTheDocument();
  });

  it("filters items by status chips", () => {
    render(
      <MobileItemList
        category={mockCategory}
        projectId="p-1"
        joId="j-1"
      />
    );

    const problemFilterBtn = screen.getByRole("button", { name: /Problem/i });
    fireEvent.click(problemFilterBtn);

    // Only item-2 has a Problem status in its controls
    expect(screen.queryByText("TOP SHOE")).not.toBeInTheDocument();
    expect(screen.getByText("PUNCH BENDING")).toBeInTheDocument();
  });

  it("calls onEditItem and onDeleteItem callbacks", () => {
    const onEditItem = vi.fn();
    const onDeleteItem = vi.fn();

    render(
      <MobileItemList
        category={mockCategory}
        projectId="p-1"
        joId="j-1"
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
      />
    );

    // Expand item-1
    fireEvent.click(screen.getByTestId("item-row-item-1"));

    const editBtn = screen.getByRole("button", { name: /Edit Part/i });
    fireEvent.click(editBtn);
    expect(onEditItem).toHaveBeenCalledWith(mockCategory.items[0]);

    const deleteBtn = screen.getByRole("button", { name: /Hapus Part/i });
    fireEvent.click(deleteBtn);
    expect(onDeleteItem).toHaveBeenCalledWith(mockCategory.items[0]);
  });
});
