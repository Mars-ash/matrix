import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AddDataDialog } from "./add-data-dialog";
import { api } from "@/lib/api-client";

// Mock store
const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppDispatch: () => mockDispatch,
}));

// Mock api client
vi.mock("@/lib/api-client", () => ({
  api: {
    uploadOcrImage: vi.fn(),
  },
}));

describe("AddDataDialog Component - Failure & Consent Path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles 422 failure gracefully and displays Indonesian message without blank table", async () => {
    const user = userEvent.setup();

    // Mock API to simulate 422 rejection from backend
    const ocrError = new Error(
      "Tidak ada baris komponen BOM valid yang terdeteksi dari gambar. Pastikan gambar jelas dan memiliki tabel bergaris."
    );
    vi.mocked(api.uploadOcrImage).mockRejectedValueOnce(ocrError);

    render(
      <AddDataDialog
        open={true}
        onClose={vi.fn()}
        projectId="proj-1"
        joId="jo-1"
        categoryId="cat-1"
        categoryLabel="PARTS"
        categoryKind="Part"
      />
    );

    // 1. Choose Image Conversion mode
    const convBtn = screen.getByRole("button", { name: /Image Conversion/i });
    await user.click(convBtn);

    // 2. Select / stage an image file
    const file = new File(["fake-image-bytes"], "bom-sample.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 3. Staging preview appears with consent checkbox
    await waitFor(() => {
      expect(screen.getByText("bom-sample.png")).toBeInTheDocument();
    });

    // 4. Verify extraction button is disabled until consent is checked
    const extractBtn = screen.getByRole("button", { name: /Kirim & Ekstrak Gambar/i });
    expect(extractBtn).toBeDisabled();

    // 5. Check consent checkbox
    const consentCheckbox = screen.getByRole("checkbox");
    await user.click(consentCheckbox);
    expect(extractBtn).toBeEnabled();

    // 6. Click trigger to execute extraction
    await user.click(extractBtn);

    // 7. Verify API was called with consent=true
    await waitFor(() => {
      expect(api.uploadOcrImage).toHaveBeenCalledWith("cat-1", expect.any(File), true);
    });

    // 8. Verify the Indonesian error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Gagal mengekstrak: Tidak ada baris komponen BOM valid/i)
      ).toBeInTheDocument();
    });

    // 9. Confirm NO blank table exists (no table element rendered)
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    // 10. Confirm the empty-state actions and escape hatch to Manual Entry exist
    expect(screen.getByText("Tidak ada baris komponen yang dapat diekstrak secara otomatis.")).toBeInTheDocument();
    const manualSwitchBtn = screen.getByRole("button", { name: /Beralih ke Input Manual/i });
    expect(manualSwitchBtn).toBeInTheDocument();

    // 11. Click switch to Manual Entry
    await user.click(manualSwitchBtn);

    // 12. Modal seamlessly switches to manual entry mode
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByText("Description *")).toBeInTheDocument();
  });
});
