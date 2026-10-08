"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog } from "./dialog";
import type { Category } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";
import { COMMON_PART_SUGGESTIONS, COMMON_COMPONENT_SUGGESTIONS } from "@/lib/category";

interface CategoryEditDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
  category: Category | null;
}

export function CategoryEditDialog({
  open,
  onClose,
  projectId,
  joId,
  category,
}: CategoryEditDialogProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(category?.label || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.label);
      setError("");
    }
  }, [category, open]);

  const suggestions = useMemo(() => {
    if (!category) return COMMON_PART_SUGGESTIONS;
    return category.kind === "Part" ? COMMON_PART_SUGGESTIONS : COMMON_COMPONENT_SUGGESTIONS;
  }, [category]);

  const handleClose = useCallback(() => {
    setError("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!category) return;
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    dispatch({
      type: "UPDATE_CATEGORY",
      projectId,
      joId,
      categoryId: category.id,
      label: name.trim(),
    });

    handleClose();
  }, [category, name, dispatch, projectId, joId, handleClose]);

  if (!category) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Edit Kategori"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Simpan Perubahan
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
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 6,
            }}
          >
            Pilihan Cepat ({category.kind})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggestions.map((s) => {
              const isSelected = name.trim().toLowerCase() === s.toLowerCase();
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setName(s);
                    setError("");
                  }}
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

        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
          Tipe kategori: <strong style={{ color: "var(--color-text)" }}>{category.kind}</strong> ({category.items.length} item).
        </div>
      </div>
    </Dialog>
  );
}
