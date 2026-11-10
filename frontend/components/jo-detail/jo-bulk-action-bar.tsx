"use client";

import React from "react";

export interface JoBulkActionBarProps {
  selectedCount: number;
  onKirimPo: () => void;
  onUbahStatus: () => void;
  onKirimSubcont: () => void;
  onBatchDelete: () => void;
  onCancel: () => void;
}

export function JoBulkActionBar({
  selectedCount,
  onKirimPo,
  onUbahStatus,
  onKirimSubcont,
  onBatchDelete,
  onCancel,
}: JoBulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="bulk-action-bar">
      <div className="bulk-action-bar-count">
        <span className="bulk-action-bar-badge">{selectedCount}</span>
        <span className="bulk-action-bar-label">Part Terpilih</span>
      </div>

      <div className="bulk-action-bar-divider" />

      <div className="bulk-action-bar-buttons">
        <button
          type="button"
          className="btn btn-secondary btn-sm bulk-action-btn"
          onClick={onKirimPo}
        >
          Kirim PO
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm bulk-action-btn"
          onClick={onUbahStatus}
        >
          Ubah Status
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm bulk-action-btn"
          onClick={onKirimSubcont}
        >
          Kirim Subcont
        </button>

        <button
          type="button"
          className="btn btn-sm bulk-action-btn"
          onClick={onBatchDelete}
          style={{
            background: "var(--color-status-problem)",
            color: "#fff",
            borderColor: "var(--color-status-problem)",
          }}
        >
          Hapus ({selectedCount})
        </button>
      </div>

      <button
        type="button"
        className="bulk-action-bar-cancel"
        onClick={onCancel}
        title="Batal pilih semua"
      >
        ✕ Batal
      </button>
    </div>
  );
}

