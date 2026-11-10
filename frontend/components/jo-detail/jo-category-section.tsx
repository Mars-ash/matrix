"use client";

import React from "react";
import { ControlTable } from "@/components/control-table";
import { categoryProgress, categoryLastUpdated } from "@/lib/progress";
import { formatProgress } from "@/lib/format";
import type { Category, Item } from "@/lib/types";

export interface JoCategorySectionProps {
  category: Category;
  projectId: string;
  joId: string;
  isController: boolean;
  sortMode: "default" | "newest" | "oldest";
  onCycleSortMode: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddData: (categoryId: string) => void;
  highlightedItemId: string | null;
  selectedItemIds: string[];
  onToggleSelectItem: (itemId: string) => void;
  onToggleSelectAllCategory: (itemIds: string[], selectAll: boolean) => void;
  onRequestSendPo: (payload: { categoryId: string; item: Item; process: "Material" | "PO" }) => void;
  onRequestSendSubcont: (payload: { categoryId: string; item: Item; process: string }) => void;
  onEditItem: (payload: { item: Item; categoryId: string }) => void;
  onDeleteItem: (payload: { item: Item; categoryId: string }) => void;
}

export function JoCategorySection({
  category: cat,
  projectId,
  joId,
  isController,
  sortMode,
  onCycleSortMode,
  onEditCategory,
  onDeleteCategory,
  onAddData,
  highlightedItemId,
  selectedItemIds,
  onToggleSelectItem,
  onToggleSelectAllCategory,
  onRequestSendPo,
  onRequestSendSubcont,
  onEditItem,
  onDeleteItem,
}: JoCategorySectionProps) {
  return (
    <section id={`cat-${cat.id}`} className="jo-category-section" style={{ scrollMarginTop: 84 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>{cat.label}</h2>
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            {cat.kind} · {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}
            {cat.isCustom && " · Custom"}
          </span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 2 }}>
            {isController && (
              <>
                {/* Tombol Hapus Kategori */}
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onDeleteCategory(cat)}
                  title="Hapus Kategori"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </button>

                {/* Tombol Edit Kategori */}
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onEditCategory(cat)}
                  title="Edit Nama Kategori"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "1px solid var(--color-border-subtle)",
                    color: "var(--color-text-muted)",
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
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              </>
            )}

            {/* Tombol Sort Kategori */}
            <button
              type="button"
              onClick={onCycleSortMode}
              title={
                sortMode === "default"
                  ? "Urutan: Default (Klik untuk urutkan Terbaru)"
                  : sortMode === "newest"
                    ? "Urutan: Terbaru (Klik untuk urutkan Terlama)"
                    : "Urutan: Terlama (Klik untuk kembali ke Default)"
              }
              aria-label={`Urutan ${sortMode === "default" ? "Default" : sortMode === "newest" ? "Terbaru" : "Terlama"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                height: 24,
                padding: "0 7px",
                borderRadius: "var(--radius-sm)",
                background:
                  sortMode !== "default"
                    ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                    : "transparent",
                border:
                  sortMode !== "default"
                    ? "1px solid var(--color-accent)"
                    : "1px solid var(--color-border-subtle)",
                color:
                  sortMode !== "default"
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: sortMode !== "default" ? 600 : 500,
                transition: "all 120ms ease",
                userSelect: "none",
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
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {sortMode === "default" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 16-4 4-4-4" />
                  <path d="M17 20V4" />
                  <path d="m3 8 4-4 4 4" />
                  <path d="M7 4v16" />
                </svg>
              )}
              {sortMode === "newest" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 16 4 4 4-4" />
                  <path d="M7 20V4" />
                  <path d="M11 4h10" />
                  <path d="M11 8h7" />
                  <path d="M11 12h4" />
                </svg>
              )}
              {sortMode === "oldest" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 8 4-4 4 4" />
                  <path d="M7 4v16" />
                  <path d="M11 12h4" />
                  <path d="M11 8h7" />
                  <path d="M11 4h10" />
                </svg>
              )}
              <span>
                {sortMode === "default"
                  ? "Default"
                  : sortMode === "newest"
                    ? "Terbaru"
                    : "Terlama"}
              </span>
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Last Updated:{" "}
            <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {categoryLastUpdated(cat)}
            </span>
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {formatProgress(categoryProgress(cat))}
          </span>
          {isController && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onAddData(cat.id)}
              style={{ fontSize: 11, padding: "4px 8px" }}
            >
              + Add Data
            </button>
          )}
        </div>
      </div>

      <ControlTable
        category={cat}
        projectId={projectId}
        joId={joId}
        sortMode={sortMode}
        onSortModeChange={() => {}}
        onAddData={() => onAddData(cat.id)}
        highlightedItemId={highlightedItemId}
        selectedItemIds={selectedItemIds}
        onToggleSelectItem={onToggleSelectItem}
        onToggleSelectAllCategory={onToggleSelectAllCategory}
        onRequestSendPo={onRequestSendPo}
        onRequestSendSubcont={onRequestSendSubcont}
        onEditItem={(item) => onEditItem({ item, categoryId: cat.id })}
        onDeleteItem={(item) => onDeleteItem({ item, categoryId: cat.id })}
      />
    </section>
  );
}

