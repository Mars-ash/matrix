"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import type { Category } from "@/lib/types";
import { PART_PROCESSES, COMPONENT_PROCESSES } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { isItemPoSent } from "@/lib/po-tracking";
import { isItemSubcontSent } from "@/lib/subcont-tracking";
import { ProcessControlCell } from "./process-control-cell";
import { EmptyState } from "./empty-state";
import { MobileItemList } from "./mobile-item-list";

interface ControlTableProps {
  category: Category;
  projectId: string;
  joId: string;
  onAddData: () => void;
  highlightedItemId?: string | null;
  selectedItemIds?: string[];
  onToggleSelectItem?: (itemId: string) => void;
  onToggleSelectAllCategory?: (itemIds: string[], selectAll: boolean) => void;
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
  defaultMobileView?: "list" | "table";
  sortMode?: "default" | "newest" | "oldest";
  onSortModeChange?: (mode: "default" | "newest" | "oldest") => void;
}

export function ControlTable({
  category,
  projectId,
  joId,
  onAddData,
  highlightedItemId,
  selectedItemIds = [],
  onToggleSelectItem,
  onToggleSelectAllCategory,
  onRequestSendPo,
  onRequestSendSubcont,
  onEditItem,
  onDeleteItem,
  defaultMobileView = "list",
  sortMode: externalSortMode,
  onSortModeChange,
}: ControlTableProps) {
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const processes = category.kind === "Part" ? PART_PROCESSES : COMPONENT_PROCESSES;

  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "table">(defaultMobileView);
  const [internalSortMode, setInternalSortMode] = useState<"default" | "newest" | "oldest">("default");
  const sortMode = externalSortMode ?? internalSortMode;

  const cycleSortMode = () => {
    const nextMode =
      sortMode === "default" ? "newest" : sortMode === "newest" ? "oldest" : "default";
    if (onSortModeChange) {
      onSortModeChange(nextMode);
    } else {
      setInternalSortMode(nextMode);
    }
  };

  const sortedItems = useMemo(() => {
    if (sortMode === "default") {
      return category.items;
    }

    const itemsWithIndex = category.items.map((item, index) => ({ item, index }));

    itemsWithIndex.sort((a, b) => {
      const hasTimeA = typeof a.item.createdAt === "string" && !isNaN(new Date(a.item.createdAt).getTime());
      const hasTimeB = typeof b.item.createdAt === "string" && !isNaN(new Date(b.item.createdAt).getTime());

      if (hasTimeA && hasTimeB) {
        const timeA = new Date(a.item.createdAt!).getTime();
        const timeB = new Date(b.item.createdAt!).getTime();
        if (timeA !== timeB) {
          return sortMode === "newest" ? timeB - timeA : timeA - timeB;
        }
      } else if (hasTimeA && !hasTimeB) {
        return sortMode === "newest" ? -1 : 1;
      } else if (!hasTimeA && hasTimeB) {
        return sortMode === "newest" ? 1 : -1;
      }

      return sortMode === "newest" ? b.index - a.index : a.index - b.index;
    });

    return itemsWithIndex.map((entry) => entry.item);
  }, [category.items, sortMode]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const categoryItemIds = category.items.map((i) => i.id);
  const selectedCountInCategory = categoryItemIds.filter((id) => selectedItemIds.includes(id)).length;
  const isAllCategorySelected = category.items.length > 0 && selectedCountInCategory === category.items.length;
  const isSomeCategorySelected = selectedCountInCategory > 0 && !isAllCategorySelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeCategorySelected;
    }
  }, [isSomeCategorySelected]);

  if (category.items.length === 0) {
    return (
      <EmptyState
        title="No items yet"
        description="Add parts or components to start tracking progress."
        action={
          isController ? (
            <button className="btn btn-primary btn-sm" onClick={onAddData}>
              + Add Data
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div>
      {/* Mobile view switcher (hidden on desktop screens >= 769px via CSS) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        {/* Sort cycle button: default -> paling terbaru -> terlama -> default */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="btn-icon"
            onClick={cycleSortMode}
            title={
              sortMode === "default"
                ? "Urutan: Default (Klik untuk urutkan Paling Terbaru)"
                : sortMode === "newest"
                  ? "Urutan: Paling Terbaru (Klik untuk urutkan Terlama)"
                  : "Urutan: Terlama (Klik untuk kembali ke Default)"
            }
            aria-label={
              sortMode === "default"
                ? "Urutan Default"
                : sortMode === "newest"
                  ? "Urutan Paling Terbaru"
                  : "Urutan Terlama"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: "var(--radius-sm)",
              background: sortMode !== "default" ? "var(--color-bg-hover)" : "transparent",
              border:
                sortMode !== "default"
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border-subtle)",
              color:
                sortMode !== "default"
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
            onMouseEnter={(e) => {
              if (sortMode === "default") {
                e.currentTarget.style.borderColor = "var(--color-accent)";
                e.currentTarget.style.color = "var(--color-accent)";
                e.currentTarget.style.background = "var(--color-bg-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (sortMode === "default") {
                e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {sortMode === "default" && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21 16-4 4-4-4" />
                <path d="M17 20V4" />
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
              </svg>
            )}
            {sortMode === "newest" && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 16 4 4 4-4" />
                <path d="M7 20V4" />
                <path d="M11 4h10" />
                <path d="M11 8h7" />
                <path d="M11 12h4" />
              </svg>
            )}
            {sortMode === "oldest" && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
                <path d="M11 12h4" />
                <path d="M11 8h7" />
                <path d="M11 4h10" />
              </svg>
            )}
          </button>

          <span
            onClick={cycleSortMode}
            style={{
              fontSize: 11,
              fontWeight: sortMode !== "default" ? 600 : 500,
              color:
                sortMode !== "default"
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              background:
                sortMode !== "default"
                  ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                  : "transparent",
              padding: sortMode !== "default" ? "2px 7px" : "2px 4px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 120ms ease",
            }}
            title={
              sortMode === "default"
                ? "Klik untuk urutkan Paling Terbaru"
                : sortMode === "newest"
                  ? "Klik untuk urutkan Terlama"
                  : "Klik untuk kembali ke Urutan Default"
            }
          >
            {sortMode === "default"
              ? "Urutkan: Default"
              : sortMode === "newest"
                ? "Paling Terbaru"
                : "Terlama"}
          </span>
        </div>

        <div className="mobile-view-toggle">
          <button
            type="button"
            className={mobileView === "list" ? "active" : ""}
            onClick={() => setMobileView("list")}
          >
            List
          </button>
          <button
            type="button"
            className={mobileView === "table" ? "active" : ""}
            onClick={() => setMobileView("table")}
          >
            Matriks
          </button>
        </div>
      </div>

      {isMobile && mobileView === "list" ? (
        <MobileItemList
          category={{ ...category, items: sortedItems }}
          projectId={projectId}
          joId={joId}
          highlightedItemId={highlightedItemId}
          selectedItemIds={selectedItemIds}
          onToggleSelectItem={onToggleSelectItem}
          onRequestSendPo={onRequestSendPo}
          onRequestSendSubcont={onRequestSendSubcont}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      ) : (
        <div className="table-scroll">
          <table className={`control-table ${!isController ? "table-viewer" : ""}`}>
          <thead>
            <tr>
              {/* Sticky NO column with integrated bulk select checkbox for controllers */}
              <th
                className="th-sticky-no"
                style={{
                  width: isController ? 64 : 40,
                  minWidth: isController ? 64 : 40,
                  maxWidth: isController ? 64 : 40,
                  textAlign: "center",
                  padding: "6px 8px",
                  cursor: isController ? "pointer" : "default",
                  userSelect: "none",
                }}
                onClick={() => {
                  if (isController) onToggleSelectAllCategory?.(categoryItemIds, !isAllCategorySelected);
                }}
                title={isController ? "Pilih semua part di kategori ini" : undefined}
              >
                {isController ? (
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={isAllCategorySelected}
                      onChange={(e) => onToggleSelectAllCategory?.(categoryItemIds, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", accentColor: "var(--color-accent)" }}
                      title="Pilih semua part di kategori ini"
                    />
                    <span>No</span>
                  </div>
                ) : (
                  "No"
                )}
              </th>
              <th className="th-sticky-desc" style={{ minWidth: 160 }}>Description</th>
              <th style={{ minWidth: 90 }}>Dimension</th>
              <th style={{ minWidth: 70 }}>Material</th>
              <th style={{ minWidth: 36, textAlign: "center" }}>Qty</th>
              <th style={{ minWidth: 50, textAlign: "center" }}>HRc</th>
              {isController && (
                <th style={{ width: 70, minWidth: 70, textAlign: "center" }}>Aksi</th>
              )}
              {processes.map((p) => (
                <th key={p} style={{ minWidth: 110, textAlign: "center" }}>
                  {p === "Material" ? "PO Mtl" : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);

              return (
                <tr
                  key={item.id}
                  id={`item-${item.id}`}
                  className={[
                    highlightedItemId === item.id ? "row-highlight" : "",
                    isSelected ? "row-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    backgroundColor: isSelected ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : undefined,
                  }}
                >
                  {/* Sticky NO cell with integrated row selection */}
                  <td
                    className="td-sticky-no"
                    style={{
                      width: isController ? 64 : 40,
                      minWidth: isController ? 64 : 40,
                      maxWidth: isController ? 64 : 40,
                      fontWeight: 500,
                      color: isSelected ? "var(--color-accent)" : "var(--color-text-secondary)",
                      cursor: isController ? "pointer" : "default",
                      userSelect: "none",
                      padding: "5px 8px",
                      textAlign: "center",
                    }}
                    onClick={() => {
                      if (isController) onToggleSelectItem?.(item.id);
                    }}
                    title={isController ? "Klik untuk memilih/membatalkan pilihan baris" : undefined}
                  >
                    {isController ? (
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectItem?.(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: "pointer", accentColor: "var(--color-accent)" }}
                        />
                        <span>{item.no}</span>
                      </div>
                    ) : (
                      item.no
                    )}
                  </td>
                  <td className="td-sticky-desc" style={{ fontWeight: 500 }}>{item.description}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.dimension}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.material}</td>
                  <td style={{ textAlign: "center" }}>{item.qty}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>{item.hrc || "-"}</td>
                  {isController && (
                    <td style={{ textAlign: "center", padding: "4px 6px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditItem?.(item);
                          }}
                          title="Edit Part"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 26,
                            height: 26,
                            borderRadius: "var(--radius-sm)",
                            background: "transparent",
                            border: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
                            transition: "all 120ms ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-accent)";
                            e.currentTarget.style.color = "var(--color-accent)";
                            e.currentTarget.style.background = "var(--color-bg-hover)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                            e.currentTarget.style.color = "var(--color-text-secondary)";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem?.(item);
                          }}
                          title="Hapus Part"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 26,
                            height: 26,
                            borderRadius: "var(--radius-sm)",
                            background: "transparent",
                            border: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-muted)",
                            cursor: "pointer",
                            transition: "all 120ms ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.4)";
                            e.currentTarget.style.color = "var(--color-status-problem)";
                            e.currentTarget.style.background = "var(--color-status-problem-bg)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                            e.currentTarget.style.color = "var(--color-text-muted)";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            <line x1="10" x2="10" y1="11" y2="17"/>
                            <line x1="14" x2="14" y1="11" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                  {processes.map((processName) => {
                    const control = item.controls.find((c) => c.process === processName);
                    if (!control) return <td key={processName} style={{ textAlign: "center" }}>-</td>;
                    return (
                      <td key={processName} style={{ textAlign: "center" }}>
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
                              if (isItemPoSent(item, category.kind)) {
                                return;
                              }
                              onRequestSendPo({ categoryId: category.id, item, process: processName });
                              return;
                            }
                            if (newStatus === "In Progress SC" && onRequestSendSubcont) {
                              if (isItemSubcontSent(item, processName)) {
                                return;
                              }
                              onRequestSendSubcont({ categoryId: category.id, item, process: processName });
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
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
