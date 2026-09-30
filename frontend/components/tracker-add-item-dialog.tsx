"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Dialog } from "@/components/dialog";
import { JoPicker } from "@/components/jo-picker";
import { ManualItemForm, emptyManualItemData, type ManualItemData } from "@/components/manual-item-form";
import { useAppState, useAppDispatch } from "@/lib/store";
import { visibleProjects } from "@/lib/tracker-items";
import { api } from "@/lib/api-client";

export interface TrackerAddItemDialogProps {
  open: boolean;
  onClose: () => void;
  tracker: "po" | "subcont";
}

export function TrackerAddItemDialog({
  open,
  onClose,
  tracker,
}: TrackerAddItemDialogProps) {
  const { projects } = useAppState();
  const dispatch = useAppDispatch();

  const [joId, setJoId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formData, setFormData] = useState<ManualItemData>(emptyManualItemData());
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visible = useMemo(() => visibleProjects(projects), [projects]);

  const selectedJo = useMemo(() => {
    if (!joId) return null;
    for (const p of visible) {
      const j = p.jos.find((jo) => jo.id === joId);
      if (j) return j;
    }
    return null;
  }, [visible, joId]);

  const categories = useMemo(() => selectedJo?.categories ?? [], [selectedJo]);

  const reset = useCallback(() => {
    setJoId("");
    setCategoryId("");
    setFormData(emptyManualItemData());
    setError("");
    setSubmitError("");
    setSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleJoChange = (newJoId: string) => {
    setJoId(newJoId);
    setSubmitError("");
    if (newJoId) {
      let firstCatId = "";
      for (const p of visible) {
        const j = p.jos.find((jo) => jo.id === newJoId);
        if (j && j.categories.length > 0) {
          firstCatId = j.categories[0].id;
          break;
        }
      }
      setCategoryId(firstCatId);
    } else {
      setCategoryId("");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (joId && !categoryId) {
      setSubmitError("Pilih kategori.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await api.createTrackerItem({
        tracker,
        categoryId: joId ? categoryId : undefined,
        kind: joId ? undefined : "Part",
        no: formData.no.trim() || "-",
        description: formData.description.trim(),
        dimension: formData.dimension.trim() || undefined,
        material: formData.material.trim() || undefined,
        qty: Math.max(1, formData.qty || 1),
        hrc: formData.hrc.trim() || undefined,
        targetArrival: formData.arrivalTargetDate || undefined,
        subcontNotes: tracker === "subcont" ? (formData.subcontNotes.trim() || undefined) : undefined,
      });

      dispatch({
        type: "INSERT_TRACKER_ITEM",
        ...res.data,
      });

      reset();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setSubmitError(message || "Gagal menambah item.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = tracker === "po" ? "Tambah Item ke PO Tracker" : "Tambah Item ke Subcont Tracker";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      maxWidth={520}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Menyimpan..." : "Tambah Item"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* JO selection */}
        <div>
          <label className="label">JO</label>
          <JoPicker
            projects={visible}
            value={joId}
            onChange={handleJoChange}
            disabled={submitting}
          />
        </div>

        {/* Category selection when JO is selected */}
        {joId && (
          <div>
            <label className="label">Kategori *</label>
            <select
              className="select"
              aria-label="Kategori"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubmitError("");
              }}
              style={{ width: "100%" }}
              disabled={submitting}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.label} · ${c.kind}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submission error message */}
        {submitError && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              color: "var(--color-danger, #dc2626)",
            }}
          >
            {submitError}
          </div>
        )}

        {/* Form fields */}
        <ManualItemForm
          mode={tracker}
          data={formData}
          onChange={setFormData}
          error={error}
          onClearError={() => setError("")}
          onSubmit={handleSubmit}
          autoFocusDescription={false}
        />
      </div>
    </Dialog>
  );
}
