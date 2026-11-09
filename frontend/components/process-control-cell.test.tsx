import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProcessControlCell } from "./process-control-cell";
import type { Control } from "@/lib/types";

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "1", name: "Staff", role: "controller" },
    isController: true,
    isViewer: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/store", () => ({
  useAppDispatch: () => vi.fn(),
}));

describe("ProcessControlCell Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseControl: Control = {
    id: "ctrl-1",
    process: "Machining",
    status: "In Progress",
    notes: "",
    photos: [],
  };

  it("does not render problem note indicator when status is In Progress", () => {
    render(
      <ProcessControlCell
        control={baseControl}
        projectId="proj-1"
        joId="jo-1"
        categoryId="cat-1"
        itemId="item-1"
        itemDescription="Plate Top"
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/Problem note for Plate Top - Machining/i)).not.toBeInTheDocument();
  });

  it("renders problem note indicator when status is Problem and opens dialog on click", () => {
    const problemControl: Control = {
      ...baseControl,
      status: "Problem",
      notes: "Pisau tumpul",
    };

    render(
      <ProcessControlCell
        control={problemControl}
        projectId="proj-1"
        joId="jo-1"
        categoryId="cat-1"
        itemId="item-1"
        itemDescription="Plate Top"
        onStatusChange={vi.fn()}
      />
    );

    const noteButton = screen.getByLabelText(/Problem note for Plate Top - Machining/i);
    expect(noteButton).toBeInTheDocument();
    expect(noteButton.querySelector("svg")).toBeInTheDocument();

    // Click note button to open dialog
    fireEvent.click(noteButton);

    expect(screen.getByText(/Catatan Problem — Plate Top → Machining/i)).toBeInTheDocument();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Pisau tumpul");
  });
});

