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

// Fallback extraction data for offline mode
const FALLBACK_EXTRACTION = [
  { no: "1", description: "Upper Die Plate", dimension: "450 x 300 x 45", material: "S50C", qty: 1, hrc: "-" },
  { no: "2", description: "Punch Holder Plate", dimension: "400 x 260 x 35", material: "SS400", qty: 1, hrc: "-" },
  { no: "3", description: "Stripper Plate", dimension: "400 x 260 x 25", material: "SKD11", qty: 1, hrc: "58-60" },
  { no: "4", description: "Die Plate Lower", dimension: "450 x 300 x 50", material: "SLD", qty: 1, hrc: "60-62" },
];

/**
 * Optimize / normalize image for OCR (max 2048px, JPEG quality 0.88).
 * Converts phone HEIC/large gallery photos to compact, high-clarity JPEG File.
 */
async function prepareImageForOcr(file: File): Promise<File> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
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
  const [convRows, setConvRows] = useState(FALLBACK_EXTRACTION.map((r) => ({ ...r })));
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const reset = useCallback(() => {
    setMode("choose");
    setFormData(emptyManualItemData());
    setManualError("");
    setConvStep("upload");
    setConvRows(FALLBACK_EXTRACTION.map((r) => ({ ...r })));
    setIsExtracting(false);
    setExtractionNotice("");
    setIsConfirming(false);
  }, []);

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

  const processFile = useCallback(
    async (rawFile: File) => {
      setIsExtracting(true);
      try {
        const file = await prepareImageForOcr(rawFile);
        const res = await api.uploadOcrImage(categoryId, file);
        if (res.items && res.items.length > 0) {
          setConvRows(res.items);
          if (res.provider === "offline_fallback") {
            setExtractionNotice(res.message || "Simulasi offline aktif. Silakan tinjau dan sesuaikan kolom sebelum konfirmasi.");
          } else {
            setExtractionNotice("");
          }
        } else {
          setConvRows(FALLBACK_EXTRACTION.map((r) => ({ ...r })));
          setExtractionNotice(res.message || "Tidak ada teks tabel terdeteksi. Menampilkan template simulasi.");
        }
      } catch (err: any) {
        console.error("OCR Extraction Error:", err);
        setConvRows(FALLBACK_EXTRACTION.map((r) => ({ ...r })));
        const errMsg = err?.message || "";
        if (errMsg.toLowerCase().includes("unauthenticated")) {
          setExtractionNotice("Sesi login tidak valid atau telah berakhir. Silakan login kembali sebagai Staff/Controller.");
        } else if (errMsg.toLowerCase().includes("forbidden")) {
          setExtractionNotice("Akses ditolak. Fitur Add Data hanya dapat dilakukan oleh role Staff / Controller.");
        } else {
          setExtractionNotice(
            errMsg
              ? `Peringatan (${errMsg}). Menampilkan template simulasi.`
              : "Gagal mengekstrak gambar. Menampilkan template simulasi."
          );
        }
      } finally {
        setIsExtracting(false);
        setConvStep("preview");
      }
    },
    [categoryId]
  );

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
    if (!open || mode !== "conversion" || convStep !== "upload") return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, mode, convStep, processFile]);

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
            <button className="btn btn-secondary" onClick={() => setConvStep("upload")}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConversionConfirm}
              disabled={isConfirming}
            >
              {isConfirming
                ? "Adding..."
                : `Confirm Add (${convRows.filter((r) => r.description.trim()).length} items)`}
            </button>
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
              Image Conversion
              <span
                className="badge"
                style={{
                  marginLeft: 8,
                  background: "rgba(37, 99, 235, 0.12)",
                  color: "var(--color-accent)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
              </span>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
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
                Extracting Data...
              </p>
            </div>
          ) : (
            <label
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "40px 20px",
                textAlign: "center",
                width: "100%",
                cursor: "pointer",
                background: "var(--color-bg-wash)",
                transition: "border-color 200ms, background 200ms",
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
                if (file) processFile(file);
              }}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = "";
                }}
              />
              <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>📄</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                Drop data list
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                or click to browse files (JPG, PNG, WebP), or press Ctrl+V to paste
              </p>
            </label>
          )}
        </div>
      )}

      {mode === "conversion" && convStep === "preview" && (
        <div onKeyDown={(e) => { if (e.key === "Enter") handleConversionConfirm(); }}>
          {extractionNotice && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
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
        </div>
      )}
    </Dialog>
  );
}
