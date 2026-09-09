import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectCreateDialog } from "./project-create-dialog";

// Mock store dispatch
const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
}));

describe("ProjectCreateDialog Component", () => {
  it("renders the dialog with project fields and customer combobox", () => {
    render(<ProjectCreateDialog open={true} onClose={vi.fn()} />);

    expect(screen.getByText("Create New Project")).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project \(BMI \/ BKP\)/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Customer \*/i })).toBeInTheDocument();
  });

  it("shows validation error when submitted with empty fields", async () => {
    const user = userEvent.setup();
    render(<ProjectCreateDialog open={true} onClose={vi.fn()} />);

    const submitBtn = screen.getByRole("button", { name: /Create Project/i });
    await user.click(submitBtn);

    expect(screen.getByText("Project name is required.")).toBeInTheDocument();
    expect(screen.getByText("Customer name is required.")).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("successfully creates project when customer is selected from dropdown", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();

    render(<ProjectCreateDialog open={true} onClose={onClose} onCreated={onCreated} />);

    // Fill project name
    const nameInput = screen.getByLabelText(/Project Name \*/i);
    await user.type(nameInput, "Dies Bumper OP10");

    // Search and select customer in combobox
    const combobox = screen.getByRole("combobox", { name: /Customer \*/i });
    await user.click(combobox);
    await user.type(combobox, "toyota");

    const option = screen.getByRole("option", { name: /PT TOYOTA BOSHOKU INDONESIA/i });
    await user.click(option);

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Create Project/i });
    await user.click(submitBtn);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "CREATE_PROJECT",
        name: "Dies Bumper OP10",
        customer: "PT TOYOTA BOSHOKU INDONESIA",
        company: "BKP",
      })
    );
    expect(onClose).toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalled();
  });
});
