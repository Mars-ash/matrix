
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import type { Project, JO, Category, Item, Control } from "@/lib/types";

interface MainUnifiedSearchProps {
  projects: Project[];
  value: string;
  onChange: (val: string) => void;
}

export interface PartSearchResult {
  project: Project;
  jo: JO;
  category: Category;
  item: Item;
  focusControl: Control | null;
  href: string;
}

const STATUS_RANK: Record<string, number> = {
  Problem: 0,
  "Not Started": 1,
  "In Progress": 2,
  "In Progress SC": 3,
  Done: 4,
};

const PROCESS_ORDER: Record<string, number> = {
  Material: 0,
  PO: 0,
  Arrival: 1,
  Machining: 2,
  Hardening: 3,
  Grinding: 4,
  Wirecut: 5,
  Assembly: 6,
};

export function MainUnifiedSearch({ projects, value, onChange }: MainUnifiedSearchProps) {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const partResults = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const matches: PartSearchResult[] = [];

    for (const project of projects) {
      for (const jo of project.jos) {
        for (const cat of jo.categories) {
          for (const item of cat.items) {
            const partHaystack = [
              item.no,
              item.description,
              item.dimension,
              item.material,
              item.subcontSupplier ?? "",
              cat.label,
            ]
              .join(" ")
              .toLowerCase();

            // Must match at least one token against part-specific attributes
            const matchesPartSpecific = tokens.some((t) => partHaystack.includes(t));
            if (!matchesPartSpecific) continue;

            // Full context haystack (can include JO number or project name in multi-word query)
            const fullHaystack = [partHaystack, jo.joNumber, project.name, project.customer]
              .join(" ")
              .toLowerCase();

            const allTokensMatch = tokens.every((t) => fullHaystack.includes(t));
            if (!allTokensMatch) continue;

            // Select focus control (most urgent status)
            const applicable = item.controls.filter((c) => c.status !== "-");
            let focusControl: Control | null = null;
            if (applicable.length > 0) {
              let best = applicable[0];
              for (const c of applicable.slice(1)) {
                const a = STATUS_RANK[c.status] ?? 99;
                const b = STATUS_RANK[best.status] ?? 99;
                if (a < b || (a === b && (PROCESS_ORDER[c.process] ?? 99) < (PROCESS_ORDER[best.process] ?? 99))) {
                  best = c;
                }
              }
              focusControl = best;
            }

            matches.push({
              project,
              jo,
              category: cat,
              item,
              focusControl,
              href: `/projects/${project.id}/jos/${jo.id}?item=${encodeURIComponent(item.id)}`,
            });
          }
        }
      }
    }

    return matches;
  }, [projects, value]);

  const showDropdown = focused && value.trim().length >= 2 && partResults.length > 0;
  const visibleResults = partResults.slice(0, 20);

  return (
    <div ref={wrapperRef} className="main-search-container">
      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        <input
          className="input"
          type="text"
          placeholder="Cari project, JO, atau part..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
              e.currentTarget.blur();
            }
          }}
          style={{
            width: "100%",
            fontSize: 12,
            paddingRight: value ? 26 : 10,
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFocused(false);
            }}
            aria-label="Hapus pencarian"
            style={{
              position: "absolute",
              right: 6,
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              padding: "2px 4px",
              fontSize: 14,
              lineHeight: 1,
              borderRadius: "50%",
            }}
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="main-search-results">
          <div
            style={{
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "var(--color-bg-wash)",
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <span>Hasil Part ({partResults.length})</span>
            <span style={{ fontSize: 10, fontWeight: 400 }}>Klik untuk buka di JO</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {visibleResults.map((r) => (
              <button
                key={`${r.project.id}-${r.jo.id}-${r.item.id}`}
                type="button"
                className="jo-search-result-item"
                onClick={() => {
                  setFocused(false);
                  router.push(r.href);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, width: "100%" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.jo.joNumber} · {r.category.label}
                  </span>
                  {r.focusControl && (
                    <span style={{ fontSize: 10, flexShrink: 0 }}>
                      <StatusBadge status={r.focusControl.status} />
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginTop: 1 }}>
                  {r.item.no && r.item.no !== "-" ? `${r.item.no} — ` : ""}
                  {r.item.description}
                </div>

                <div style={{ fontSize: 11, color: "var(--color-text-muted)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>{r.project.name}</span>
                  {r.item.dimension && <span>· {r.item.dimension}</span>}
                  {r.item.material && <span>· {r.item.material}</span>}
                  {r.item.isSubcont && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: "var(--color-status-in-progress-bg)",
                        color: "var(--color-status-in-progress)",
                        border: "1px solid rgba(217, 119, 6, 0.3)",
                      }}
                    >
                      SC{r.item.subcontSupplier ? ` · ${r.item.subcontSupplier}` : ""}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {partResults.length > 20 && (
            <div
              style={{
                padding: "6px 12px",
                fontSize: 11,
                color: "var(--color-text-muted)",
                textAlign: "center",
                background: "var(--color-bg-wash)",
                borderTop: "1px solid var(--color-border-subtle)",
              }}
            >
              Menampilkan 20 dari {partResults.length} part yang cocok
            </div>
          )}
        </div>
      )}
    </div>
  );
}
