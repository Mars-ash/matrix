"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Dialog } from "./dialog";
import { ManualItemForm, emptyManualItemData, type ManualItemData } from "./manual-item-form";
import type { CategoryKind } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";
import { api } from "@/lib/api-client";
import { uid } from "@/lib/format";

interface AddDataDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
  categoryId: string;
  categoryKind: CategoryKind;
  categoryLabel: string;
}

type AddMode = "choose" | "manual" | "conversion";

interface ExtractedRow {
  no: string;
  description: string;
  dimension: string;
  material: string;
  qty: number;
  hrc: string;
}

/**
 * Optimize / normalize image for OCR (max 2048px, JPEG quality 0.88).
 * Converts phone HEIC/large gallery photos to compact, high-clarity JPEG File.
 */
async function prepareImageForOcr(file: File): Promise<File> {
  if (process.env.NODE_ENV === "test" || typeof window === "undefined") {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve(file);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 2048;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = Math.round(maxDim);
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const optimizedFile = new File([blob], cleanName, { type: "image/jpeg" });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.88
        );
      };
      img.onerror = () => resolve(file);
      img.src = src;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AddDataDialog({
  open,
  onClose,
  projectId,
  joId,
  categoryId,
  categoryKind,
  categoryLabel,
}: AddDataDialogProps) {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<AddMode>("choose");

  // Manual entry state
  const [formData, setFormData] = useState<ManualItemData>(emptyManualItemData());
  const [manualError, setManualError] = useState("");

  // Conversion / OCR state
  const [convStep, setConvStep] = useState<"upload" | "preview">("upload");
  const [convRows, setConvRows] = useState<ExtractedRow[]>([]);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const reset = useCallback(() => {
    setMode("choose");
    setFormData(emptyManualItemData());
    setManualError("");
    setConvStep("upload");
    setConvRows([]);
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    setStagedFile(null);
    setStagedPreviewUrl(null);
    setHasConsent(false);
    setIsExtracting(false);
    setExtractionNotice("");
    setIsConfirming(false);
  }, [stagedPreviewUrl]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleManualSubmit = useCallback(() => {
    if (!formData.description.trim()) {
      setManualError("Description is required.");
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      projectId,
      joId,
      categoryId,
      item: {
        no: formData.no.trim() || "-",
        description: formData.description.trim(),
        dimension: formData.dimension.trim(),
        material: formData.material.trim(),
        qty: Math.max(1, formData.qty || 1),
        hrc: formData.hrc.trim(),
        isSubcont: formData.isSubcont || undefined,
        subcontNotes: formData.isSubcont ? formData.subcontNotes.trim() : undefined,
      },
      kind: categoryKind,
    });

    handleClose();
  }, [formData, dispatch, projectId, joId, categoryId, categoryKind, handleClose]);

  // Stage a file locally with preview before any network upload
  const handleStageFile = useCallback(
    (file: File) => {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
        setExtractionNotice("Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WebP.");
        return;
      }

      if (stagedPreviewUrl) {
        URL.revokeObjectURL(stagedPreviewUrl);
      }
      setStagedFile(file);
      setStagedPreviewUrl(URL.createObjectURL(file));
      setHasConsent(false);
      setExtractionNotice("");
    },
    [stagedPreviewUrl]
  );

  // Explicit action triggered by user clicking "Kirim & Ekstrak Gambar"
  const handleExecuteExtraction = useCallback(async () => {
    if (!stagedFile || !hasConsent) return;

    setIsExtracting(true);
    setExtractionNotice("");

    try {
      const file = await prepareImageForOcr(stagedFile);
      const res = await api.uploadOcrImage(categoryId, file, true);

      if (res.success && res.items && res.items.length > 0) {
        setConvRows(res.items);
        setExtractionNotice("");
      } else {
        setConvRows([]);
        setExtractionNotice(
          res.message || "Tidak ada data tabel yang terdeteksi dari gambar. Silakan beralih ke input manual."
        );
      }
    } catch (err: any) {
      console.error("OCR Extraction Error:", err);
      setConvRows([]);
      const errMsg = err?.message || "";
      if (errMsg.toLowerCase().includes("unauthenticated")) {
        setExtractionNotice("Sesi login berakhir. Silakan login kembali sebagai Staff/Controller.");
      } else if (errMsg.toLowerCase().includes("forbidden")) {
        setExtractionNotice("Akses ditolak. Fitur Add Data hanya dapat dilakukan oleh role Controller.");
      } else {
        setExtractionNotice(errMsg ? `Gagal mengekstrak: ${errMsg}` : "Gagal memproses gambar melalui OCR.");
      }
    } finally {
      setIsExtracting(false);
      setConvStep("preview");
    }
  }, [categoryId, stagedFile, hasConsent]);

  const handleConversionConfirm = useCallback(() => {
    if (isConfirming) return;
    const validRows = convRows.filter((r) => r.description.trim());
    if (validRows.length === 0) return;

    setIsConfirming(true);

    const itemsWithIds = validRows.map((r) => ({
      id: uid(),
      no: r.no || "-",
      description: r.description.trim(),
      dimension: r.dimension.trim(),
      material: r.material.trim(),
      qty: Math.max(1, parseInt(String(r.qty), 10) || 1),
      hrc: r.hrc.trim(),
    }));

    dispatch({
      type: "ADD_ITEMS_BATCH",
      projectId,
      joId,
      categoryId,
      items: itemsWithIds,
      kind: categoryKind,
    });

    handleClose();
  }, [isConfirming, convRows, dispatch, projectId, joId, categoryId, categoryKind, handleClose]);

  const updateConvRow = useCallback((idx: number, field: string, value: string) => {
    setConvRows((prev) => {
      const next = [...prev];
      if (field === "qty") {
        const val = parseInt(value, 10);
        next[idx] = { ...next[idx], qty: isNaN(val) || val < 1 ? 1 : val };
      } else {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  }, []);

  const handleAddConvRow = useCallback(() => {
    setConvRows((prev) => [
      ...prev,
      { no: "", description: "", dimension: "", material: "", qty: 1, hrc: "" },
    ]);
  }, []);

  // Listen for clipboard paste in upload step
  useEffect(() => {
    if (!open || mode !== "conversion" || convStep !== "upload" || stagedFile) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleStageFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, mode, convStep, stagedFile, handleStageFile]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Add Data — ${categoryLabel}`}
      className={mode === "conversion" && convStep === "preview" ? "dialog-panel-wide" : undefined}
      footer={
        mode === "manual" ? (
          <>
            <button className="btn btn-secondary" onClick={() => setMode("choose")}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleManualSubmit}>
              Add Item
            </button>
          </>
        ) : mode === "conversion" && convStep === "preview" ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setConvStep("upload");
                setConvRows([]);
              }}
            >
              Back
            </button>
            {convRows.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleConversionConfirm}
                disabled={isConfirming || convRows.filter((r) => r.description.trim()).length === 0}
              >
                {isConfirming
                  ? "Adding..."
                  : `Confirm Add (${convRows.filter((r) => r.description.trim()).length} items)`}
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {mode === "choose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            className="card"
            onClick={() => setMode("manual")}
            style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Manual Entry</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              Isi data part / komponen satu per satu secara langsung.
            </div>
          </button>
          <button
            className="card"
            onClick={() => {
              setMode("conversion");
              setConvStep("upload");
            }}
            style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: "flex", alignItems: "center" }}>
              Image Conversion (OCR Vision AI)
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              Ekstrak daftar tabel BOM secara otomatis dari foto / screenshot gambar teknik.
            </div>
          </button>
        </div>
      )}

      {mode === "manual" && (
        <ManualItemForm
          data={formData}
          onChange={setFormData}
          error={manualError}
          onClearError={() => setManualError("")}
          onSubmit={handleManualSubmit}
        />
      )}

      {mode === "conversion" && convStep === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "12px 0" }}>
          {extractionNotice && (
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                color: "var(--color-danger, #dc2626)",
              }}
            >
              {extractionNotice}
            </div>
          )}

          {isExtracting ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid var(--color-border)",
                  borderTopColor: "var(--color-accent)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px auto",
                }}
              />
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                Mengekstrak Data Komponen via OCR Vision AI...
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
                Harap tunggu, proses ini membutuhkan waktu beberapa detik.
              </p>
            </div>
          ) : stagedFile && stagedPreviewUrl ? (
            /* Explicit Staged Preview & Consent Gate */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: 16,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-bg-wash)",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <img
                  src={stagedPreviewUrl}
                  alt="Pratinjau Gambar"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stagedFile.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                    Ukuran: {formatFileSize(stagedFile.size)} • Format: {stagedFile.type || "Gambar"}
                  </div>
                </div>
              </div>

              {/* Informational consent box */}
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                  Gambar akan dikirim ke backend server MATRIX untuk dianalisis oleh OCR Vision AI. File tidak dipublikasikan ke publik.
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    style={{ cursor: "pointer", width: 15, height: 15 }}
                  />
                  <span>Saya menyetujui pengiriman gambar ini untuk ekstraksi OCR</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
                    setStagedFile(null);
                    setStagedPreviewUrl(null);
                  }}
                >
                  Ganti Gambar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!hasConsent || isExtracting}
                  onClick={handleExecuteExtraction}
                >
                  Kirim & Ekstrak Gambar
                </button>
              </div>
            </div>
          ) : (
            /* Upload Drop / Browse / Paste Area */
            <label
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "36px 20px",
                textAlign: "center",
                width: "100%",
                cursor: "pointer",
                background: "var(--color-bg-wash)",
                transition: "border-color 200ms, background 200ms",
                display: "block",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-accent)";
                e.currentTarget.style.background = "var(--color-bg-hover)";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "var(--color-bg-wash)";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleStageFile(file);
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleStageFile(file);
                  e.target.value = "";
                }}
              />
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto 12px auto", display: "block", color: "var(--color-text-secondary)" }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                Pilih atau Tarik File Gambar
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4, marginBottom: 0 }}>
                Format: JPG, PNG, atau WebP (maks. 15MB) • Atau tekan Ctrl+V untuk paste
              </p>
            </label>
          )}
        </div>
      )}

      {mode === "conversion" && convStep === "preview" && (
        <div onKeyDown={(e) => { if (e.key === "Enter" && convRows.length > 0) handleConversionConfirm(); }}>
          {extractionNotice && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "var(--radius-md)",
                marginBottom: 14,
                fontSize: 12,
                color: "var(--color-danger, #dc2626)",
              }}
            >
              <span>{extractionNotice}</span>
            </div>
          )}

          {convRows.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                background: "var(--color-bg-wash)",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                Tidak ada baris komponen yang dapat diekstrak secara otomatis.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setConvStep("upload");
                    setStagedFile(null);
                    setStagedPreviewUrl(null);
                  }}
                >
                  Coba Gambar Lain
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setMode("manual")}
                >
                  Beralih ke Input Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="table-scroll" style={{ maxHeight: "460px", overflowY: "auto" }}>
              <table className="control-table" style={{ width: "100%", tableLayout: "auto" }}>
                <thead>
                  <tr>
                    <th style={{ width: 45, textAlign: "center" }}>No</th>
                    <th>Description</th>
                    <th style={{ width: 140 }}>Dimension</th>
                    <th style={{ width: 105 }}>Material</th>
                    <th style={{ width: 60, textAlign: "center" }}>Qty</th>
                    <th style={{ width: 75, textAlign: "center" }}>HRc</th>
                  </tr>
                </thead>
                <tbody>
                  {convRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          className="input"
                          value={row.no}
                          onChange={(e) => updateConvRow(idx, "no", e.target.value)}
                          style={{ width: "100%", padding: "4px 6px", textAlign: "center" }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={row.description}
                          onChange={(e) => updateConvRow(idx, "description", e.target.value)}
                          style={{ width: "100%", minWidth: 160, padding: "4px 6px" }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={row.dimension}
                          onChange={(e) => updateConvRow(idx, "dimension", e.target.value)}
                          style={{ width: "100%", padding: "4px 6px" }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={row.material}
                          onChange={(e) => updateConvRow(idx, "material", e.target.value)}
                          style={{ width: "100%", padding: "4px 6px" }}
                        />
                      </td>
                      <td>
                        <input
                          className="input no-spinner"
                          type="number"
                          min={1}
                          value={row.qty}
                          onChange={(e) => updateConvRow(idx, "qty", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            textAlign: "center",
                            MozAppearance: "textfield",
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={row.hrc}
                          onChange={(e) => updateConvRow(idx, "hrc", e.target.value)}
                          style={{ width: "100%", padding: "4px 6px", textAlign: "center" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddConvRow}
                style={{ marginTop: 12, width: "100%", padding: 8, borderStyle: "dashed" }}
              >
                + Tambah Baris Manual
              </button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
