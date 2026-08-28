"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import { buildTrialSessionName, formatTrialDateSuffix } from "@/lib/trial-report";

interface TrialSessionFormDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "duplicate";
  defaultPrefix?: string;
  defaultTrialDate?: string;
  onSubmit: (prefix: string, trialDate: string, generatedName: string) => void;
}

export function TrialSessionFormDialog({
  open,
  onClose,
  mode,
  defaultPrefix = "",
  defaultTrialDate = "",
  onSubmit,
}: TrialSessionFormDialogProps) {
  if (!open) return null;

  return (
    <TrialSessionFormDialogContent
      open={open}
      onClose={onClose}
      mode={mode}
      defaultPrefix={defaultPrefix}
      defaultTrialDate={defaultTrialDate}
      onSubmit={onSubmit}
    />
  );
}

function TrialSessionFormDialogContent({
  open,
  onClose,
  mode,
  defaultPrefix = "",
  defaultTrialDate = "",
  onSubmit,
}: TrialSessionFormDialogProps) {
  const [prefix, setPrefix] = useState(defaultPrefix);
  const [trialDate, setTrialDate] = useState(
    defaultTrialDate || new Date().toISOString().split("T")[0]
  );

  const generatedName = buildTrialSessionName(prefix, trialDate);
  const isDateValid = formatTrialDateSuffix(trialDate) !== "";

  const handleSubmit = useCallback(() => {
    if (!isDateValid) return;
    onSubmit(prefix.trim(), trialDate, generatedName);
    onClose();
  }, [prefix, trialDate, generatedName, isDateValid, onSubmit, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Buat Trial Baru" : "Duplikat Trial Sebelumnya"}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn btn-primary"
            disabled={!isDateValid}
            onClick={handleSubmit}
          >
            {mode === "create" ? "Buat" : "Duplikat"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="label">Nama Prefix (opsional)</label>
          <input
            className="input"
            type="text"
            placeholder="contoh: Trial Lower Arm"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tanggal Trial</label>
          <input
            className="input"
            type="date"
            value={trialDate}
            onChange={(e) => setTrialDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Nama Session</label>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg-hover)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text)",
              minHeight: 20,
            }}
          >
            {generatedName || "—"}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
