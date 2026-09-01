"use client";
import React, { useState } from "react";
import { Dialog } from "./dialog";
import { useAppDispatch } from "@/lib/store";
import { poTrackingLabel, isPoTrackingProcess } from "@/lib/po-tracking";
import type { Control, ControlStatus } from "@/lib/types";

interface PoTrackingDialogProps {
  open: boolean;
  onClose: () => void;
  control: Control;
  itemDescription: string;
  projectId: string;
  joId: string;
  categoryId: string;
  itemId: string;
  arrivalStatus?: ControlStatus;
}

const PO_STATUS_CHOICES: ControlStatus[] = [
  "Not Started",
  "In Progress",
  "Done",
  "Problem",
  "-",
];

interface PoTrackingFormProps {
  onClose: () => void;
  control: Control;
  projectId: string;
  joId: string;
  categoryId: string;
  itemId: string;
}

function PoTrackingForm({
  onClose,
  control,
  projectId,
  joId,
  categoryId,
  itemId,
}: PoTrackingFormProps) {
  const dispatch = useAppDispatch();
  const isPoMaterial = isPoTrackingProcess(control.process);
  const label = poTrackingLabel(control.process);

  const [status, setStatus] = useState<ControlStatus>(control.status);
  const [problemNotes, setProblemNotes] = useState(control.notes || "");
  const [poNo, setPoNo] = useState(control.poTracking?.poNo || "");
  const [supplier, setSupplier] = useState(control.poTracking?.supplier || "");
  const [targetArrival, setTargetArrival] = useState(control.poTracking?.targetArrival || "");
  const [notes, setNotes] = useState(control.poTracking?.notes || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (status === "Problem" && !problemNotes.trim()) {
      setError("Catatan problem wajib diisi saat status Problem.");
      return;
    }

    if (!isPoTrackingProcess(control.process)) {
      onClose();
      return;
    }

    dispatch({
      type: "UPDATE_PO_TRACKING",
      projectId,
      joId,
      categoryId,
      itemId,
      process: control.process,
      status,
      problemNotes: problemNotes.trim(),
      tracking: {
        poNo: poNo.trim(),
        supplier: supplier.trim(),
        targetArrival: targetArrival.trim(),
        notes: notes.trim(),
      },
    });

    onClose();
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Status selection */}
        <div>
          <label className="label" style={{ fontSize: 12, marginBottom: 4 }}>
            Status {label}
          </label>
          <select
            className="select"
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as ControlStatus;
              setStatus(newStatus);
              if (newStatus !== "Problem") {
                setError("");
              }
            }}
            style={{ width: "100%", fontSize: 13 }}
          >
            {PO_STATUS_CHOICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Problem note if status is Problem */}
        {status === "Problem" && (
          <div>
            <label className="label" style={{ fontSize: 12, marginBottom: 4, color: "var(--color-status-problem)" }}>
              Catatan Problem (Wajib) *
            </label>
            <textarea
              className="input"
              rows={2}
              value={problemNotes}
              onChange={(e) => {
                setProblemNotes(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder="Deskripsi kendala / masalah..."
              style={{ width: "100%", borderColor: "var(--color-status-problem)" }}
              autoFocus
            />
          </div>
        )}

        {/* PO No & Supplier */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="label" style={{ fontSize: 12, marginBottom: 4 }}>
              Nomor PO
            </label>
            <input
              type="text"
              className="input"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              placeholder="Contoh: PO-0012"
              style={{ width: "100%", fontSize: 13 }}
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 12, marginBottom: 4 }}>
              Supplier / Vendor
            </label>
            <input
              type="text"
              className="input"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Contoh: PT Baja Makmur"
              style={{ width: "100%", fontSize: 13 }}
            />
          </div>
        </div>

        {/* Target Arrival */}
        <div>
          <label className="label" style={{ fontSize: 12, marginBottom: 4 }}>
            Target Kedatangan (Arrival)
          </label>
          <input
            type="date"
            className="input"
            value={targetArrival}
            onChange={(e) => setTargetArrival(e.target.value)}
            style={{ width: "100%", fontSize: 13 }}
          />
        </div>

        {/* General Notes */}
        <div>
          <label className="label" style={{ fontSize: 12, marginBottom: 4 }}>
            Catatan Tambahan
          </label>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan spesifikasi material, resi pengiriman, kontak vendor, dll..."
            style={{ width: "100%", fontSize: 13 }}
          />
        </div>

        {error && <p className="error-text" style={{ fontSize: 12, margin: 0 }}>{error}</p>}
      </div>

      <div className="dialog-footer" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Batal
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Simpan
        </button>
      </div>
    </>
  );
}

export function PoTrackingDialog({
  open,
  onClose,
  control,
  itemDescription,
  projectId,
  joId,
  categoryId,
  itemId,
}: PoTrackingDialogProps) {
  if (!open) return null;

  const label = poTrackingLabel(control.process);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Detail ${label} — ${itemDescription}`}
    >
      <PoTrackingForm
        key={`${itemId}-${control.process}`}
        onClose={onClose}
        control={control}
        projectId={projectId}
        joId={joId}
        categoryId={categoryId}
        itemId={itemId}
      />
    </Dialog>
  );
}
