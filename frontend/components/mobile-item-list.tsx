"use client";

import React, { useState, useMemo } from "react";
import type { Category, ControlStatus } from "@/lib/types";
import { PART_PROCESSES, COMPONENT_PROCESSES } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useAppDispatch } from "@/lib/store";
import { ProcessControlCell } from "./process-control-cell";

interface MobileItemListProps {
  category: Category;
  projectId: string;
  joId: string;
  highlightedItemId?: string | null;
  selectedItemIds?: string[];
  onToggleSelectItem?: (itemId: string) => void;
  onRequestSendPo?: (payload: {
    categoryId: string;
    item: Category["items"][number];
    process: "Material" | "PO";
  }) => void;
  onRequestSendSubcont?: (payload: {
    categoryId: string;
    item: Category["items"][number];
    process: string;
  }) => void;
  onEditItem?: (item: Category["items"][number]) => void;
  onDeleteItem?: (item: Category["items"][number]) => void;
}

type FilterStatus = "ALL" | "In Progress" | "Problem" | "Not Started" | "Done";

export function MobileItemList({
  category,
  projectId,
  joId,
  highlightedItemId,
  selectedItemIds = [],
  onToggleSelectItem,
  onRequestSendPo,
  onRequestSendSubcont,
  onEditItem,
  onDeleteItem,
}: MobileItemListProps) {
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const processes = category.kind === "Part" ? PART_PROCESSES : COMPONENT_PROCESSES;

  // Single-open accordion state: only one item is expanded at a time
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  const filteredItems = useMemo(() => {
    return category.items.filter((item) => {
      // 1. Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = item.no?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesDim = item.dimension?.toLowerCase().includes(q);
        const matchesMat = item.material?.toLowerCase().includes(q);
        if (!matchesNo && !matchesDesc && !matchesDim && !matchesMat) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "Problem") {
          return item.controls.some((c) => c.status === "Problem");
        }
        if (statusFilter === "In Progress") {
          return item.controls.some(
            (c) => c.status === "In Progress" || c.status === "In Progress SC"
          );
        }
        if (statusFilter === "Done") {
          return item.controls.length > 0 && item.controls.every((c) => c.status === "Done" || c.status === "-");
        }
        if (statusFilter === "Not Started") {
          return item.controls.some((c) => c.status === "Not Started");
        }
      }

      return true;
    });
  }, [category.items, searchQuery, statusFilter]);

  const toggleAccordion = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Quick Search & Status Filter Chips */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "var(--color-bg-wash)",
          padding: "8px 10px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: 10, pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari part (no, nama, dimensi, mat)..."
            style={{
              width: "100%",
              paddingLeft: 30,
              paddingRight: searchQuery ? 28 : 10,
              height: 32,
              fontSize: 12,
              background: "var(--color-bg-raised)",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: 4,
                fontSize: 12,
                lineHeight: 1,
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 2,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {(
            [
              { key: "ALL", label: `Semua (${category.items.length})` },
              { key: "In Progress", label: "In Progress" },
              { key: "Problem", label: "Problem" },
              { key: "Not Started", label: "Not Started" },
              { key: "Done", label: "Done" },
            ] as const
          ).map((filter) => {
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                style={{
                  background: isActive ? "var(--color-accent)" : "var(--color-bg-raised)",
                  color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                  border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Rows */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: 12,
            background: "var(--color-bg-raised)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-border)",
          }}
        >
          {searchQuery || statusFilter !== "ALL"
            ? "Tidak ada part yang cocok dengan filter pencarian."
            : "Belum ada item pada kategori ini."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isSelected = selectedItemIds.includes(item.id);
            const isHighlighted = highlightedItemId === item.id;

            // Calculate progress ratio
            const doneCount = item.controls.filter((c) => c.status === "Done").length;
            const activeControls = item.controls.filter((c) => c.status !== "-");
            const totalProcesses = activeControls.length || item.controls.length;

            // Determine active prominent badge
            let activeStatus: { label: string; status: ControlStatus } = {
              label: "Not Started",
              status: "Not Started",
            };
            const problemCtrl = item.controls.find((c) => c.status === "Problem");
            const inProgressCtrl = item.controls.find(
              (c) => c.status === "In Progress" || c.status === "In Progress SC"
            );

            if (problemCtrl) {
              activeStatus = {
                label: `${problemCtrl.process}: Problem`,
                status: "Problem",
              };
            } else if (inProgressCtrl) {
              activeStatus = {
                label: `${inProgressCtrl.process === "Material" ? "PO Mtl" : inProgressCtrl.process}: In Progress`,
                status: inProgressCtrl.status,
              };
            } else if (doneCount === totalProcesses && totalProcesses > 0) {
              activeStatus = { label: "Done", status: "Done" };
            }

            const statusColors: Record<ControlStatus, { color: string; bg: string }> = {
              "-": { color: "var(--color-status-na)", bg: "var(--color-status-na-bg)" },
              "Not Started": {
                color: "var(--color-status-not-started)",
                bg: "var(--color-status-not-started-bg)",
              },
              "In Progress": {
                color: "var(--color-status-in-progress)",
                bg: "var(--color-status-in-progress-bg)",
              },
              "In Progress SC": {
                color: "var(--color-status-in-progress)",
                bg: "var(--color-status-in-progress-bg)",
              },
              Done: { color: "var(--color-status-done)", bg: "var(--color-status-done-bg)" },
              Problem: {
                color: "var(--color-status-problem)",
                bg: "var(--color-status-problem-bg)",
              },
            };

            const activeColor = statusColors[activeStatus.status];

            return (
              <div
                key={item.id}
                style={{
                  background: isSelected
                    ? "color-mix(in srgb, var(--color-accent) 6%, var(--color-bg-raised))"
                    : isHighlighted
                    ? "#2563eb14"
                    : "var(--color-bg-raised)",
                  border: `1px solid ${
                    isHighlighted
                      ? "var(--color-accent)"
                      : isExpanded
                      ? "var(--color-border)"
                      : "var(--color-border-subtle)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  boxShadow: isExpanded ? "var(--shadow-sm)" : "none",
                  transition: "border-color 150ms ease, background 150ms ease",
                  overflow: "hidden",
                }}
              >
                {/* Ultra-compact summary bar */}
                <div
                  data-testid={`item-row-${item.id}`}
                  onClick={() => toggleAccordion(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 10px",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                    minHeight: 56,
                  }}
                >
                  {/* Bulk Select Checkbox (Controller only) */}
                  {isController && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectItem?.(item.id);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectItem?.(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          accentColor: "var(--color-accent)",
                        }}
                      />
                    </div>
                  )}

                  {/* Part Number Badge */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      background: "var(--color-bg-wash)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "2px 6px",
                      minWidth: 26,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.no || "-"}
                  </span>

                  {/* Description & Technical Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                        marginTop: 2,
                      }}
                    >
                      {[
                        item.dimension || null,
                        item.material || null,
                        `Qty: ${item.qty ?? 1}`,
                        item.hrc ? `HRc: ${item.hrc}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>

                  {/* Status Preview + Progress Ratio + Chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: activeColor.color,
                        background: activeColor.bg,
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        maxWidth: 95,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {activeStatus.label}
                    </span>

                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        minWidth: 24,
                        textAlign: "right",
                      }}
                    >
                      {doneCount}/{totalProcesses}
                    </span>

                    {/* Clean Monochrome Chevron SVG */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        color: "var(--color-text-muted)",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 150ms ease",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion: Full-width Process Rows */}
                {isExpanded && (
                  <div
                    data-testid={`accordion-details-${item.id}`}
                    style={{
                      borderTop: "1px solid var(--color-border-subtle)",
                      background: "var(--color-bg-wash)",
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      Tahapan Proses
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {processes.map((processName) => {
                        const control = item.controls.find((c) => c.process === processName);
                        if (!control) return null;

                        return (
                          <div
                            key={processName}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "var(--color-bg-raised)",
                              border: "1px solid var(--color-border-subtle)",
                              borderRadius: "var(--radius-sm)",
                              padding: "6px 10px",
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--color-text)",
                                minWidth: 90,
                              }}
                            >
                              {processName === "Material" ? "PO Mtl" : processName}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <ProcessControlCell
                                control={control}
                                projectId={projectId}
                                joId={joId}
                                categoryId={category.id}
                                itemId={item.id}
                                itemDescription={item.description}
                                onStatusChange={(newStatus, notes) => {
                                  if (
                                    newStatus === "In Progress" &&
                                    (processName === "Material" || processName === "PO") &&
                                    onRequestSendPo
                                  ) {
                                    onRequestSendPo({
                                      categoryId: category.id,
                                      item,
                                      process: processName,
                                    });
                                    return;
                                  }
                                  if (newStatus === "In Progress SC" && onRequestSendSubcont) {
                                    onRequestSendSubcont({
                                      categoryId: category.id,
                                      item,
                                      process: processName,
                                    });
                                    return;
                                  }
                                  dispatch({
                                    type: "UPDATE_STATUS",
                                    projectId,
                                    joId,
                                    categoryId: category.id,
                                    itemId: item.id,
                                    process: processName,
                                    status: newStatus,
                                    notes,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Controller Actions Footer */}
                    {isController && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 8,
                          marginTop: 6,
                          paddingTop: 8,
                          borderTop: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditItem?.(item);
                          }}
                          style={{ fontSize: 11, padding: "4px 8px" }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginRight: 4 }}
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          Edit Part
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem?.(item);
                          }}
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            color: "var(--color-status-problem)",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginRight: 4 }}
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
                          Hapus Part
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
