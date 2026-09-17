"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "./dialog";
import type { Item } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";

interface ItemEditDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
  categoryId: string;
  item: Item | null;
}

export function ItemEditDialog({
  open,
  onClose,
  projectId,
  joId,
  categoryId,
  item,
}: ItemEditDialogProps) {
  const dispatch = useAppDispatch();

  const [no, setNo] = useState("");
  const [description, setDescription] = useState("");
  const [dimension, setDimension] = useState("");
  const [material, setMaterial] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [hrc, setHrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setNo(item.no || "");
      setDescription(item.description || "");
      setDimension(item.dimension || "");
      setMaterial(item.material || "");
      setQty(item.qty ?? 1);
      setHrc(item.hrc || "");
      setError("");
    }
  }, [item, open]);

  const handleSubmit = useCallback(() => {
    if (!item) return;
    if (!description.trim()) {
      setError("Nama / Deskripsi part wajib diisi.");
      return;
    }
    const parsedQty = Math.max(1, Number(qty) || 1);

    dispatch({
      type: "UPDATE_ITEM",
      projectId,
      joId,
      categoryId,
      itemId: item.id,
      data: {
        no: no.trim() || "-",
        description: description.trim(),
        dimension: dimension.trim(),
        material: material.trim(),
        qty: parsedQty,
        hrc: hrc.trim(),
      },
    });

    onClose();
  }, [item, description, qty, dispatch, projectId, joId, categoryId, no, dimension, material, hrc, onClose]);

  if (!item) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit Part / Component"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
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
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            handleSubmit();
          }
        }}
      >
        {error && <p className="error-text" style={{ marginBottom: 4 }}>{error}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
          <div>
            <label className="label">No</label>
            <input
              className="input"
              value={no}
              onChange={(e) => setNo(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <label className="label">Deskripsi / Nama Part *</label>
            <input
              className="input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Upper Die Plate"
              autoFocus
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="label">Dimensi (T x W x L)</label>
            <input
              className="input"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              placeholder="e.g. 500 x 300 x 45"
            />
          </div>
          <div>
            <label className="label">Material</label>
            <input
              className="input"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. S50C / SKD11"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="label">Qty *</label>
            <input
              type="number"
              min={1}
              className="input"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <div>
            <label className="label">Hardness (HRc)</label>
            <input
              className="input"
              value={hrc}
              onChange={(e) => setHrc(e.target.value)}
              placeholder="e.g. 58-60"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
