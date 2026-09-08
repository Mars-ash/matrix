"use client";
import React, { useEffect, useRef, useCallback, type ReactNode } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: ReactNode;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  destructive?: boolean;
  thumbnailUrl?: string;
  photoName?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = "Hapus",
  cancelText = "Batal",
  loading = false,
  destructive = true,
  thumbnailUrl,
  photoName,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      } else if (e.key === "Enter" && !loading && (document.activeElement === confirmBtnRef.current || document.activeElement?.tagName !== "BUTTON")) {
        e.preventDefault();
        onConfirm();
      }
    },
    [onClose, onConfirm, loading]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Auto-focus the cancel or confirm button safely
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="dialog-panel"
        style={{
          maxWidth: 400,
          padding: "20px 20px 16px 20px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          {/* Destructive / Warning indicator */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: destructive ? "var(--color-status-problem-bg)" : "var(--color-bg-hover)",
              color: destructive ? "var(--color-status-problem)" : "var(--color-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `1px solid ${destructive ? "rgba(220, 38, 38, 0.2)" : "var(--color-border)"}`,
            }}
          >
            {destructive ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text)",
                margin: "0 0 6px 0",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            {message && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                }}
              >
                {message}
              </div>
            )}
            {children}
          </div>
        </div>

        {/* Optional photo preview */}
        {thumbnailUrl && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-wash)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={thumbnailUrl}
              alt={photoName || "Foto"}
              style={{
                width: "100%",
                maxHeight: 160,
                objectFit: "contain",
                display: "block",
                background: "rgba(0, 0, 0, 0.04)",
              }}
            />
            {photoName && (
              <div
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  color: "var(--color-text-muted)",
                  width: "100%",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                {photoName}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ minWidth: 70 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{
              minWidth: 70,
              background: destructive ? "var(--color-status-problem)" : "var(--color-text)",
              color: "#ffffff",
              borderColor: destructive ? "var(--color-status-problem)" : "var(--color-text)",
              fontWeight: 600,
            }}
          >
            {loading ? "Menghapus..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
