import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProjectEditDialog } from "./project-edit-dialog";
import type { Project } from "@/lib/types";

const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
}));

const testProject: Project = {
  id: "proj-123",
  name: "Original Mold Project",
  customer: "PT Honda Precision",
  company: "BMI",
  jos: [],
};

describe("ProjectEditDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with current project name prefilled", () => {
    render(<ProjectEditDialog open={true} onClose={vi.fn()} project={testProject} />);

    expect(screen.getByText("Edit Project Name")).toBeInTheDocument();
    const input = screen.getByLabelText(/Nama Project \*/i) as HTMLInputElement;
    expect(input.value).toBe("Original Mold Project");
    expect(screen.getByText(/PT Honda Precision/i)).toBeInTheDocument();
    expect(screen.getByText(/BMI/i)).toBeInTheDocument();
  });

  it("shows error when project name is empty upon submission", async () => {
    const user = userEvent.setup();
    render(<ProjectEditDialog open={true} onClose={vi.fn()} project={testProject} />);

    const input = screen.getByLabelText(/Nama Project \*/i);
    await user.clear(input);

    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan/i });
    await user.click(submitBtn);

    expect(screen.getByText("Nama project wajib diisi.")).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("successfully dispatches UPDATE_PROJECT and closes on valid submit", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProjectEditDialog open={true} onClose={onClose} project={testProject} />);

    const input = screen.getByLabelText(/Nama Project \*/i);
    await user.clear(input);
    await user.type(input, "Dies Hood Outer 2026");

    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan/i });
    await user.click(submitBtn);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_PROJECT",
      projectId: "proj-123",
      name: "Dies Hood Outer 2026",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when Batal button is clicked without dispatching", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProjectEditDialog open={true} onClose={onClose} project={testProject} />);

    const cancelBtn = screen.getByRole("button", { name: /Batal/i });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
