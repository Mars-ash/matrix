"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Dialog } from "./dialog";
import { ManualItemForm, emptyManualItemData, type ManualItemData } from "./manual-item-form";
import type { CategoryKind } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";

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

// Simulated extracted data for the Image Conversion demo
const SIMULATED_EXTRACTION = [
  { no: "1", description: "Insert Block A", dimension: "80×50×30", material: "SKD11", qty: 2, hrc: "58-60" },
  { no: "2", description: "Insert Block B", dimension: "80×50×30", material: "SKD11", qty: 2, hrc: "58-60" },
  { no: "3", description: "Guide Pin", dimension: "Ø12×60", material: "SK3", qty: 4, hrc: "" },
];

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

  // Manual entry state — shared form
  const [formData, setFormData] = useState<ManualItemData>(emptyManualItemData());
  const [manualError, setManualError] = useState("");

  // Conversion state
  const [convStep, setConvStep] = useState<"upload" | "preview">("upload");
  const [convRows, setConvRows] = useState(SIMULATED_EXTRACTION.map((r) => ({ ...r })));

  const reset = useCallback(() => {
    setMode("choose");
    setFormData(emptyManualItemData());
    setManualError("");
    setConvStep("upload");
    setConvRows(SIMULATED_EXTRACTION.map((r) => ({ ...r })));
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
        qty: formData.qty || 1,
        hrc: formData.hrc.trim(),
        isSubcont: formData.isSubcont || undefined,
        subcontNotes: formData.isSubcont ? formData.subcontNotes.trim() : undefined,
      },
      kind: categoryKind,
    });

    handleClose();
  }, [formData, dispatch, projectId, joId, categoryId, categoryKind, handleClose]);

  const handleConversionConfirm = useCallback(() => {
    const validRows = convRows.filter((r) => r.description.trim());
    if (validRows.length === 0) return;

    dispatch({
      type: "ADD_ITEMS_BATCH",
      projectId,
      joId,
      categoryId,
      items: validRows.map((r) => ({
        no: r.no || "-",
        description: r.description,
        dimension: r.dimension,
        material: r.material,
        qty: r.qty,
        hrc: r.hrc,
      })),
      kind: categoryKind,
    });

    handleClose();
  }, [convRows, dispatch, projectId, joId, categoryId, categoryKind, handleClose]);

  const updateConvRow = useCallback((idx: number, field: string, value: string) => {
    setConvRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === "qty" ? parseInt(value) || 0 : value };
      return next;
    });
  }, []);

  const handleAddConvRow = useCallback(() => {
    setConvRows((prev) => [
      ...prev,
      { no: "", description: "", dimension: "", material: "", qty: 1, hrc: "" },
    ]);
  }, []);

  useEffect(() => {
    if (!open || mode !== "conversion" || convStep !== "upload") return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setConvStep("preview");
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, mode, convStep]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Add Data — ${categoryLabel}`}
      footer={
        mode === "manual" ? (
          <>
            <button className="btn btn-secondary" onClick={() => setMode("choose")}>Back</button>
            <button className="btn btn-primary" onClick={handleManualSubmit}>Add Item</button>
          </>
        ) : mode === "conversion" && convStep === "preview" ? (
          <>
            <button className="btn btn-secondary" onClick={() => setConvStep("upload")}>Back</button>
            <button className="btn btn-primary" onClick={handleConversionConfirm}>
              Confirm Add ({convRows.filter((r) => r.description.trim()).length} items)
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
            onClick={() => { setMode("conversion"); setConvStep("upload"); }}
            style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Image Conversion
              <span className="badge" style={{ marginLeft: 8, background: "rgba(229, 166, 59, 0.15)", color: "var(--color-status-in-progress)", fontSize: 9 }} />
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
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.background = "var(--color-bg-hover)"; }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.background = "var(--color-bg-wash)"; }}
            onDrop={(e) => { e.preventDefault(); setConvStep("preview"); }}
          >
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files && e.target.files.length > 0) setConvStep("preview"); }} />
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>📁</span>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)", margin: 0 }}>Drag & drop image here</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>or click to browse files, or paste (Ctrl+V)</p>
          </label>
        </div>
      )}

      {mode === "conversion" && convStep === "preview" && (
        <div onKeyDown={(e) => { if (e.key === "Enter") handleConversionConfirm(); }}>
          <div className="badge" style={{ background: "rgba(229, 166, 59, 0.15)", color: "var(--color-status-in-progress)", padding: "4px 12px", marginBottom: 12 }}>
            edit rows before confirming
          </div>
          <div className="table-scroll">
            <table className="control-table">
              <thead>
                <tr>
                  <th>No</th><th>Description</th><th>Dimension</th><th>Material</th><th>Qty</th><th>HRc</th>
                </tr>
              </thead>
              <tbody>
                {convRows.map((row, idx) => (
                  <tr key={idx}>
                    <td><input className="input" value={row.no} onChange={(e) => updateConvRow(idx, "no", e.target.value)} style={{ width: 50, padding: "4px 6px" }} /></td>
                    <td><input className="input" value={row.description} onChange={(e) => updateConvRow(idx, "description", e.target.value)} style={{ minWidth: 120, padding: "4px 6px" }} /></td>
                    <td><input className="input" value={row.dimension} onChange={(e) => updateConvRow(idx, "dimension", e.target.value)} style={{ width: 100, padding: "4px 6px" }} /></td>
                    <td><input className="input" value={row.material} onChange={(e) => updateConvRow(idx, "material", e.target.value)} style={{ width: 80, padding: "4px 6px" }} /></td>
                    <td><input className="input" type="number" value={row.qty} onChange={(e) => updateConvRow(idx, "qty", e.target.value)} style={{ width: 50, padding: "4px 6px" }} /></td>
                    <td><input className="input" value={row.hrc} onChange={(e) => updateConvRow(idx, "hrc", e.target.value)} style={{ width: 70, padding: "4px 6px" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-secondary" onClick={handleAddConvRow} style={{ marginTop: 12, width: "100%", padding: 8, borderStyle: "dashed" }}>+ Add Row</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
