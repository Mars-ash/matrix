import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PartnerManagementDialog } from "./partner-management-dialog";
import { api } from "@/lib/api-client";
import type { Partner } from "@/lib/types";

vi.mock("@/lib/api-client", () => ({
  api: {
    getPartners: vi.fn(),
    createPartner: vi.fn(),
    updatePartner: vi.fn(),
    deletePartner: vi.fn(),
  },
}));

const mockPartners: Partner[] = [
  { id: "1", name: "PT Honda Motor", type: "customer", status: "active" },
  { id: "2", name: "PT Yamaha Motor", type: "customer", status: "discontinued" },
  { id: "3", name: "CV Three Jaya", type: "supplier_po", status: "active" },
  { id: "4", name: "CHIYODA", type: "supplier_subcont", status: "active" },
];

describe("PartnerManagementDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getPartners as any).mockResolvedValue([...mockPartners]);
  });

  it("renders the dialog with 3 tabs and displays customer partners by default", async () => {
    render(<PartnerManagementDialog open={true} onClose={vi.fn()} />);

    expect(screen.getByText("Customer & Supplier")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Customer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Supp PO/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Supp SC/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("PT Honda Motor")).toBeInTheDocument();
      expect(screen.getByText("PT Yamaha Motor")).toBeInTheDocument();
    });

    // Should not show supplier_po in customer tab
    expect(screen.queryByText("CV Three Jaya")).not.toBeInTheDocument();
  });

  it("switches tabs and displays respective partners", async () => {
    const user = userEvent.setup();
    render(<PartnerManagementDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("PT Honda Motor")).toBeInTheDocument();
    });

    // Click Supp PO tab
    const poTab = screen.getByRole("button", { name: /Supp PO/i });
    await user.click(poTab);

    expect(screen.getByText("CV Three Jaya")).toBeInTheDocument();
    expect(screen.queryByText("PT Honda Motor")).not.toBeInTheDocument();

    // Click Supp SC tab
    const scTab = screen.getByRole("button", { name: /Supp SC/i });
    await user.click(scTab);

    expect(screen.getByText("CHIYODA")).toBeInTheDocument();
  });

  it("adds a new partner using inline add bar", async () => {
    const user = userEvent.setup();
    const newPartner: Partner = {
      id: "5",
      name: "PT Baru Mandiri",
      type: "customer",
      status: "active",
    };
    (api.createPartner as any).mockResolvedValue({ data: newPartner, message: "OK" });

    render(<PartnerManagementDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("PT Honda Motor")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ketik nama customer baru/i);
    await user.type(input, "PT Baru Mandiri");

    const addBtn = screen.getByRole("button", { name: /\+ Add/i });
    await user.click(addBtn);

    expect(api.createPartner).toHaveBeenCalledWith({
      name: "PT Baru Mandiri",
      type: "customer",
      status: "active",
    });

    await waitFor(() => {
      expect(screen.getByText("PT Baru Mandiri")).toBeInTheDocument();
    });
  });

  it("toggles partner status between active and discontinued", async () => {
    const user = userEvent.setup();
    (api.updatePartner as any).mockResolvedValue({
      data: { ...mockPartners[0], status: "discontinued" },
      message: "OK",
    });

    render(<PartnerManagementDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("PT Honda Motor")).toBeInTheDocument();
    });

    const activeBadge = screen.getByText("Active");
    await user.click(activeBadge);

    expect(api.updatePartner).toHaveBeenCalledWith("1", { status: "discontinued" });
  });

  it("deletes a partner after confirmation", async () => {
    const user = userEvent.setup();
    (api.deletePartner as any).mockResolvedValue({ message: "Deleted" });

    render(<PartnerManagementDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("PT Honda Motor")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Hapus Mitra");
    await user.click(deleteButtons[0]);

    // Modal confirm appears
    expect(screen.getByText("Hapus Data Mitra")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "Hapus" });
    await user.click(confirmBtn);

    expect(api.deletePartner).toHaveBeenCalledWith("1");

    await waitFor(() => {
      expect(screen.queryByText("PT Honda Motor")).not.toBeInTheDocument();
    });
  });
});
