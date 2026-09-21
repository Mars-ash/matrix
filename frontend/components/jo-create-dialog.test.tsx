import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { JoCreateDialog } from "./jo-create-dialog";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock store
const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
  useAppState: () => ({
    projects: [
      {
        id: "proj-123",
        name: "Test Project",
        customer: "Customer A",
        jos: [],
      },
    ],
  }),
}));

describe("JoCreateDialog Component Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires Target Date and at least 1 Category", async () => {
    const user = userEvent.setup();
    render(<JoCreateDialog open={true} onClose={vi.fn()} projectId="proj-123" />);

    // Fill JO Number, Product, Type
    const inputs = screen.getAllByRole("textbox");
    // inputs: [joNumber, product]
    await user.type(inputs[0], "JO-888");
    await user.type(inputs[1], "Bracket Front");

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "PROGRESSIVE");

    // Attempt to submit without Target Date and Category
    const submitBtn = screen.getByRole("button", { name: /Create JO/i });
    await user.click(submitBtn);

    expect(screen.getByText("Target date is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Minimal 1 kategori (Part/Component) wajib dipilih.")
    ).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  }, 15000);

  it("successfully creates JO when Target Date and 1 standard Category are provided", async () => {
    const user = userEvent.setup();
    render(<JoCreateDialog open={true} onClose={vi.fn()} projectId="proj-123" />);

    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "JO-888");
    await user.type(textboxes[1], "Bracket Front");

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "PROGRESSIVE");

    // Fill date
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2026-12-15");

    // Select 1 category pill (e.g., PART DIES)
    const partPill = screen.getByRole("button", { name: "PART DIES" });
    await user.click(partPill);

    const submitBtn = screen.getByRole("button", { name: /Create JO/i });
    await user.click(submitBtn);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "CREATE_JO",
        projectId: "proj-123",
        joNumber: "JO-888",
        product: "Bracket Front",
        joType: "PROGRESSIVE",
        targetDate: "2026-12-15",
        categories: expect.arrayContaining([
          expect.objectContaining({ label: "PART DIES", kind: "Part" }),
        ]),
      })
    );
  }, 15000);

  it("successfully creates JO when Custom Category is provided (Option A: counts as 1 category)", async () => {
    const user = userEvent.setup();
    render(<JoCreateDialog open={true} onClose={vi.fn()} projectId="proj-123" />);

    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "JO-889");
    await user.type(textboxes[1], "Panel Rear");

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "TANDEM");

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2026-12-20");

    // Enable custom category checkbox
    const customCheckbox = screen.getByRole("checkbox", { name: /Add Custom Category/i });
    await user.click(customCheckbox);

    // Fill custom category name
    const customNameInput = screen.getByPlaceholderText("Category name");
    await user.type(customNameInput, "CUSTOM SPAREPARTS");

    const submitBtn = screen.getByRole("button", { name: /Create JO/i });
    await user.click(submitBtn);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "CREATE_JO",
        projectId: "proj-123",
        joNumber: "JO-889",
        product: "Panel Rear",
        joType: "TANDEM",
        targetDate: "2026-12-20",
        categories: expect.arrayContaining([
          expect.objectContaining({
            label: "CUSTOM SPAREPARTS",
            kind: "Part",
            isCustom: true,
          }),
        ]),
      })
    );
  }, 15000);
});
