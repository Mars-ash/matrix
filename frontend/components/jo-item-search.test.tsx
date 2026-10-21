import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JoItemSearch } from "./jo-item-search";
import type { Category } from "@/lib/types";

describe("JoItemSearch component", () => {
  const categories: Category[] = [
    {
      id: "cat-1",
      label: "MAIN UNIT",
      kind: "Part",
      isCustom: false,
      items: [
        {
          id: "item-101",
          no: "01",
          description: "TOP DIE",
          dimension: "100x200",
          material: "SKD11",
          qty: 1,
          hrc: "-",
          controls: [],
        },
      ],
    },
    {
      id: "cat-2",
      label: "SPARE PART",
      kind: "Component",
      isCustom: false,
      items: [
        {
          id: "item-201",
          no: "02",
          description: "GUIDE PIN",
          dimension: "D12x50",
          material: "SUJ2",
          qty: 4,
          hrc: "-",
          controls: [],
        },
      ],
    },
  ];

  it("renders search container with elevated z-index", () => {
    const { container } = render(<JoItemSearch categories={categories} onSelect={vi.fn()} />);
    const searchContainer = container.querySelector(".jo-search-container");
    expect(searchContainer).toBeInTheDocument();
    expect(searchContainer).toHaveStyle({ position: "relative", zIndex: "40" });
  });

  it("shows results on typing and triggers onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(<JoItemSearch categories={categories} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText("Search items in this JO...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "TOP DIE" } });

    const resultBtn = screen.getByRole("button", { name: /TOP DIE/i });
    expect(resultBtn).toBeInTheDocument();

    fireEvent.click(resultBtn);
    expect(onSelect).toHaveBeenCalledWith("cat-1", "item-101");
  });
});
