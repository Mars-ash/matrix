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
  collectSubcontRows,
  type SubcontRow,
} from "@/lib/subcont-tracking";

type SubcontDoneSortMode = "newest" | "oldest" | "jo";

function formatDate(isoString?: string) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SubcontDoneContent() {
  const { projects, isHydrated } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SubcontDoneSortMode>("newest");
  const [viewingNotesRow, setViewingNotesRow] = useState<SubcontRow | null>(null);

  const doneRows = useMemo(
    () => collectSubcontRows(projects).filter((r) => r.item.subcontStatus === "Done"),
    [projects]
  );

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return doneRows;
    const q = searchQuery.toLowerCase();
    return doneRows.filter((row) => {
      const processName = (
        row.item.subcontProcess ||
        row.item.controls.find((c) => c.status === "In Progress SC")?.process ||
        ""
      ).toLowerCase();
      return (
        row.jo.joNumber.toLowerCase().includes(q) ||
        row.item.description.toLowerCase().includes(q) ||
        row.item.no.toLowerCase().includes(q) ||
        (row.item.subcontSupplier || "").toLowerCase().includes(q) ||
        processName.includes(q)
      );
    });
  }, [doneRows, searchQuery]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (sortMode === "newest") {
        const dateA = a.item.subcontDoneAt ? new Date(a.item.subcontDoneAt).getTime() : 0;
        const dateB = b.item.subcontDoneAt ? new Date(b.item.subcontDoneAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return b.originalIndex - a.originalIndex;
      }
      if (sortMode === "oldest") {
        const dateA = a.item.subcontDoneAt ? new Date(a.item.subcontDoneAt).getTime() : 0;
        const dateB = b.item.subcontDoneAt ? new Date(b.item.subcontDoneAt).getTime() : 0;
        if (dateA !== dateB) {
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA - dateB;
        }
        return a.originalIndex - b.originalIndex;
      }
      if (sortMode === "jo") {
        return a.jo.joNumber.localeCompare(b.jo.joNumber);
      }
      return 0;
    });
  }, [filteredRows, sortMode]);

  const handleRestore = (row: SubcontRow) => {
    dispatch({
      type: "UPDATE_ITEM_SUBCONT",
      projectId: row.project.id,
      joId: row.jo.id,
      categoryId: row.category.id,
      itemId: row.item.id,
      isSubcont: true,
      subcontStatus: "In Progress",
    });
  };

  if (isHydrated === false) {
    return (
      <AppShell breadcrumbs={[{ label: "Subcont Tracker", href: "/subcont" }, { label: "Riwayat" }]}>
        <TrackerTableSkeleton title="Riwayat — Subcont" />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: "Subcont Tracker", href: "/subcont" }, { label: "Riwayat" }]}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link
              href="/subcont"
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
              ← Kembali ke Subcont Tracker
            </Link>
          </div>
          <h1>Riwayat — Subcont</h1>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, paddingBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Total Done:
          </span>
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-done)", lineHeight: 1 }}>
            {doneRows.length}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Part selesai
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
              onChange={(e) => setSortMode(e.target.value as SubcontDoneSortMode)}
              aria-label="Sort done rows"
            >
              <option value="newest">Terbaru Selesai</option>
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

      {sortedRows.length === 0 ? (
        <EmptyState
          title="Belum ada item Done"
          description={searchQuery ? "Try adjusting your search." : "Item subcont yang telah diselesaikan akan muncul di sini."}
        />
      ) : (
        <div className="table-scroll">
          <table className="control-table table-viewer">
            <thead>
              <tr>
                <th className="th-tracker-jo">JO</th>
                <th className="th-tracker-item">Item</th>
                <th style={{ minWidth: 60, textAlign: "center" }}>Qty</th>
                <th style={{ minWidth: 120 }}>Supplier</th>
                <th style={{ minWidth: 90, textAlign: "center" }}>Proses</th>
                <th className="col-date" style={{ minWidth: 165, textAlign: "center" }}>Target Arrival</th>
                <th className="col-date" style={{ minWidth: 150, textAlign: "center" }}>Actual Arv Date</th>
                <th style={{ width: 50, textAlign: "center" }}>Catatan</th>
                {isController && <th style={{ minWidth: 100, textAlign: "center" }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.item.id}>
                  <td className="td-tracker-jo">
                    {row.project.isSystem ? (
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{UNASSIGNED_JO_LABEL}</span>
                    ) : (
                      <Link
                        href={`/projects/${row.project.id}/jos/${row.jo.id}`}
                        style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                      >
                        {row.jo.joNumber}
                      </Link>
                    )}
                  </td>
                  <td className="td-tracker-item">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{row.item.description}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>No. {row.item.no}</div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}>
                      {row.item.qty ?? 1}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: row.item.subcontSupplier ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {row.item.subcontSupplier || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", fontSize: 12, fontWeight: 500 }}>
                    {row.item.subcontProcess ||
                      row.item.controls.find((c) => c.status === "In Progress SC")?.process ||
                      "-"}
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 165 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.item.arrivalTargetDate ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {formatDate(row.item.arrivalTargetDate)}
                    </span>
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 150 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.item.subcontDoneAt ? "var(--color-text)" : "var(--color-text-muted)" }}>
                      {formatDate(row.item.subcontDoneAt)}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {row.item.subcontNotes ? (
                      <button
                        type="button"
                        onClick={() => setViewingNotesRow(row)}
                        title={`Lihat catatan: ${row.item.subcontNotes}`}
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
        title="Lihat Catatan Subcont"
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
            color: viewingNotesRow?.item.subcontNotes ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          {viewingNotesRow?.item.subcontNotes || "Tidak ada catatan."}
        </div>
      </Dialog>
    </AppShell>
  );
}

export default function SubcontDonePage() {
  return (
    <Suspense
      fallback={
        <AppShell breadcrumbs={[{ label: "Subcont Tracker", href: "/subcont" }, { label: "Riwayat" }]}>
          <TrackerTableSkeleton title="Riwayat — Subcont" />
        </AppShell>
      }
    >
      <SubcontDoneContent />
    </Suspense>
  );
}
