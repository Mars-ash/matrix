"use client";
import React, { useState, useCallback, useMemo } from "react";
import { Dialog } from "./dialog";
import type { CategoryKind } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";
import { COMMON_PART_SUGGESTIONS, COMMON_COMPONENT_SUGGESTIONS } from "@/lib/category";

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

  const suggestions = useMemo(() => {
    return kind === "Part" ? COMMON_PART_SUGGESTIONS : COMMON_COMPONENT_SUGGESTIONS;
  }, [kind]);

  const handleClose = useCallback(() => {
    setName("");
    setKind("Part");
    setError("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
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

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setName(suggestion);
    setError("");
  }, []);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Tambah Kategori Baru"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Tambah Kategori
          </button>
        </>
      }
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      >
        <div>
          <label className="label">Jenis Kategori (Kind)</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["Part", "Component"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`btn ${kind === k ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setKind(k)}
                style={{ flex: 1 }}
              >
                {k === "Part" ? "Part (Proses Standar)" : "Component (Beli / Subcont)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Nama Kategori *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Contoh: Part, Part Dies OP 10, Component"
            autoFocus
          />
          {error && <p className="error-text" style={{ marginTop: 4 }}>{error}</p>}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
            Pilihan Cepat
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggestions.map((s) => {
              const isSelected = name.trim().toLowerCase() === s.toLowerCase();
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: isSelected ? "var(--color-accent-subtle)" : "var(--color-bg)",
                    color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
