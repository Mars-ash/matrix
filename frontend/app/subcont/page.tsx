"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAppState, useAppDispatch } from "@/lib/store";
import type { Item, Project, JO, Category, Control } from "@/lib/types";
import { SUBCONT_SUPPLIERS } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { Dialog } from "@/components/dialog";
import { useAuth } from "@/lib/auth";

interface SubcontRow {
  project: Project;
  jo: JO;
  category: Category;
  item: Item;
  arrivalControl?: Control;
  originalIndex: number;
}

type GroupMode = "none" | "jo" | "supplier";
type SortMode = "newest" | "deadline" | "jo" | "supplier" | "qty";

const SUBCONT_STATUSES: ("In Progress" | "Done")[] = ["In Progress", "Done"];
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function getNotification(targetDate?: string, subcontStatus?: string): { text: string; color: string; diffDays: number } | null {
  if (!targetDate || subcontStatus === "Done") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue ${Math.abs(diffDays)}d`, color: "var(--color-status-problem)", diffDays };
  } else if (diffDays === 0) {
    return { text: "Hari H", color: "var(--color-status-in-progress)", diffDays };
  } else if (diffDays <= 3) {
    return { text: `H-${diffDays}`, color: "var(--color-status-in-progress)", diffDays };
  }

  return null;
}

function formatDate(isoString?: string) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SubcontTrackingContent() {
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { isController, isViewer } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Clear highlight animation after 2.5s
  useEffect(() => {
    if (!highlightedItemId) return;
    const timer = setTimeout(() => setHighlightedItemId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightedItemId]);

  // Handle direct item jump from notifications or URL
  useEffect(() => {
    const targetItemId = searchParams.get("item");
    if (targetItemId) {
      setHighlightedItemId(targetItemId);
      setTimeout(() => {
        const el = document.getElementById(`subcont-item-${targetItemId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }

    const q = searchParams.get("search") || searchParams.get("q");
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const [editingNotesRow, setEditingNotesRow] = useState<SubcontRow | null>(null);
  const [notesTemp, setNotesTemp] = useState("");

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<"In Progress" | "Done">("Done");

  const toggleSelectRow = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = (tableRows: SubcontRow[]) => {
    const tableIds = tableRows.map((r) => r.item.id);
    const allSelected = tableIds.length > 0 && tableIds.every((id) => selectedItemIds.has(id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        tableIds.forEach((id) => next.delete(id));
      } else {
        tableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Collect all items marked as Subcont
  const rawSubcontRows: SubcontRow[] = [];
  let itemCounter = 0;

  for (const project of projects) {
    for (const jo of project.jos) {
      for (const category of jo.categories) {
        for (const item of category.items) {
          if (item.isSubcont) {
            rawSubcontRows.push({
              project,
              jo,
              category,
              item,
              arrivalControl: item.controls.find((c) => c.process === "Arrival"),
              originalIndex: itemCounter++,
            });
          }
        }
      }
    }
  }

  // Filter 1: Exclude items marked "Done" that are older than 5 minutes
  const activeSubcontRows = rawSubcontRows.filter((row) => {
    if (row.item.subcontStatus === "Done" && row.item.subcontDoneAt) {
      const doneAge = currentTime - new Date(row.item.subcontDoneAt).getTime();
      if (doneAge > FIVE_MINUTES_MS) {
        return false;
      }
    }
    return true;
  });

  // Calculate KPI Counts from active list
  let totalActive = 0;
  let totalUrgent = 0;
  let totalOverdue = 0;
  let totalRecentlyDone = 0;

  for (const row of activeSubcontRows) {
    if (row.item.subcontStatus === "Done") {
      totalRecentlyDone++;
    } else {
      totalActive++;
      const notif = getNotification(row.item.arrivalTargetDate, row.item.subcontStatus);
      if (notif) {
        if (notif.diffDays < 0) {
          totalOverdue++;
        } else if (notif.diffDays <= 3) {
          totalUrgent++;
        }
      }
    }
  }

  // Filter 2: Search Query
  const filteredRows = activeSubcontRows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
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

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortMode === "newest") {
      const dateA = a.item.subcontDispatchDate ? new Date(a.item.subcontDispatchDate).getTime() : 0;
      const dateB = b.item.subcontDispatchDate ? new Date(b.item.subcontDispatchDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return b.originalIndex - a.originalIndex;
    }
    if (sortMode === "deadline") {
      const timeA = a.item.arrivalTargetDate ? new Date(a.item.arrivalTargetDate).getTime() : Infinity;
      const timeB = b.item.arrivalTargetDate ? new Date(b.item.arrivalTargetDate).getTime() : Infinity;
      return timeA - timeB;
    }
    if (sortMode === "jo") {
      return a.jo.joNumber.localeCompare(b.jo.joNumber);
    }
    if (sortMode === "supplier") {
      return (a.item.subcontSupplier || "").localeCompare(b.item.subcontSupplier || "");
    }
    if (sortMode === "qty") {
      return (b.item.qty || 0) - (a.item.qty || 0);
    }
    return 0;
  });

  // Table Renderer helper
  const renderTable = (rows: SubcontRow[]) => {
    const isAllSelected = rows.length > 0 && rows.every((r) => selectedItemIds.has(r.item.id));

    return (
      <div className="table-scroll">
        <table className={`control-table ${!isController ? "table-viewer" : ""}`}>
          <thead>
            <tr>
              {isController && (
                <th style={{ width: 36, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => toggleSelectAll(rows)}
                    style={{ cursor: "pointer" }}
                    aria-label="Pilih semua part"
                  />
                </th>
              )}
              <th style={{ minWidth: 80 }}>JO</th>
              <th style={{ minWidth: 160 }}>Item</th>
              <th style={{ minWidth: 60, textAlign: "center" }}>Qty</th>
              <th style={{ minWidth: 120 }}>Supplier</th>
              <th style={{ minWidth: 90, textAlign: "center" }}>Proses</th>
              <th style={{ minWidth: 110, textAlign: "center" }}>Delivery</th>
              <th style={{ minWidth: 155, textAlign: "center" }}>Target Arrival</th>
              <th style={{ minWidth: 125, textAlign: "center" }}>Status</th>
              <th style={{ width: 50, textAlign: "center" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const notif = getNotification(row.item.arrivalTargetDate, row.item.subcontStatus);
              const isDone = row.item.subcontStatus === "Done";
              const isSelected = selectedItemIds.has(row.item.id);

              return (
                <tr
                  key={row.item.id}
                  id={`subcont-item-${row.item.id}`}
                  className={`${highlightedItemId === row.item.id ? "row-highlight" : ""} ${isSelected ? "row-selected" : ""}`.trim() || undefined}
                  style={{ opacity: isDone ? 0.75 : 1 }}
                >
                  {isController && (
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.item.id)}
                        style={{ cursor: "pointer" }}
                        aria-label={`Pilih ${row.item.description}`}
                      />
                    </td>
                  )}
                  {/* JO */}
                  <td>
                    <Link
                      href={`/projects/${row.project.id}/jos/${row.jo.id}`}
                      style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                    >
                      {row.jo.joNumber}
                    </Link>
                  </td>

                  {/* Item */}
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{row.item.description}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>No. {row.item.no}</div>
                  </td>

                  {/* Qty */}
                  <td style={{ textAlign: "center" }}>
                    {isViewer ? (
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}>
                        {row.item.qty ?? 1}
                      </span>
                    ) : (
                      <input
                        type="number"
                        className="input"
                        style={{
                          fontSize: 12,
                          padding: "4px 6px",
                          width: 55,
                          textAlign: "center",
                          display: "inline-block",
                          margin: "0 auto",
                        }}
                        min={1}
                        value={row.item.qty ?? 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          dispatch({
                            type: "UPDATE_ITEM_SUBCONT",
                            projectId: row.project.id,
                            joId: row.jo.id,
                            categoryId: row.category.id,
                            itemId: row.item.id,
                            isSubcont: true,
                            qty: isNaN(val) ? 1 : val,
                          });
                        }}
                      />
                    )}
                  </td>

                  {/* Supplier */}
                  <td>
                    {isViewer ? (
                      <span style={{ fontSize: 12, color: row.item.subcontSupplier ? "var(--color-text)" : "var(--color-text-muted)" }}>
                        {row.item.subcontSupplier || "—"}
                      </span>
                    ) : (
                      <select
                        className="select"
                        style={{
                          fontSize: 12,
                          padding: "4px 22px 4px 8px",
                          minWidth: 110,
                          width: "100%",
                        }}
                        value={row.item.subcontSupplier || ""}
                        onChange={(e) => {
                          dispatch({
                            type: "UPDATE_ITEM_SUBCONT",
                            projectId: row.project.id,
                            joId: row.jo.id,
                            categoryId: row.category.id,
                            itemId: row.item.id,
                            isSubcont: true,
                            subcontSupplier: e.target.value,
                          });
                        }}
                      >
                        <option value="">—</option>
                        {SUBCONT_SUPPLIERS.map((sup) => (
                          <option key={sup} value={sup}>
                            {sup}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Proses (auto) */}
                  <td style={{ textAlign: "center", fontSize: 12, fontWeight: 500 }}>
                    {row.item.subcontProcess ||
                      row.item.controls.find((c) => c.status === "In Progress SC")?.process ||
                      "-"}
                  </td>

                  {/* Delivery */}
                  <td style={{ textAlign: "center", fontSize: 12, minWidth: 110 }}>
                    {row.item.subcontDispatchDate ? formatDate(row.item.subcontDispatchDate) : "-"}
                  </td>

                  {/* Target Arrival */}
                  <td style={{ textAlign: "center", minWidth: 155 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: "100%" }}>
                      {isViewer ? (
                        <span style={{ fontSize: 12, fontWeight: 500, color: row.item.arrivalTargetDate ? "var(--color-text)" : "var(--color-text-muted)" }}>
                          {row.item.arrivalTargetDate ? formatDate(row.item.arrivalTargetDate) : "—"}
                        </span>
                      ) : (
                        <input
                          type="date"
                          className="input"
                          style={{ padding: "3px 6px", fontSize: 12, textAlign: "center", width: "100%" }}
                          value={row.item.arrivalTargetDate || ""}
                          onChange={(e) => {
                            dispatch({
                              type: "UPDATE_ITEM_SUBCONT",
                              projectId: row.project.id,
                              joId: row.jo.id,
                              categoryId: row.category.id,
                              itemId: row.item.id,
                              isSubcont: true,
                              arrivalTargetDate: e.target.value,
                            });
                          }}
                        />
                      )}
                      {notif && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: notif.color,
                            background: `color-mix(in srgb, ${notif.color} 12%, transparent)`,
                            padding: "1px 6px",
                            borderRadius: 3,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {notif.text}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ textAlign: "center", minWidth: 125 }}>
                    {isViewer ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            (row.item.subcontStatus || "In Progress") === "Done"
                              ? "var(--color-status-done-bg)"
                              : "var(--color-status-in-progress-bg)",
                          color:
                            (row.item.subcontStatus || "In Progress") === "Done"
                              ? "var(--color-status-done)"
                              : "var(--color-status-in-progress)",
                        }}
                      >
                        {row.item.subcontStatus || "In Progress"}
                      </span>
                    ) : (
                      <select
                        className="select"
                        value={row.item.subcontStatus || "In Progress"}
                        onChange={(e) => {
                          dispatch({
                            type: "UPDATE_ITEM_SUBCONT",
                            projectId: row.project.id,
                            joId: row.jo.id,
                            categoryId: row.category.id,
                            itemId: row.item.id,
                            isSubcont: true,
                            subcontStatus: e.target.value as "In Progress" | "Done",
                          });
                        }}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 18px 4px 8px",
                          minWidth: 100,
                          backgroundColor:
                            (row.item.subcontStatus || "In Progress") === "Done"
                              ? "var(--color-status-done-bg)"
                              : "var(--color-status-in-progress-bg)",
                          color:
                            (row.item.subcontStatus || "In Progress") === "Done"
                              ? "var(--color-status-done)"
                              : "var(--color-status-in-progress)",
                          borderColor: "transparent",
                          textAlign: "center",
                        }}
                      >
                        {SUBCONT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Notes */}
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesRow(row);
                        setNotesTemp(row.item.subcontNotes || "");
                      }}
                      title={
                        row.item.subcontNotes
                          ? `Catatan: ${row.item.subcontNotes}`
                          : isViewer
                          ? "Lihat catatan"
                          : "Tambah catatan"
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 6px",
                        borderRadius: 4,
                        color: row.item.subcontNotes ? "var(--color-accent)" : "var(--color-text-muted)",
                        fontSize: 14,
                        lineHeight: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={`Catatan untuk ${row.item.description}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  };

  // Grouping builders
  const renderGroupedContent = () => {
    if (sortedRows.length === 0) {
      return (
        <EmptyState
          title="No subcont items"
          description={searchQuery ? "Try adjusting your search." : "Set a process to 'In Progress SC' to track it here."}
        />
      );
    }

    if (groupMode === "none") {
      return renderTable(sortedRows);
    }

    if (groupMode === "jo") {
      const joGroups: { [joId: string]: { jo: JO; project: Project; rows: SubcontRow[] } } = {};
      for (const row of sortedRows) {
        if (!joGroups[row.jo.id]) {
          joGroups[row.jo.id] = { jo: row.jo, project: row.project, rows: [] };
        }
        joGroups[row.jo.id].rows.push(row);
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.values(joGroups).map((grp) => (
            <div key={grp.jo.id} style={{ display: "flex", flexDirection: "column" }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--color-accent)" }}>{grp.jo.joNumber}</span>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {grp.project.name} &bull; {grp.jo.product}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{grp.rows.length} part</span>
              </div>
              {renderTable(grp.rows)}
            </div>
          ))}
        </div>
      );
    }

    if (groupMode === "supplier") {
      const supplierGroups: { [sup: string]: SubcontRow[] } = {};
      for (const row of sortedRows) {
        const key = row.item.subcontSupplier?.trim() || "Tanpa Supplier";
        if (!supplierGroups[key]) {
          supplierGroups[key] = [];
        }
        supplierGroups[key].push(row);
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(supplierGroups).map(([supplierName, rows]) => (
            <div key={supplierName} style={{ display: "flex", flexDirection: "column" }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text)" }}>{supplierName}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{rows.length} part</span>
              </div>
              {renderTable(rows)}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <AppShell breadcrumbs={[{ label: "Subcont Tracker" }]}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Subcont Tracker</h1>
        </div>
      </div>

      {/* KPI Cards (Clean, Engineering Utilitarian) */}
      <div className="kpi-grid">
        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Aktif di Subcont
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>
            {totalActive}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            Part sedang diproses luar
          </div>
        </div>

        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-status-in-progress)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Mendekati Deadline
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-in-progress)" }}>
            {totalUrgent}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            H-3 sampai Hari H
          </div>
        </div>

        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-status-problem)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Overdue
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-problem)" }}>
            {totalOverdue}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            Melewati target kedatangan
          </div>
        </div>

        <div className="card-static" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-status-done)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Recently Done
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-status-done)" }}>
            {totalRecentlyDone}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            Selesai dalam 5 menit
          </div>
        </div>
      </div>

      {/* Toolbar: Grouping, Sorting, and Search */}
      <div className="tracker-toolbar">
        {/* Left: Grouping Pills */}
        <div className="tracker-toolbar-left">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 4 }}>
            Grup:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${groupMode === "none" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setGroupMode("none")}
          >
            Semua
          </button>
          <button
            type="button"
            className={`btn btn-sm ${groupMode === "jo" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setGroupMode("jo")}
          >
            Per JO
          </button>
          <button
            type="button"
            className={`btn btn-sm ${groupMode === "supplier" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setGroupMode("supplier")}
          >
            Per Supplier
          </button>
        </div>

        {/* Right: Sort & Search */}
        <div className="tracker-toolbar-right">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 auto" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Urutkan:
            </span>
            <select
              className="select"
              style={{ fontSize: 12, padding: "4px 24px 4px 8px", width: "auto", minWidth: 140, flex: "1 1 auto" }}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="newest">Terbaru Diinput</option>
              <option value="deadline">Target Arrival Terdekat</option>
              <option value="jo">Nomor JO</option>
              <option value="supplier">Nama Supplier</option>
              <option value="qty">Jumlah Qty (Terbanyak)</option>
            </select>
          </div>

          <input
            className="input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 170, fontSize: 12, padding: "4px 8px" }}
          />
        </div>
      </div>

      {/* Content */}
      {renderGroupedContent()}

      {/* Notes dialog */}
      <Dialog
        open={!!editingNotesRow}
        onClose={() => setEditingNotesRow(null)}
        title="Subcont Notes"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditingNotesRow(null)}>
              {isViewer ? "Tutup" : "Cancel"}
            </button>
            {isController && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (editingNotesRow) {
                    dispatch({
                      type: "UPDATE_ITEM_SUBCONT",
                      projectId: editingNotesRow.project.id,
                      joId: editingNotesRow.jo.id,
                      categoryId: editingNotesRow.category.id,
                      itemId: editingNotesRow.item.id,
                      isSubcont: true,
                      subcontNotes: notesTemp,
                    });
                    setEditingNotesRow(null);
                  }
                }}
              >
                Save
              </button>
            )}
          </>
        }
      >
        {editingNotesRow && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
            {editingNotesRow.item.description} — {editingNotesRow.jo.joNumber}
          </p>
        )}
        <textarea
          className="input"
          rows={4}
          placeholder={isViewer ? "Tidak ada catatan." : "Tulis catatan..."}
          value={notesTemp}
          onChange={(e) => setNotesTemp(e.target.value)}
          readOnly={isViewer}
          autoFocus={!isViewer}
        />
      </Dialog>

      {/* Floating Bulk Action Bar */}
      {isController && selectedItemIds.size > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-action-bar-count">
            <span className="bulk-action-bar-badge">{selectedItemIds.size}</span>
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
            onClick={() => setSelectedItemIds(new Set())}
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
        title={`Ubah Status (${selectedItemIds.size} Item)`}
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
              onClick={() => {
                const selectedRows = rawSubcontRows.filter((r) => selectedItemIds.has(r.item.id));
                for (const row of selectedRows) {
                  dispatch({
                    type: "UPDATE_ITEM_SUBCONT",
                    projectId: row.project.id,
                    joId: row.jo.id,
                    categoryId: row.category.id,
                    itemId: row.item.id,
                    isSubcont: true,
                    subcontStatus: bulkStatus,
                  });
                }
                setIsBulkStatusOpen(false);
                setSelectedItemIds(new Set());
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
              onChange={(e) => setBulkStatus(e.target.value as "In Progress" | "Done")}
              style={{ width: "100%" }}
            >
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}

export default function SubcontTrackingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontSize: 13, color: "var(--color-text-muted)" }}>Loading Subcont Tracker...</div>}>
      <SubcontTrackingContent />
    </Suspense>
  );
}
