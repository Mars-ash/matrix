"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import type { CategoryKind } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";

interface CategoryCreateDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
}

export function CategoryCreateDialog({ open, onClose, projectId, joId }: CategoryCreateDialogProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("Part");
  const [error, setError] = useState("");

  const handleClose = useCallback(() => {
    setName("");
    setKind("Part");
    setError("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    dispatch({
      type: "ADD_CATEGORY",
      projectId,
      joId,
      label: name.trim(),
      kind,
      isCustom: true,
    });

    handleClose();
  }, [name, kind, dispatch, projectId, joId, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add New Category"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Add Category</button>
        </>
      }
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
      >
        <div>
          <label className="label">Category Name *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            autoFocus
            placeholder="e.g. PART DIES OP 30"
          />
          {error && <p className="error-text">{error}</p>}
        </div>
        <div>
          <label className="label">Kind</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["Part", "Component"] as const).map((k) => (
              <button
                key={k}
                className={`btn ${kind === k ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setKind(k)}
                style={{ flex: 1 }}
              >
                {k}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
            {kind === "Part"
              ? "Part categories have 7 process controls: PO Mtl, Arrival, Machining, Hardening, Grinding, Wirecut, Assembly."
              : "Component categories have 2 process controls: PO, Arrival."}
          </p>
        </div>
      </div>
    </Dialog>
  );
}
