import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProblemNoteDialog } from "./problem-note-dialog";
import { useAuth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

describe("ProblemNoteDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders read-only note for Viewer without textarea", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, name: "Viewer", email: "viewer@matrix.com", role: "viewer" },
      token: "tok",
      role: "viewer",
      isController: false,
      isViewer: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProblemNoteDialog
        open={true}
        onClose={vi.fn()}
        itemDescription="Plate Top Die"
        process="Machining"
        notes="Pisau patah saat milling"
      />
    );

    expect(screen.getByText(/Catatan Problem — Plate Top Die → Machining/i)).toBeInTheDocument();
    expect(screen.getByText("Pisau patah saat milling")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tutup/i })).toBeInTheDocument();
  });

  it("renders editable textarea for Controller with initial notes", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, name: "Staff", email: "staff@matrix.com", role: "controller" },
      token: "tok",
      role: "controller",
      isController: true,
      isViewer: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProblemNoteDialog
        open={true}
        onClose={vi.fn()}
        itemDescription="Plate Top Die"
        process="Machining"
        notes="Menunggu part pengganti"
      />
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe("Menunggu part pengganti");
  });

  it("triggers debounced auto-save when controller edits textarea", async () => {
    vi.useFakeTimers();
    const handleSave = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, name: "Staff", email: "staff@matrix.com", role: "controller" },
      token: "tok",
      role: "controller",
      isController: true,
      isViewer: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProblemNoteDialog
        open={true}
        onClose={vi.fn()}
        itemDescription="Plate Top Die"
        process="Machining"
        notes="Awalnya masalah A"
        onSaveNotes={handleSave}
      />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Update: Sudah diganti pisau baru" } });

    // Not saved immediately before debounce
    expect(handleSave).not.toHaveBeenCalled();

    // Fast forward timer past debounce (600ms)
    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(handleSave).toHaveBeenCalledWith("Update: Sudah diganti pisau baru");
    vi.useRealTimers();
  });

  it("shows error when notes are cleared completely and does not save empty string", () => {
    const handleSave = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, name: "Staff", email: "staff@matrix.com", role: "controller" },
      token: "tok",
      role: "controller",
      isController: true,
      isViewer: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProblemNoteDialog
        open={true}
        onClose={vi.fn()}
        itemDescription="Plate Top Die"
        process="Machining"
        notes="Ada kendala"
        onSaveNotes={handleSave}
      />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "   " } });

    expect(screen.getByText(/Catatan tidak boleh kosong saat status Problem/i)).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("calls onClose when Tutup button is clicked", async () => {
    const handleClose = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, name: "Staff", email: "staff@matrix.com", role: "controller" },
      token: "tok",
      role: "controller",
      isController: true,
      isViewer: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProblemNoteDialog
        open={true}
        onClose={handleClose}
        itemDescription="Plate Top Die"
        process="Machining"
        notes="Kendala proses"
      />
    );

    const closeBtn = screen.getByRole("button", { name: /Tutup/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
