"use client";
import React, { useRef, useEffect } from "react";
import type { Category } from "@/lib/types";
import { PART_PROCESSES, COMPONENT_PROCESSES } from "@/lib/types";
import { useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ProcessControlCell } from "./process-control-cell";
import { EmptyState } from "./empty-state";

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
}: ControlTableProps) {
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const processes = category.kind === "Part" ? PART_PROCESSES : COMPONENT_PROCESSES;

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
      <div className="table-scroll">
        <table className={`control-table ${!isController ? "table-viewer" : ""}`}>
          <thead>
            <tr>
              {/* Sticky NO column with integrated bulk select checkbox for controllers */}
              <th
                className="th-sticky-no"
                style={{
                  minWidth: isController ? 64 : 40,
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
              <th style={{ minWidth: 140 }}>Description</th>
              <th style={{ minWidth: 90 }}>Dimension</th>
              <th style={{ minWidth: 70 }}>Material</th>
              <th style={{ minWidth: 36, textAlign: "center" }}>Qty</th>
              <th style={{ minWidth: 50, textAlign: "center" }}>HRc</th>
              {processes.map((p) => (
                <th key={p} style={{ minWidth: 110, textAlign: "center" }}>
                  {p === "Material" ? "PO Mtl" : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.items.map((item) => {
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
                  <td style={{ fontWeight: 500 }}>{item.description}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.dimension}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.material}</td>
                  <td style={{ textAlign: "center" }}>{item.qty}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>{item.hrc || "-"}</td>
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
                              onRequestSendPo({ categoryId: category.id, item, process: processName });
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
    </div>
  );
}
