"use client";
import React from "react";

export interface ManualItemData {
  no: string;
  description: string;
  dimension: string;
  material: string;
  qty: number;
  hrc: string;
  isSubcont: boolean;
  subcontNotes: string;
  arrivalTargetDate: string;
}

interface ManualItemFormProps {
  data: ManualItemData;
  onChange: (data: ManualItemData) => void;
  error?: string;
  onClearError?: () => void;
  /** If true, Enter key submits (skips when focus is on textarea). */
  onSubmit?: () => void;
  autoFocusDescription?: boolean;
}

export function ManualItemForm({
  data,
  onChange,
  error,
  onClearError,
  onSubmit,
  autoFocusDescription = true,
}: ManualItemFormProps) {
  const update = <K extends keyof ManualItemData>(key: K, value: ManualItemData[K]) => {
    onChange({ ...data, [key]: value });
    if (key === "description" && onClearError) onClearError();
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          onSubmit &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
          onSubmit();
        }
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8 }}>
        <div>
          <label className="label">No</label>
          <input
            className="input"
            value={data.no}
            onChange={(e) => update("no", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Description *</label>
          <input
            className="input"
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            autoFocus={autoFocusDescription}
          />
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label className="label">Dimension</label>
          <input
            className="input"
            value={data.dimension}
            onChange={(e) => update("dimension", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Material</label>
          <input
            className="input"
            value={data.material}
            onChange={(e) => update("material", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label className="label">Qty</label>
          <input
            className="input"
            type="number"
            min={1}
            value={data.qty}
            onChange={(e) => update("qty", Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div>
          <label className="label">HRc</label>
          <input
            className="input"
            value={data.hrc}
            onChange={(e) => update("hrc", e.target.value)}
          />
        </div>
      </div>

      {/* Subcont fields */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 0 0",
          borderTop: "1px solid var(--color-border-subtle)",
        }}
      >
        <input
          type="checkbox"
          id="manual-subcont"
          checked={data.isSubcont}
          onChange={(e) => update("isSubcont", e.target.checked)}
          style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
        />
        <label
          htmlFor="manual-subcont"
          style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          Subcont
        </label>
      </div>

      {data.isSubcont && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="label">Keterangan Subcont</label>
            <textarea
              className="input"
              value={data.subcontNotes}
              onChange={(e) => update("subcontNotes", e.target.value)}
              rows={2}
              placeholder="Catatan subcont..."
            />
          </div>
          <div>
            <label className="label">Target Arrival</label>
            <input
              type="date"
              className="input"
              value={data.arrivalTargetDate}
              onChange={(e) => update("arrivalTargetDate", e.target.value)}
              style={{ maxWidth: 200 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Create empty form state. */
export function emptyManualItemData(): ManualItemData {
  return {
    no: "",
    description: "",
    dimension: "",
    material: "",
    qty: 1,
    hrc: "",
    isSubcont: false,
    subcontNotes: "",
    arrivalTargetDate: "",
  };
}
