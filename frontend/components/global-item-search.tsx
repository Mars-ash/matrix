"use client";
import React, { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { poTrackingLabel } from "@/lib/po-tracking";
import {
  DEFAULT_FILTERS,
  FILTERABLE_STATUSES,
  MIN_QUERY_LENGTH,
  collectSubcontSuppliers,
  searchItems,
  type FilterableStatus,
  type JoStateFilter,
  type SearchFilters,
  type SearchHit,
} from "@/lib/global-search";
import type { Project } from "@/lib/types";

const MAX_GROUPS = 50;
const ROW_CAP = 10;
const AUTO_OPEN_MAX_GROUPS = 3;

const JO_STATE_OPTIONS: { value: JoStateFilter; label: string }[] = [
  { value: "all", label: "Semua JO" },
  { value: "active", label: "JO Aktif" },
  { value: "finished", label: "JO Selesai" },
];

function isDefaultFilters(f: SearchFilters): boolean {
  return f.joState === "all" && f.statuses.length === 0 && f.supplier === "";
}

function HitRow({ hit }: { hit: SearchHit }) {
  const { item, category, focusControl } = hit;
  const meta = [
    item.dimension,
    item.material,
    `Qty ${item.qty}`,
    item.hrc && item.hrc !== "-" ? `HRc ${item.hrc}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link href={hit.href} className="gs-hit">
        <span className="gs-hit-main">
          <span className="gs-hit-title">
            <span className="gs-hit-path">{category.label} › </span>
            {item.no && item.no !== "-" ? `${item.no} — ` : ""}
            {item.description}
          </span>
          <span className="gs-hit-meta">{meta}</span>
        </span>
        <span className="gs-hit-side">
          {item.isSubcont && (
            <span className="gs-tag">
              {item.subcontSupplier ? `SC · ${item.subcontSupplier}` : "SC"}
            </span>
          )}
          {focusControl ? (
            <>
              <span>{poTrackingLabel(focusControl.process)}</span>
              <StatusBadge status={focusControl.status} />
            </>
          ) : (
            <span>Tidak ada proses</span>
          )}
        </span>
      </Link>
    </li>
  );
}

export function GlobalItemSearch({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const deferredQuery = useDeferredValue(query);
  const suppliers = useMemo(() => collectSubcontSuppliers(projects), [projects]);
  const response = useMemo(
    () => searchItems(projects, deferredQuery, filters),
    [projects, deferredQuery, filters]
  );

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const isActive = trimmed.length >= MIN_QUERY_LENGTH;
  const defaultOpen = response.groups.length <= AUTO_OPEN_MAX_GROUPS;
  const visibleGroups = response.groups.slice(0, MAX_GROUPS);

  const updateQuery = (value: string) => {
    setQuery(value);
    setToggled({});
    setExpandedRows({});
  };

  const toggleStatus = (status: FilterableStatus) => {
    setFilters((f) => ({
      ...f,
      statuses: f.statuses.includes(status)
        ? f.statuses.filter((s) => s !== status)
        : [...f.statuses, status],
    }));
  };

  return (
    <section className="gs" aria-label="Pencarian part lintas JO">
      <div className="gs-input-row">
        <input
          className="input"
          type="search"
          aria-label="Cari part di semua JO"
          placeholder="Cari part / komponen di semua JO… (mis. guide pin 126.110)"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") updateQuery("");
          }}
        />
      </div>

      {hasQuery && (
        <div className="gs-filters">
          <div className="gs-seg" role="group" aria-label="Filter status JO">
            {JO_STATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={filters.joState === opt.value}
                onClick={() => setFilters((f) => ({ ...f, joState: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="gs-chips" role="group" aria-label="Filter status proses">
            {FILTERABLE_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className="gs-chip"
                aria-pressed={filters.statuses.includes(s)}
                onClick={() => toggleStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {suppliers.length > 0 && (
            <select
              className="select"
              aria-label="Filter supplier subcont"
              value={filters.supplier}
              onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))}
            >
              <option value="">Semua supplier</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {!isDefaultFilters(filters) && (
            <button type="button" className="gs-reset" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset filter
            </button>
          )}
        </div>
      )}

      {isActive && response.totalHits > 0 && (
        <>
          <p className="gs-summary" role="status">
            {`${response.totalHits} item di ${response.groups.length} JO`}
          </p>
          {response.groups.length > MAX_GROUPS && (
            <p className="gs-summary">
              {`Menampilkan ${MAX_GROUPS} JO teratas — persempit pencarian atau gunakan filter.`}
            </p>
          )}
          <div className="gs-results">
            {visibleGroups.map((g) => {
              const open = toggled[g.jo.id] ?? defaultOpen;
              const showAll = Boolean(expandedRows[g.jo.id]);
              const rows = showAll ? g.hits : g.hits.slice(0, ROW_CAP);
              return (
                <div className="gs-group" key={g.jo.id}>
                  <button
                    type="button"
                    className="gs-group-header"
                    aria-expanded={open}
                    onClick={() => setToggled((t) => ({ ...t, [g.jo.id]: !open }))}
                  >
                    <span className={`gs-chevron ${open ? "is-open" : ""}`} aria-hidden="true">
                      ▶
                    </span>
                    <span className="gs-group-title">{`JO ${g.jo.joNumber}`}</span>
                    <span className="gs-group-sub">
                      {`${g.jo.product} · ${g.project.name} (${g.project.customer})`}
                    </span>
                    {g.project.company && <span className="gs-tag">{g.project.company}</span>}
                    {g.finished && <span className="gs-tag">SELESAI</span>}
                    <span className="gs-group-count">{`${g.hits.length} item`}</span>
                  </button>
                  {open && (
                    <>
                      <ul className="gs-hit-list">
                        {rows.map((hit) => (
                          <HitRow key={hit.item.id} hit={hit} />
                        ))}
                      </ul>
                      {!showAll && g.hits.length > ROW_CAP && (
                        <button
                          type="button"
                          className="gs-more"
                          onClick={() => setExpandedRows((r) => ({ ...r, [g.jo.id]: true }))}
                        >
                          {`Tampilkan semua ${g.hits.length} item`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {isActive && response.totalHits === 0 && (
        <p className="gs-empty">
          Tidak ada item yang cocok. Coba kata kunci lain atau longgarkan filter.
        </p>
      )}
    </section>
  );
}
