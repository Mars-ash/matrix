import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TrackerAddItemDialog } from "./tracker-add-item-dialog";
import { api } from "@/lib/api-client";
import type { Project } from "@/lib/types";

const mockDispatch = vi.fn();
const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Mercedes",
    customer: "PT Astra",
    company: "BKP",
    jos: [
      {
        id: "j1",
        joNumber: "126.110",
        product: "Bracket Die",
        type: "PROGRESSIVE",
        activities: [],
        categories: [
          {
            id: "cat-1",
            label: "PART DIES",
            kind: "Part",
            isCustom: false,
            items: [],
          },
          {
            id: "cat-2",
            label: "COMPONENT",
            kind: "Component",
            isCustom: false,
            items: [],
          },
        ],
      },
    ],
  },
];

vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
  useAppState: () => ({
    projects: mockProjects,
  }),
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    createTrackerItem: vi.fn(),
  },
}));

describe("TrackerAddItemDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitting with empty description shows the error and does not call the API", async () => {
    const user = userEvent.setup();
    render(<TrackerAddItemDialog open={true} onClose={vi.fn()} tracker="po" />);

    const submitBtn = screen.getByRole("button", { name: "Tambah Item" });
    await user.click(submitBtn);

    expect(screen.getByText("Description is required.")).toBeInTheDocument();
    expect(api.createTrackerItem).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("submitting with no JO calls createTrackerItem with categoryId: undefined and default kind Part", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    (api.createTrackerItem as any).mockResolvedValueOnce({
      data: {
        project: mockProjects[0],
        jo: mockProjects[0].jos[0],
        category: mockProjects[0].jos[0].categories[0],
        item: { id: "item-new", description: "Guide Pin", controls: [] },
      },
      message: "Item added.",
    });

    render(<TrackerAddItemDialog open={true} onClose={onClose} tracker="po" />);

    // Type description
    const descInput = screen.getByRole("textbox", { name: /Description \*/i });
    await user.type(descInput, "Guide Pin");

    const submitBtn = screen.getByRole("button", { name: "Tambah Item" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.createTrackerItem).toHaveBeenCalledWith(
        expect.objectContaining({
          tracker: "po",
          categoryId: undefined,
          kind: "Part",
          description: "Guide Pin",
        })
      );
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "INSERT_TRACKER_ITEM",
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("choosing a JO shows the category select and the request carries categoryId", async () => {
    const user = userEvent.setup();
    (api.createTrackerItem as any).mockResolvedValueOnce({
      data: {
        project: mockProjects[0],
        jo: mockProjects[0].jos[0],
        category: mockProjects[0].jos[0].categories[0],
        item: { id: "item-new", description: "Punch", controls: [] },
      },
      message: "Item added.",
    });

    render(<TrackerAddItemDialog open={true} onClose={vi.fn()} tracker="po" />);

    // Open JoPicker and pick JO
    const joCombobox = screen.getByRole("combobox");
    await user.click(joCombobox);

    const joOption = screen.getByText("JO 126.110 — Bracket Die");
    await user.click(joOption);

    // Category select appears
    const catSelect = screen.getByRole("combobox", { name: "Kategori" });
    expect(catSelect).toBeInTheDocument();
    expect(catSelect).toHaveValue("cat-1");

    // Select COMPONENT category
    await user.selectOptions(catSelect, "cat-2");

    // Fill description
    const descInput = screen.getByRole("textbox", { name: /Description \*/i });
    await user.type(descInput, "Punch");

    const submitBtn = screen.getByRole("button", { name: "Tambah Item" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.createTrackerItem).toHaveBeenCalledWith(
        expect.objectContaining({
          tracker: "po",
          categoryId: "cat-2",
          kind: undefined,
          description: "Punch",
        })
      );
    });
  });

  it("does not render kind toggle in the form", () => {
    const { rerender } = render(
      <TrackerAddItemDialog open={true} onClose={vi.fn()} tracker="po" />
    );

    expect(screen.queryByRole("button", { name: "Part (PO Mtl)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Component (PO)" })).not.toBeInTheDocument();

    rerender(<TrackerAddItemDialog open={true} onClose={vi.fn()} tracker="subcont" />);

    expect(screen.queryByRole("button", { name: "Part (PO Mtl)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Component (PO)" })).not.toBeInTheDocument();
  });

  it("API rejection keeps the dialog open and shows the message", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    (api.createTrackerItem as any).mockRejectedValueOnce(
      new Error("Server error occurred.")
    );

    render(<TrackerAddItemDialog open={true} onClose={onClose} tracker="subcont" />);

    const descInput = screen.getByRole("textbox", { name: /Description \*/i });
    await user.type(descInput, "Special Insert");

    const submitBtn = screen.getByRole("button", { name: "Tambah Item" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Server error occurred.")).toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(descInput).toHaveValue("Special Insert");
  });

  it("a double click on 'Tambah Item' calls the API once", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (api.createTrackerItem as any).mockReturnValueOnce(promise);

    render(<TrackerAddItemDialog open={true} onClose={vi.fn()} tracker="po" />);

    const descInput = screen.getByRole("textbox", { name: /Description \*/i });
    fireEvent.change(descInput, { target: { value: "Double Click Item" } });

    const submitBtn = screen.getByRole("button", { name: "Tambah Item" });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(api.createTrackerItem).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise!({
        data: {
          project: mockProjects[0],
          jo: mockProjects[0].jos[0],
          category: mockProjects[0].jos[0].categories[0],
          item: { id: "item-new", description: "Double Click Item", controls: [] },
        },
        message: "Item added.",
      });
    });
  });
});
