"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { StatusSelect } from "@/components/status-select";
import { useAppDispatch, useAppState } from "@/lib/store";
import type { ControlStatus, PoTracking } from "@/lib/types";
import {
  collectPoTrackingRows,
  filterPoTrackingRows,
  getPoTrackingDeadline,
  sortPoTrackingRows,
  type PoTrackingRow,
  type PoTrackingSortMode,
} from "@/lib/po-tracking";

type GroupMode = "none" | "jo" | "supplier";

const PO_STATUS_CHOICES: ControlStatus[] = [
  "-",
  "Not Started",
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
  return "var(--color-status-in-progress)";
}

function PoTrackerContent() {
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const targetItemId = searchParams.get("item");
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [sortMode, setSortMode] = useState<PoTrackingSortMode>("newest");
  const [editingNotesRow, setEditingNotesRow] = useState<PoTrackingRow | null>(null);
  const [notesTemp, setNotesTemp] = useState("");

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
  const visibleRows = useMemo(
    () => sortPoTrackingRows(filterPoTrackingRows(rows, searchQuery), sortMode),
    [rows, searchQuery, sortMode]
  );

  const stats = useMemo(() => {
    let active = 0;
    let urgent = 0;
    let overdue = 0;
    let done = 0;

    for (const row of rows) {
      if (row.control.status === "Done") {
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
    dispatch({
      type: "UPDATE_PO_TRACKING",
      projectId: row.project.id,
      joId: row.jo.id,
      categoryId: row.category.id,
      itemId: row.item.id,
      process: row.process,
      status: options.status ?? row.control.status,
      problemNotes: options.problemNotes ?? row.control.notes,
      qty: options.qty,
      tracking: {
        supplier: row.supplier,
        poNo: row.poNo,
        poDate: row.poDate,
        targetArrival: row.targetArrival,
        notes: row.notes,
        ...trackingUpdates,
      },
    });
  };

  const renderTable = (tableRows: PoTrackingRow[]) => (
    <div className="table-scroll">
      <table className="control-table">
        <thead>
          <tr>
            <th style={{ minWidth: 80 }}>JO</th>
            <th style={{ minWidth: 170 }}>Item</th>
            <th style={{ minWidth: 60, textAlign: "center" }}>Qty</th>
            <th style={{ minWidth: 130 }}>Supplier</th>
            <th style={{ minWidth: 125 }}>No. PO</th>
            <th style={{ minWidth: 115, textAlign: "center" }}>PO Date</th>
            <th style={{ minWidth: 145, textAlign: "center" }}>Target Arrival</th>
            <th style={{ minWidth: 115, textAlign: "center" }}>Status</th>
            <th style={{ width: 54, textAlign: "center" }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => {
            const deadline = getPoTrackingDeadline(row.targetArrival, row.arrivalStatus);
            const warningColor = deadline ? deadlineColor(deadline.state) : "";

            return (
              <tr
                key={`${row.item.id}-${row.process}`}
                id={`po-item-${row.item.id}`}
                className={targetItemId === row.item.id ? "row-highlight" : undefined}
              >
                <td>
                  <Link
                    href={`/projects/${row.project.id}/jos/${row.jo.id}?item=${row.item.id}#item-${row.item.id}`}
                    style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                  >
                    {row.jo.joNumber}
                  </Link>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{row.item.description}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      No. {row.item.no} - {row.trackerLabel}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: "center" }}>
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
                </td>
                <td>
                  <input
                    className="input"
                    value={row.supplier}
                    onChange={(event) => updateRow(row, { supplier: event.target.value })}
                    placeholder="-"
                    style={{ fontSize: 12, padding: "4px 7px", width: "100%" }}
                    aria-label={`Supplier for ${row.item.description}`}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={row.poNo}
                    onChange={(event) => updateRow(row, { poNo: event.target.value })}
                    placeholder="-"
                    style={{ fontSize: 12, padding: "4px 7px", width: "100%" }}
                    aria-label={`PO number for ${row.item.description}`}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="date"
                    className="input"
                    value={row.poDate}
                    onChange={(event) => updateRow(row, { poDate: event.target.value })}
                    title={row.poDate ? formatDate(row.poDate) : "Set PO date"}
                    style={{ fontSize: 12, padding: "3px 6px", textAlign: "center" }}
                    aria-label={`PO date for ${row.item.description}`}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <input
                      type="date"
                      className="input"
                      value={row.targetArrival}
                      onChange={(event) => updateRow(row, { targetArrival: event.target.value })}
                      title={row.targetArrival ? formatDate(row.targetArrival) : "Set target arrival"}
                      style={{ fontSize: 12, padding: "3px 6px", textAlign: "center" }}
                      aria-label={`Target arrival for ${row.item.description}`}
                    />
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
                <td style={{ textAlign: "center" }}>
                  <StatusSelect
                    value={row.control.status}
                    notes={row.control.notes}
                    process={row.process}
                    allowedStatuses={PO_STATUS_CHOICES}
                    onChange={(status, problemNotes) => updateRow(row, {}, { status, problemNotes })}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <button
                    onClick={() => {
                      setEditingNotesRow(row);
                      setNotesTemp(row.notes);
                    }}
                    title={row.notes || "Add note"}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 6px",
                      borderRadius: 4,
                      color: row.notes ? "var(--color-accent)" : "var(--color-text-muted)",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    aria-label={`Edit PO notes for ${row.item.description}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13.5 2.5l-1-1-9 9-.5 2.5 2.5-.5 9-9z" />
                      <path d="M11 3l2 2" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderGroupedContent = () => {
    if (visibleRows.length === 0) {
      return (
        <EmptyState
          title="No PO rows"
          description={searchQuery ? "Try adjusting your search." : "PO rows appear from existing PO Mtl and PO controls."}
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

  return (
    <AppShell breadcrumbs={[{ label: "PO Tracker" }]}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>PO Tracker</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
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

        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-status-done)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Done
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-done)" }}>{stats.done}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>PO Mtl dan PO selesai</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Urutkan:
            </span>
            <select
              className="select"
              style={{ fontSize: 12, padding: "4px 24px 4px 8px", width: "auto", minWidth: 150 }}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as PoTrackingSortMode)}
              aria-label="Sort PO rows"
            >
              <option value="newest">PO Date Terbaru</option>
              <option value="deadline">Target Arrival Terdekat</option>
              <option value="jo">Nomor JO</option>
              <option value="supplier">Nama Supplier</option>
              <option value="qty">Jumlah Qty Terbanyak</option>
            </select>
          </div>

          <input
            className="input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={{ width: 180, fontSize: 12, padding: "4px 8px" }}
            aria-label="Search PO rows"
          />
        </div>
      </div>

      {renderGroupedContent()}

      <Dialog
        open={!!editingNotesRow}
        onClose={() => setEditingNotesRow(null)}
        title="PO Notes"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditingNotesRow(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!editingNotesRow) return;
                updateRow(editingNotesRow, { notes: notesTemp });
                setEditingNotesRow(null);
              }}
            >
              Save
            </button>
          </>
        }
      >
        {editingNotesRow && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
            {editingNotesRow.item.description} - {editingNotesRow.jo.joNumber}
          </p>
        )}
        <textarea
          className="input"
          rows={4}
          placeholder="Tulis catatan PO..."
          value={notesTemp}
          onChange={(event) => setNotesTemp(event.target.value)}
          autoFocus
        />
      </Dialog>
    </AppShell>
  );
}

export default function PoTrackerPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontSize: 13, color: "var(--color-text-muted)" }}>Loading PO Tracker...</div>}>
      <PoTrackerContent />
    </Suspense>
  );
}
