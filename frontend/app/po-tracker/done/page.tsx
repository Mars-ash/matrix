"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { TrackerTableSkeleton } from "@/components/skeleton-loader";
import { useAppDispatch, useAppState } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { UNASSIGNED_JO_LABEL } from "@/lib/tracker-items";
import {
  collectPoTrackingRows,
  filterPoTrackingRows,
  sortPoTrackingRows,
  type PoTrackingRow,
  type PoTrackingSortMode,
} from "@/lib/po-tracking";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function PoTrackerDoneContent() {
  const { projects, isHydrated } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<PoTrackingSortMode>("newest");
  const [viewingNotesRow, setViewingNotesRow] = useState<PoTrackingRow | null>(null);

  const doneRows = useMemo(
    () => collectPoTrackingRows(projects).filter((r) => r.status === "Done"),
    [projects]
  );

  const visibleRows = useMemo(
    () => sortPoTrackingRows(filterPoTrackingRows(doneRows, searchQuery), sortMode),
    [doneRows, searchQuery, sortMode]
  );

  const handleRestore = (row: PoTrackingRow) => {
    dispatch({
      type: "UPDATE_PO_TRACKING",
      projectId: row.project.id,
      joId: row.jo.id,
      categoryId: row.category.id,
      itemId: row.item.id,
      process: row.process,
      status: "In Progress",
      problemNotes: "",
      tracking: {
        supplier: row.supplier,
        poNo: row.poNo,
        poDate: row.poDate,
        targetArrival: row.targetArrival,
        notes: row.notes,
      },
    });
  };

  if (isHydrated === false) {
    return (
      <AppShell breadcrumbs={[{ label: "Pre Order Tracker", href: "/po-tracker" }, { label: "Riwayat" }]}>
        <TrackerTableSkeleton title="Riwayat — PO" />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: "Pre Order Tracker", href: "/po-tracker" }, { label: "Riwayat" }]}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link
              href="/po-tracker"
              style={{
                fontSize: 13,
                color: "var(--color-accent)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              ← Kembali ke Pre Order Tracker
            </Link>
          </div>
          <h1>Riwayat — PO</h1>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, paddingBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Total Done:
          </span>
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-done)", lineHeight: 1 }}>
            {doneRows.length}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            PO selesai
          </span>
        </div>
      </div>

      <div className="tracker-toolbar">
        <div className="tracker-toolbar-left" />
        <div className="tracker-toolbar-right">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 auto" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Urutkan:
            </span>
            <select
              className="select"
              style={{ fontSize: 12, padding: "4px 24px 4px 8px", width: "auto", minWidth: 140, flex: "1 1 auto" }}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as PoTrackingSortMode)}
              aria-label="Sort done rows"
            >
              <option value="newest">Terbaru (PO Date)</option>
              <option value="oldest">Terlama</option>
              <option value="jo">JO</option>
            </select>
          </div>

          <input
            className="input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 170, fontSize: 12, padding: "4px 8px" }}
            aria-label="Search done rows"
          />
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <EmptyState
          title="Belum ada item Done"
          description={searchQuery ? "Try adjusting your search." : "Item PO yang telah diselesaikan akan muncul di sini."}
        />
      ) : (
        <div className="table-scroll">
          <table className="control-table table-viewer">
            <thead>
              <tr>
                <th className="th-tracker-jo">JO</th>
                <th className="th-tracker-item">Item</th>
                <th style={{ minWidth: 60, textAlign: "center" }}>Qty</th>
                <th style={{ minWidth: 130 }}>Supplier</th>
                <th style={{ minWidth: 125 }}>No. PO</th>
                <th className="col-date" style={{ minWidth: 150, textAlign: "center" }}>PO Date</th>
                <th className="col-date" style={{ minWidth: 165, textAlign: "center" }}>Target Arrival</th>
                <th className="col-date" style={{ minWidth: 150, textAlign: "center" }}>Actual Arv Date</th>
                <th style={{ width: 54, textAlign: "center" }}>Catatan</th>
                {isController && <th style={{ minWidth: 100, textAlign: "center" }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={`${row.item.id}-${row.process}`}>
                  <td className="td-tracker-jo">
                    {row.project.isSystem ? (
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{UNASSIGNED_JO_LABEL}</span>
                    ) : (
                      <Link
                        href={`/projects/${row.project.id}/jos/${row.jo.id}?item=${row.item.id}#item-${row.item.id}`}
                        style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                      >
                        {row.jo.joNumber}
                      </Link>
                    )}
                  </td>
                  <td className="td-tracker-item">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{row.item.description}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        No. {row.item.no} - {row.trackerLabel}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}>
                      {row.item.qty ?? 1}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: row.supplier ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {row.supplier || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: row.poNo ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {row.poNo || "—"}
                    </span>
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 150 }}>
                    <span style={{ fontSize: 12, color: row.poDate ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {formatDate(row.poDate)}
                    </span>
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 165 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.targetArrival ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {formatDate(row.targetArrival)}
                    </span>
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 150 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.actualArrivalDate ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {formatDate(row.actualArrivalDate)}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {row.notes ? (
                      <button
                        type="button"
                        onClick={() => setViewingNotesRow(row)}
                        title={`Lihat catatan: ${row.notes}`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 6px",
                          borderRadius: 4,
                          color: "var(--color-accent)",
                          fontSize: 14,
                          lineHeight: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-label={`Lihat catatan untuk ${row.item.description}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </button>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  {isController && (
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRestore(row)}
                        title="Kembalikan ke status In Progress"
                      >
                        Kembalikan
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Catatan Read-only Dialog */}
      <Dialog
        open={!!viewingNotesRow}
        onClose={() => setViewingNotesRow(null)}
        title="Lihat Catatan PO"
        footer={
          <button className="btn btn-secondary" onClick={() => setViewingNotesRow(null)}>
            Tutup
          </button>
        }
      >
        {viewingNotesRow && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
            {viewingNotesRow.item.description} - {viewingNotesRow.jo.joNumber}
          </p>
        )}
        <div
          style={{
            padding: "10px 14px",
            background: "var(--color-bg-wash)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            whiteSpace: "pre-wrap",
            minHeight: 60,
            color: viewingNotesRow?.notes ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          {viewingNotesRow?.notes || "Tidak ada catatan."}
        </div>
      </Dialog>
    </AppShell>
  );
}

export default function PoTrackerDonePage() {
  return (
    <Suspense
      fallback={
        <AppShell breadcrumbs={[{ label: "Pre Order Tracker", href: "/po-tracker" }, { label: "Riwayat" }]}>
          <TrackerTableSkeleton title="Riwayat — PO" />
        </AppShell>
      }
    >
      <PoTrackerDoneContent />
    </Suspense>
  );
}
