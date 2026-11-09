"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog } from "./dialog";
import { useAuth } from "@/lib/auth";

interface ProblemNoteDialogProps {
  open: boolean;
  onClose: () => void;
  itemDescription: string;
  process: string;
  notes: string;
  onSaveNotes?: (newNotes: string) => void;
}

export function ProblemNoteDialog({
  open,
  onClose,
  itemDescription,
  process,
  notes,
  onSaveNotes,
}: ProblemNoteDialogProps) {
  const { isController } = useAuth();
  const [text, setText] = useState(notes || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [validationError, setValidationError] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTextRef = useRef<string>(notes || "");

  // Sync state when dialog opens or external notes change
  useEffect(() => {
    if (open) {
      setText(notes || "");
      lastSavedTextRef.current = notes || "";
      setSaveStatus("idle");
      setValidationError("");
    }
  }, [open, notes]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const saveImmediate = useCallback(
    (valueToSave: string) => {
      const trimmed = valueToSave.trim();
      if (!trimmed) {
        setValidationError("Catatan tidak boleh kosong saat status Problem.");
        setSaveStatus("idle");
        return;
      }

      setValidationError("");
      if (trimmed !== lastSavedTextRef.current) {
        lastSavedTextRef.current = trimmed;
        onSaveNotes?.(trimmed);
        setSaveStatus("saved");
      } else {
        setSaveStatus("saved");
      }
    },
    [onSaveNotes]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!val.trim()) {
      setValidationError("Catatan tidak boleh kosong saat status Problem.");
      setSaveStatus("idle");
      return;
    }

    setValidationError("");
    setSaveStatus("saving");

    debounceTimerRef.current = setTimeout(() => {
      saveImmediate(val);
      debounceTimerRef.current = null;
    }, 600);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      saveImmediate(text);
    }
  };

  const handleClose = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      saveImmediate(text);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Catatan Problem — ${itemDescription} → ${process}`}
      footer={
        <button type="button" className="btn btn-secondary" onClick={handleClose}>
          Tutup
        </button>
      }
    >
      {!isController ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-wash)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
              color: "var(--color-status-problem)",
              fontWeight: 700,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Catatan Kendala</span>
          </div>
          <div>
            {notes?.trim() || (
              <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                Belum ada catatan detail.
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            htmlFor="problem-notes-textarea"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-secondary)",
            }}
          >
            Detail Kendala & Catatan Penanganan
          </label>
          <textarea
            id="problem-notes-textarea"
            className="input"
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Tuliskan kendala, penyebab, atau update tindakan perbaikan..."
            rows={4}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              resize: "vertical",
              borderColor: validationError ? "var(--color-status-problem)" : undefined,
              boxSizing: "border-box",
            }}
          />

          {validationError && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--color-status-problem)",
                fontWeight: 500,
              }}
            >
              {validationError}
            </p>
          )}

          {!validationError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
                fontSize: 11,
                minHeight: 18,
              }}
            >
              {saveStatus === "saving" && (
                <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  Menyimpan perubahan...
                </span>
              )}
              {saveStatus === "saved" && (
                <span style={{ color: "var(--color-status-done)", fontWeight: 600 }}>
                  ✓ Tersimpan otomatis
                </span>
              )}
              {saveStatus === "idle" && (
                <span style={{ color: "var(--color-text-muted)" }}>
                  Ketik untuk memperbarui catatan (tersimpan otomatis)
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

