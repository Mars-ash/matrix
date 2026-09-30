"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { StatusSelect } from "@/components/status-select";
import { TrackerTableSkeleton } from "@/components/skeleton-loader";
import { useAppDispatch, useAppState } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { PO_SUPPLIERS, type ControlStatus, type PoTracking } from "@/lib/types";
import { TrackerAddItemDialog } from "@/components/tracker-add-item-dialog";
import { UNASSIGNED_JO_LABEL } from "@/lib/tracker-items";
import {
  collectPoTrackingRows,
  filterPoTrackingRows,
  getPoTrackingDeadline,
  isPoRowArchived,
  poRowKey,
  sortPoTrackingRows,
  type PoTrackingRow,
  type PoTrackingSortMode,
} from "@/lib/po-tracking";

type GroupMode = "none" | "jo" | "supplier";

const PO_STATUS_CHOICES: ControlStatus[] = [
  "In Progress",
  "Done",
  "Problem",
];

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function deadlineColor(state: "overdue" | "today" | "soon") {
  if (state === "overdue") return "var(--color-status-problem)";
  if (state === "today") return "var(--color-status-problem)";
  return "var(--color-status-in-progress)";
}

function PoTrackerContent() {
  const { projects, isHydrated } = useAppState();
  const dispatch = useAppDispatch();
  const { isController, isViewer } = useAuth();
  const searchParams = useSearchParams();
  const targetItemId = searchParams.get("item");
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [sortMode, setSortMode] = useState<PoTrackingSortMode>("newest");
  const [editingNotesRow, setEditingNotesRow] = useState<PoTrackingRow | null>(null);
  const [notesTemp, setNotesTemp] = useState("");

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ControlStatus>("Done");
  const [bulkProblemNotes, setBulkProblemNotes] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [recentlyDone, setRecentlyDone] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const toggleSelectRow = (row: PoTrackingRow) => {
    const key = poRowKey(row);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = (tableRows: PoTrackingRow[]) => {
    const tableKeys = tableRows.map(poRowKey);
    const allSelected = tableKeys.length > 0 && tableKeys.every((k) => selectedKeys.has(k));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        tableKeys.forEach((k) => next.delete(k));
      } else {
        tableKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!targetItemId) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`po-item-${targetItemId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [targetItemId]);

  const rows = useMemo(() => collectPoTrackingRows(projects), [projects]);
  const activeRows = useMemo(
    () => rows.filter((r) => !isPoRowArchived(r, recentlyDone, now)),
    [rows, recentlyDone, now]
  );
  const visibleRows = useMemo(
    () => sortPoTrackingRows(filterPoTrackingRows(activeRows, searchQuery), sortMode),
    [activeRows, searchQuery, sortMode]
  );
  const doneCount = useMemo(() => rows.filter((r) => r.status === "Done").length, [rows]);

  const stats = useMemo(() => {
    let active = 0;
    let urgent = 0;
    let overdue = 0;
    let done = 0;

    for (const row of rows) {
      if (row.status === "Done") {
        done++;
        continue;
      }

      active++;
      const deadline = getPoTrackingDeadline(row.targetArrival, row.arrivalStatus);
      if (deadline?.state === "overdue") overdue++;
      if (deadline?.state === "today" || deadline?.state === "soon") urgent++;
    }

    return { active, urgent, overdue, done };
  }, [rows]);

  const updateRow = (
    row: PoTrackingRow,
    trackingUpdates: PoTracking,
    options: { status?: ControlStatus; problemNotes?: string; qty?: number } = {}
  ) => {
    if (options.status === "Done") {
      setRecentlyDone((prev) => ({ ...prev, [poRowKey(row)]: Date.now() }));
    } else if (options.status !== undefined) {
      setRecentlyDone((prev) => {
        const next = { ...prev };
        delete next[poRowKey(row)];
        return next;
      });
    }

    const isProblem = options.status === "Problem";
    const problemNotes = options.problemNotes?.trim() || "";
    const resolvedNotes =
      isProblem && problemNotes
        ? problemNotes
        : trackingUpdates.notes !== undefined
        ? trackingUpdates.notes
        : row.notes;

    dispatch({
      type: "UPDATE_PO_TRACKING",
      projectId: row.project.id,
      joId: row.jo.id,
      categoryId: row.category.id,
      itemId: row.item.id,
      process: row.process,
      status: options.status,
      problemNotes: isProblem ? problemNotes : options.problemNotes,
      qty: options.qty,
      tracking: {
        supplier: row.supplier,
        poNo: row.poNo,
        poDate: row.poDate,
        targetArrival: row.targetArrival,
        ...trackingUpdates,
        notes: resolvedNotes,
      },
    });
  };

  const renderTable = (tableRows: PoTrackingRow[]) => {
    const isAllSelected = tableRows.length > 0 && tableRows.every((r) => selectedKeys.has(poRowKey(r)));

    return (
      <div className="table-scroll">
        <table className={`control-table ${!isController ? "table-viewer" : ""}`}>
          <thead>
            <tr>
              {isController && (
                <th className="th-tracker-checkbox">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => toggleSelectAll(tableRows)}
                    style={{ cursor: "pointer" }}
                    aria-label="Pilih semua part"
                  />
                </th>
              )}
              <th className="th-tracker-jo">JO</th>
              <th className="th-tracker-item">Item</th>
              <th style={{ minWidth: 60, textAlign: "center" }}>Qty</th>
              <th style={{ minWidth: 130 }}>Supplier</th>
              <th style={{ minWidth: 125 }}>No. PO</th>
              <th className="col-date" style={{ minWidth: 150, textAlign: "center" }}>PO Date</th>
              <th className="col-date" style={{ minWidth: 165, textAlign: "center" }}>Target Arrival</th>
              <th style={{ minWidth: 130, textAlign: "center" }}>Status</th>
              <th style={{ width: 54, textAlign: "center" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              const deadline = getPoTrackingDeadline(row.targetArrival, row.arrivalStatus);
              const warningColor = deadline ? deadlineColor(deadline.state) : "";
              const isSelected = selectedKeys.has(poRowKey(row));

              return (
                <tr
                  key={`${row.item.id}-${row.process}`}
                  id={`po-item-${row.item.id}`}
                  className={`${targetItemId === row.item.id ? "row-highlight" : ""} ${isSelected ? "row-selected" : ""}`.trim() || undefined}
                >
                  {isController && (
                    <td className="td-tracker-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row)}
                        style={{ cursor: "pointer" }}
                        aria-label={`Pilih ${row.item.description}`}
                      />
                    </td>
                  )}
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
                    {isViewer ? (
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}>
                        {row.item.qty ?? 1}
                      </span>
                    ) : (
                      <input
                        type="number"
                        className="input"
                        min={1}
                        value={row.item.qty ?? 1}
                        onChange={(event) => {
                          const qty = Number.parseInt(event.target.value, 10);
                          updateRow(row, {}, { qty: Number.isNaN(qty) ? 1 : qty });
                        }}
                        style={{ fontSize: 12, padding: "4px 6px", width: 55, textAlign: "center" }}
                        aria-label={`Qty for ${row.item.description}`}
                      />
                    )}
                  </td>
                  <td>
                    {isViewer ? (
                      <span style={{ fontSize: 12, color: row.supplier ? "var(--color-text)" : "var(--color-text-muted)" }}>
                        {row.supplier || "—"}
                      </span>
                    ) : (
                      <select
                        className="select"
                        style={{
                          fontSize: 12,
                          padding: "4px 22px 4px 8px",
                          minWidth: 120,
                          width: "100%",
                        }}
                        value={row.supplier || ""}
                        onChange={(event) => updateRow(row, { supplier: event.target.value })}
                        aria-label={`Supplier for ${row.item.description}`}
                      >
                        <option value="">—</option>
                        {row.supplier && !PO_SUPPLIERS.includes(row.supplier as any) && (
                          <option value={row.supplier}>{row.supplier}</option>
                        )}
                        {PO_SUPPLIERS.map((sup) => (
                          <option key={sup} value={sup}>
                            {sup}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {isViewer ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: row.poNo ? "var(--color-text)" : "var(--color-text-muted)" }}>
                        {row.poNo || "—"}
                      </span>
                    ) : (
                      <input
                        className="input"
                        value={row.poNo}
                        onChange={(event) => updateRow(row, { poNo: event.target.value })}
                        placeholder="-"
                        style={{ fontSize: 12, padding: "4px 7px", width: "100%" }}
                        aria-label={`PO number for ${row.item.description}`}
                      />
                    )}
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 150 }}>
                    {isViewer ? (
                      <span style={{ fontSize: 12, color: row.poDate ? "var(--color-text)" : "var(--color-text-muted)" }}>
                        {row.poDate ? formatDate(row.poDate) : "—"}
                      </span>
                    ) : (
                      <input
                        type="date"
                        className="input"
                        value={row.poDate}
                        onChange={(event) => updateRow(row, { poDate: event.target.value })}
                        title={row.poDate ? formatDate(row.poDate) : "Set PO date"}
                        style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          textAlign: "center",
                          width: "100%",
                          maxWidth: 130,
                          margin: "0 auto",
                          display: "block",
                        }}
                        aria-label={`PO date for ${row.item.description}`}
                      />
                    )}
                  </td>
                  <td className="col-date" style={{ textAlign: "center", minWidth: 165 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: "100%" }}>
                      {isViewer ? (
                        <span style={{ fontSize: 12, fontWeight: 500, color: row.targetArrival ? "var(--color-text)" : "var(--color-text-muted)" }}>
                          {row.targetArrival ? formatDate(row.targetArrival) : "—"}
                        </span>
                      ) : (
                        <input
                          type="date"
                          className="input"
                          value={row.targetArrival}
                          onChange={(event) => updateRow(row, { targetArrival: event.target.value })}
                          title={row.targetArrival ? formatDate(row.targetArrival) : "Set target arrival"}
                          style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            textAlign: "center",
                            width: "100%",
                            maxWidth: 130,
                            margin: "0 auto",
                            display: "block",
                          }}
                          aria-label={`Target arrival for ${row.item.description}`}
                        />
                      )}
                      {deadline && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: warningColor,
                            background: `color-mix(in srgb, ${warningColor} 12%, transparent)`,
                            padding: "1px 6px",
                            borderRadius: 3,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {deadline.text}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", minWidth: 130 }}>
                    <StatusSelect
                      value={row.status}
                      notes={row.arrivalControl?.notes || row.control.notes}
                      process={row.process}
                      allowedStatuses={PO_STATUS_CHOICES}
                      onChange={(status, problemNotes) => updateRow(row, {}, { status, problemNotes })}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {isViewer ? (
                      row.notes ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesRow(row);
                            setNotesTemp(row.notes);
                          }}
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
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesRow(row);
                          setNotesTemp(row.notes);
                        }}
                        title={row.notes ? `Catatan: ${row.notes}` : "Tambah catatan"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 6px",
                          borderRadius: 4,
                          color: row.notes ? "var(--color-accent)" : "var(--color-text-muted)",
                          fontSize: 14,
                          lineHeight: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-label={`Catatan PO untuk ${row.item.description}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13.5 2.5l-1-1-9 9-.5 2.5 2.5-.5 9-9z" />
                          <path d="M11 3l2 2" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGroupedContent = () => {
    if (visibleRows.length === 0) {
      return (
        <EmptyState
          title={searchQuery ? "No PO rows" : "Belum ada PO aktif"}
          description={
            searchQuery
              ? "Try adjusting your search."
              : "Belum ada PO aktif. Item yang sudah Done ada di Riwayat Done."
          }
        />
      );
    }

    if (groupMode === "none") return renderTable(visibleRows);

    const groups = new Map<string, PoTrackingRow[]>();
    for (const row of visibleRows) {
      const key = groupMode === "jo" ? row.jo.joNumber : row.supplier.trim() || "Tanpa Supplier";
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[...groups.entries()].map(([groupName, groupRows]) => (
          <div key={groupName} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: "var(--color-bg-wash)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                borderBottom: "none",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: groupMode === "jo" ? "var(--color-accent)" : "var(--color-text)" }}>
                {groupName}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{groupRows.length} item</span>
            </div>
            {renderTable(groupRows)}
          </div>
        ))}
      </div>
    );
  };

  if (isHydrated === false) {
    return (
      <AppShell breadcrumbs={[{ label: "PO Tracker" }]}>
        <TrackerTableSkeleton title="PO Tracker" />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: "PO Tracker" }]}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>PO Tracker</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/po-tracker/done" className="btn btn-secondary">
            Riwayat Done ({doneCount})
          </Link>
          {isController && (
            <button type="button" className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
              + Tambah Item
            </button>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Active PO
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{stats.active}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>PO Mtl dan PO belum selesai</div>
        </div>

        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-status-in-progress)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Mendekati Arrival
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-in-progress)" }}>{stats.urgent}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>H-3 sampai Hari H</div>
        </div>

        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-status-problem)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Overdue
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-problem)" }}>{stats.overdue}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Melewati target kedatangan</div>
        </div>
      </div>

      <div className="tracker-toolbar">
        <div className="tracker-toolbar-left">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 4 }}>
            Grup:
          </span>
          <button type="button" className={`btn btn-sm ${groupMode === "none" ? "btn-primary" : "btn-secondary"}`} onClick={() => setGroupMode("none")}>
            Semua
          </button>
          <button type="button" className={`btn btn-sm ${groupMode === "jo" ? "btn-primary" : "btn-secondary"}`} onClick={() => setGroupMode("jo")}>
            Per JO
          </button>
          <button type="button" className={`btn btn-sm ${groupMode === "supplier" ? "btn-primary" : "btn-secondary"}`} onClick={() => setGroupMode("supplier")}>
            Per Supplier
          </button>
        </div>

        <div className="tracker-toolbar-right">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 auto" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Urutkan:
            </span>
            <select
              className="select"
              style={{ fontSize: 12, padding: "4px 24px 4px 8px", width: "auto", minWidth: 140, flex: "1 1 auto" }}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as PoTrackingSortMode)}
              aria-label="Sort PO rows"
            >
              <option value="newest">Terbaru Diinput</option>
              <option value="oldest">Terlama Diinput</option>
              <option value="deadline">Target Arrival Terdekat</option>
            </select>
          </div>

          <input
            className="input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={{ width: 170, fontSize: 12, padding: "4px 8px" }}
            aria-label="Search PO rows"
          />
        </div>
      </div>

      {renderGroupedContent()}



      {/* Notes dialog */}
      <Dialog
        open={!!editingNotesRow}
        onClose={() => setEditingNotesRow(null)}
        title={isViewer ? "Lihat Catatan PO" : "Catatan PO"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditingNotesRow(null)}>
              {isViewer ? "Tutup" : "Batal"}
            </button>
            {isController && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!editingNotesRow) return;
                  updateRow(editingNotesRow, { notes: notesTemp });
                  setEditingNotesRow(null);
                }}
              >
                Simpan
              </button>
            )}
          </>
        }
      >
        {editingNotesRow && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
            {editingNotesRow.item.description} - {editingNotesRow.jo.joNumber}
          </p>
        )}
        {isViewer ? (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--color-bg-wash)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              whiteSpace: "pre-wrap",
              minHeight: 60,
              color: notesTemp ? "var(--color-text)" : "var(--color-text-muted)",
            }}
          >
            {notesTemp || "Tidak ada catatan."}
          </div>
        ) : (
          <textarea
            className="input"
            rows={4}
            placeholder="Tulis catatan PO..."
            value={notesTemp}
            onChange={(event) => setNotesTemp(event.target.value)}
            autoFocus
          />
        )}
      </Dialog>

      {/* Floating Bulk Action Bar (Controller only) */}
      {isController && selectedKeys.size > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-action-bar-count">
            <span className="bulk-action-bar-badge">{selectedKeys.size}</span>
            <span className="bulk-action-bar-label">Item Terpilih</span>
          </div>

          <div className="bulk-action-bar-divider" />

          <div className="bulk-action-bar-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-sm bulk-action-btn"
              onClick={() => setIsBulkStatusOpen(true)}
            >
              Ubah Status
            </button>
          </div>

          <button
            type="button"
            className="bulk-action-bar-cancel"
            onClick={() => setSelectedKeys(new Set())}
            title="Batal pilih semua"
          >
            ✕ Batal
          </button>
        </div>
      )}

      {/* Bulk Status Dialog */}
      <Dialog
        open={isBulkStatusOpen}
        onClose={() => setIsBulkStatusOpen(false)}
        title={`Ubah Status (${selectedKeys.size} Item)`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsBulkStatusOpen(false)}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              disabled={bulkStatus === "Problem" && !bulkProblemNotes.trim()}
              onClick={() => {
                const selectedRows = activeRows.filter((r) => selectedKeys.has(poRowKey(r)));
                for (const row of selectedRows) {
                  updateRow(
                    row,
                    bulkStatus === "Problem" ? { notes: bulkProblemNotes.trim() } : {},
                    {
                      status: bulkStatus,
                      problemNotes: bulkStatus === "Problem" ? bulkProblemNotes.trim() : "",
                    }
                  );
                }
                setIsBulkStatusOpen(false);
                setSelectedKeys(new Set());
                setBulkProblemNotes("");
              }}
            >
              Simpan Status
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="label">Pilih Status Baru</label>
            <select
              className="select"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ControlStatus)}
              style={{ width: "100%" }}
            >
              {PO_STATUS_CHOICES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {bulkStatus === "Problem" && (
            <div>
              <label className="label">
                Catatan Problem <span style={{ color: "var(--color-status-problem)" }}>*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Jelaskan kendala / problem yang terjadi..."
                value={bulkProblemNotes}
                onChange={(e) => setBulkProblemNotes(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
      </Dialog>

      <TrackerAddItemDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        tracker="po"
      />
    </AppShell>
  );
}

export default function PoTrackerPage() {
  return (
    <Suspense
      fallback={
        <AppShell breadcrumbs={[{ label: "PO Tracker" }]}>
          <TrackerTableSkeleton title="PO Tracker" />
        </AppShell>
      }
    >
      <PoTrackerContent />
    </Suspense>
  );
}
