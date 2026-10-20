"use client";
import React, { useState, useCallback, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ControlTable } from "@/components/control-table";
import { ActivityPanel } from "@/components/activity-panel";
import { AddDataDialog } from "@/components/add-data-dialog";
import { CategoryCreateDialog } from "@/components/category-create-dialog";
import { CategoryEditDialog } from "@/components/category-edit-dialog";
import { JoItemSearch } from "@/components/jo-item-search";
import { Dialog } from "@/components/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ItemEditDialog } from "@/components/item-edit-dialog";
import { JoDetailSkeleton } from "@/components/skeleton-loader";
import { useAppState, useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { joProgress, joProblemCount, categoryProgress } from "@/lib/progress";
import { formatProgress } from "@/lib/format";
import { SUBCONT_SUPPLIERS, PO_SUPPLIERS, type ControlStatus, type Item, type Category } from "@/lib/types";
import { poTrackingLabel, isItemPoSent } from "@/lib/po-tracking";
import { isItemSubcontSent } from "@/lib/subcont-tracking";

interface PageProps {
  params: Promise<{ projectId: string; joId: string }>;
}

const BULK_PROCESS_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "PO", label: "PO" },
  { value: "Arrival", label: "Arrival" },
  { value: "Machining", label: "Machining" },
  { value: "Hardening", label: "Hardening" },
  { value: "Grinding", label: "Grinding" },
  { value: "Wirecut", label: "Wirecut" },
  { value: "Assembly", label: "Assembly" },
];

export default function JoDetailPage({ params }: PageProps) {
  const { projectId, joId } = use(params);
  const router = useRouter();
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const [addDataCatId, setAddDataCatId] = useState<string | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Item edit / delete states
  const [editingItem, setEditingItem] = useState<{ item: Item; categoryId: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ item: Item; categoryId: string } | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  // Bulk operation states
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeBulkModal, setActiveBulkModal] = useState<"po" | "status" | "subcont" | null>(null);
  const [bulkArrivalDate, setBulkArrivalDate] = useState("");
  const [bulkStatusProcesses, setBulkStatusProcesses] = useState<string[]>(["Machining"]);
  const [bulkStatusValue, setBulkStatusValue] = useState<ControlStatus>("In Progress");
  const [bulkStatusNotes, setBulkStatusNotes] = useState("");
  const [bulkSubcontProcess, setBulkSubcontProcess] = useState("Machining");
  const [bulkSubcontSupplier, setBulkSubcontSupplier] = useState("");
  const [bulkSubcontArrivalDate, setBulkSubcontArrivalDate] = useState("");

  // Kirim Subcont states (for both bulk and single item trigger)
  const [singleSubcontItem, setSingleSubcontItem] = useState<{
    categoryId: string;
    item: Item;
    process: string;
  } | null>(null);

  // Kirim PO states (for both bulk and single item trigger)
  const [singlePoItem, setSinglePoItem] = useState<{
    categoryId: string;
    item: Item;
    process: "Material" | "PO";
  } | null>(null);
  const [poSupplier, setPoSupplier] = useState("");
  const [poNo, setPoNo] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poTargetArrival, setPoTargetArrival] = useState("");
  const [poNotes, setPoNotes] = useState("");

  const project = projects.find((p) => p.id === projectId || (p as any).tempId === projectId)
    || projects.find((p) => p.jos.some((j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId));
  const jo = project?.jos.find((j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId);

  const progress = jo ? joProgress(jo) : null;
  const problems = jo ? joProblemCount(jo) : 0;
  const addDataCat = jo ? jo.categories.find((c) => c.id === addDataCatId) : null;

  // Memoized lists of PO eligibility
  const selectedPoItems = useMemo<{ item: Item; categoryKind: string }[]>(() => {
    if (!jo) return [];
    const items: { item: Item; categoryKind: string }[] = [];
    for (const cat of jo.categories) {
      for (const item of cat.items) {
        if (selectedItemIds.includes(item.id)) {
          items.push({ item, categoryKind: cat.kind });
        }
      }
    }
    return items;
  }, [jo, selectedItemIds]);

  const eligiblePoItems = useMemo<{ item: Item; categoryKind: string }[]>(() => {
    return selectedPoItems.filter(({ item, categoryKind }: { item: Item; categoryKind: string }) => !isItemPoSent(item, categoryKind));
  }, [selectedPoItems]);

  const alreadySentPoItems = useMemo<{ item: Item; categoryKind: string }[]>(() => {
    return selectedPoItems.filter(({ item, categoryKind }: { item: Item; categoryKind: string }) => isItemPoSent(item, categoryKind));
  }, [selectedPoItems]);

  // Memoized lists of Subcont eligibility
  const selectedSubcontItems = useMemo<Item[]>(() => {
    if (!jo) return [];
    const items: Item[] = [];
    for (const cat of jo.categories) {
      for (const item of cat.items) {
        if (selectedItemIds.includes(item.id)) {
          items.push(item);
        }
      }
    }
    return items;
  }, [jo, selectedItemIds]);

  const eligibleSubcontItems = useMemo<Item[]>(() => {
    return selectedSubcontItems.filter((item: Item) => !isItemSubcontSent(item, bulkSubcontProcess));
  }, [selectedSubcontItems, bulkSubcontProcess]);

  const alreadySentSubcontItems = useMemo<Item[]>(() => {
    return selectedSubcontItems.filter((item: Item) => isItemSubcontSent(item, bulkSubcontProcess));
  }, [selectedSubcontItems, bulkSubcontProcess]);

  // Handle search result navigation
  const handleSearchSelect = useCallback((categoryId: string, itemId: string) => {
    setHighlightedItemId(itemId);
    // Scroll to the item row
    const el = document.getElementById(`item-${itemId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Clear highlight after timeout
  useEffect(() => {
    if (!highlightedItemId) return;
    const timer = setTimeout(() => setHighlightedItemId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightedItemId]);

  // Handle direct item jump from URL (?item=<id> or #item-<id>) — used by global search and notification links.
  // Waits until the JO is in the store, then retries briefly until the row exists in the DOM.
  useEffect(() => {
    if (typeof window === "undefined" || !jo) return;
    const params = new URLSearchParams(window.location.search);
    const targetItemId = params.get("item") || window.location.hash.replace("#item-", "").replace("#", "");
    if (!targetItemId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedItemId(targetItemId);
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tryScroll = () => {
      const el = document.getElementById(`item-${targetItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (attempts < 20) {
        attempts += 1;
        timer = setTimeout(tryScroll, 100);
      }
    };
    timer = setTimeout(tryScroll, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jo?.id]);

  // Bulk selection handlers
  const handleToggleSelectItem = useCallback((itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  const handleToggleSelectAllCategory = useCallback((itemIds: string[], selectAll: boolean) => {
    setSelectedItemIds((prev) => {
      if (selectAll) {
        const set = new Set([...prev, ...itemIds]);
        return Array.from(set);
      } else {
        return prev.filter((id) => !itemIds.includes(id));
      }
    });
  }, []);

  const handleRequestSendPo = useCallback(
    (payload: { categoryId: string; item: Item; process: "Material" | "PO" }) => {
      const { item, process } = payload;
      const ctrl = item.controls.find((c) => c.process === process);
      const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
      setPoSupplier(ctrl?.poTracking?.supplier || "");
      setPoNo(ctrl?.poTracking?.poNo || "");
      setPoDate(ctrl?.poTracking?.poDate || new Date().toISOString().split("T")[0]);
      setPoTargetArrival(ctrl?.poTracking?.targetArrival || arrivalCtrl?.targetDate || "");
      setPoNotes(ctrl?.poTracking?.notes || "");
      setSinglePoItem(payload);
    },
    []
  );

  const handleOpenBulkPoModal = useCallback(() => {
    setPoSupplier("");
    setPoNo("");
    setPoDate(new Date().toISOString().split("T")[0]);
    setPoTargetArrival("");
    setPoNotes("");
    setActiveBulkModal("po");
  }, []);

  const handleRequestSendSubcont = useCallback(
    (payload: { categoryId: string; item: Item; process: string }) => {
      const { item, process } = payload;
      const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
      setBulkSubcontProcess(process || "Machining");
      setBulkSubcontSupplier(item.subcontSupplier || "");
      setBulkSubcontArrivalDate(item.arrivalTargetDate || arrivalCtrl?.targetDate || "");
      setSingleSubcontItem(payload);
    },
    []
  );

  const handleOpenBulkSubcontModal = useCallback(() => {
    setBulkSubcontProcess("Machining");
    setBulkSubcontSupplier("");
    setBulkSubcontArrivalDate("");
    setActiveBulkModal("subcont");
  }, []);

  if (project?.isSystem) {
    notFound();
  }

  if (!project || !jo) {
    return (
      <AppShell breadcrumbs={[{ label: "Job Order" }]}>
        <JoDetailSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: project.company ? `${project.name} (${project.company})` : project.name, href: "/" },
        { label: jo.joNumber },
      ]}
    >
      {/* Header */}
      <div className="jo-detail-header">
        {/* Left Side: Title & Progress Lock-up */}
        <div className="jo-detail-title-block">
          {/* JO Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: "clamp(20px, 4.5vw, 30px)", fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
                JO {jo.joNumber}
              </h1>
              {project.company && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: project.company === "BMI" ? "var(--color-status-done-bg)" : "var(--color-status-not-started-bg)",
                    color: project.company === "BMI" ? "var(--color-status-done)" : "var(--color-status-not-started)",
                    border: `1px solid ${project.company === "BMI" ? "rgba(13, 124, 74, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                    letterSpacing: "0.04em",
                  }}
                >
                  {project.company}
                </span>
              )}
            </div>
            <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)", fontWeight: 500, letterSpacing: "0.04em", color: "var(--color-text)", lineHeight: 1 }}>
              {jo.type.toUpperCase()}
            </span>
            <span style={{ fontSize: "clamp(11px, 2.2vw, 15px)", color: "var(--color-text-muted)", lineHeight: 1 }}>
              {jo.product} · {project.name} ({project.customer})
            </span>
          </div>

          {/* Vertical Divider — hidden on mobile via CSS */}
          <div className="jo-detail-divider" style={{ width: 2, height: 64, backgroundColor: "var(--color-text)", borderRadius: 1 }} />

          {/* Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
            <span
              style={{
                fontSize: "clamp(26px, 5.5vw, 38px)",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: progress === 100 ? "var(--color-status-done)" : "var(--color-text)",
              }}
            >
              {formatProgress(progress)}
            </span>
            <span style={{ fontSize: "clamp(10px, 1.8vw, 13px)", color: "var(--color-text-muted)", letterSpacing: "0.05em", fontWeight: 500 }}>
              PROGRESS
            </span>
          </div>
        </div>

        {/* Right Side: Target, Problems, Buttons */}
        <div className="jo-detail-meta">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {jo.targetDate && (
              <span>
                Target{" "}
                <strong style={{ fontSize: 16, color: "var(--color-text)" }}>
                  {jo.targetDate}
                </strong>
              </span>
            )}
            {problems > 0 && (
              <span>
                Problems{" "}
                <strong style={{ fontSize: 20, color: "var(--color-status-problem)" }}>
                  {problems}
                </strong>
              </span>
            )}
          </div>

          <div className="jo-detail-actions">
            <Link
              href={`/projects/${projectId}/jos/${joId}/trial-reports`}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}
            >
              Trial Reports
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => setIsActivityOpen(true)}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              Activity & Problem Log
            </button>

            {jo.finishDate ? (
              <span style={{ fontSize: 13, color: "var(--color-status-done)", fontWeight: 600, padding: "6px 12px", border: "1px solid var(--color-status-done)", borderRadius: "var(--radius-md)", background: "rgba(13, 124, 74, 0.05)", textAlign: "center" }}>
                Finished: {jo.finishDate}
              </span>
            ) : isController ? (
              <button
                className="btn btn-primary"
                onClick={() => setFinishConfirmOpen(true)}
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Finish JO
              </button>
            ) : (
              <span style={{ fontSize: 12, color: "var(--color-status-in-progress)", fontWeight: 600, padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-wash)" }}>
                Status: In Progress
              </span>
            )}

            {isController && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setDeleteConfirmOpen(true)}
                style={{ padding: "6px 12px", fontSize: 12 }}
                title="Hapus Job Order ini"
              >
                Hapus JO
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thin progress track */}
      {progress !== null && (
        <div
          style={{
            height: 3,
            background: "var(--color-bg-hover)",
            borderRadius: 1,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, progress))}%`,
              background:
                progress === 100
                  ? "var(--color-status-done)"
                  : progress >= 50
                    ? "var(--color-status-in-progress)"
                    : "var(--color-accent)",
              borderRadius: 1,
              transition: "width 200ms ease",
            }}
          />
        </div>
      )}

      {/* Search + Category jump links */}
      <div className="jo-search-category-bar">
        <JoItemSearch categories={jo.categories} onSelect={handleSearchSelect} />

        {jo.categories.length > 1 && (
          <div className="jo-category-tabs">
            {jo.categories.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(`cat-${cat.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    window.history.replaceState(null, "", `#cat-${cat.id}`);
                  }
                }}
                style={{
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                  padding: "6px 12px",
                  background: "var(--color-bg-hover)",
                  borderRadius: "var(--radius-sm)",
                  transition: "background 80ms, color 80ms",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-hover)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                {cat.label}
                <span style={{ color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600 }}>
                  {formatProgress(categoryProgress(cat))}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Category sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
        {jo.categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="jo-category-section" style={{ scrollMarginTop: 84 }}>
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
                {isController && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 2 }}>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setEditingCategory(cat)}
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
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setDeletingCategory(cat)}
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
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                    onClick={() => setAddDataCatId(cat.id)}
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
              onAddData={() => setAddDataCatId(cat.id)}
              highlightedItemId={highlightedItemId}
              selectedItemIds={selectedItemIds}
              onToggleSelectItem={handleToggleSelectItem}
              onToggleSelectAllCategory={handleToggleSelectAllCategory}
              onRequestSendPo={handleRequestSendPo}
              onRequestSendSubcont={handleRequestSendSubcont}
              onEditItem={(item) => setEditingItem({ item, categoryId: cat.id })}
              onDeleteItem={(item) => setDeletingItem({ item, categoryId: cat.id })}
            />
          </section>
        ))}
      </div>

      {/* Add New Category button (Controller only) */}
      {isController && (
        <div style={{ marginBottom: 28 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setCategoryCreateOpen(true)}
            style={{ width: "100%", padding: 10, borderStyle: "dashed", fontSize: 13 }}
          >
            + Add New Category
          </button>
        </div>
      )}

      {/* Activity Drawer */}
      {isActivityOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 40 }}
            onClick={() => setIsActivityOpen(false)}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              maxWidth: "100%",
              background: "var(--color-bg)",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              animation: "slideIn 200ms ease-out",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: 18, margin: 0 }}>Activity & Problem Log</h2>
              <button
                onClick={() => setIsActivityOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                  color: "var(--color-text-secondary)",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              <ActivityPanel activities={jo.activities} />
            </div>
          </div>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}

      {/* Add Data Dialog */}
      {addDataCat && (
        <AddDataDialog
          open={!!addDataCatId}
          onClose={() => setAddDataCatId(null)}
          projectId={project ? project.id : projectId}
          joId={jo ? jo.id : joId}
          categoryId={addDataCat.id}
          categoryKind={addDataCat.kind}
          categoryLabel={addDataCat.label}
        />
      )}

      {/* Category Create Dialog */}
      <CategoryCreateDialog
        open={categoryCreateOpen}
        onClose={() => setCategoryCreateOpen(false)}
        projectId={projectId}
        joId={joId}
      />

      {/* Category Edit Dialog */}
      {editingCategory && (
        <CategoryEditDialog
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          projectId={project ? project.id : projectId}
          joId={jo ? jo.id : joId}
          category={editingCategory}
        />
      )}

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (!deletingCategory) return;
          dispatch({
            type: "DELETE_CATEGORY",
            projectId: project ? project.id : projectId,
            joId: jo ? jo.id : joId,
            categoryId: deletingCategory.id,
          });
          setDeletingCategory(null);
        }}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.label}"? Semua ${deletingCategory?.items.length ?? 0} item di dalamnya akan ikut terhapus.`}
        confirmText="Hapus Kategori"
        destructive
      />

      {/* Finish Confirmation Dialog */}
      <Dialog
        open={finishConfirmOpen}
        onClose={() => setFinishConfirmOpen(false)}
        title="Finish Job Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setFinishConfirmOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                dispatch({ type: "FINISH_JO", projectId, joId });
                setFinishConfirmOpen(false);
              }}
            >
              Confirm
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
          Are you sure you want to finish JO {jo.joNumber}? This will set the finish date to today.
        </p>
      </Dialog>

      {/* Floating Bulk Action Bar (Controller only) */}
      {isController && selectedItemIds.length > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-action-bar-count">
            <span className="bulk-action-bar-badge">{selectedItemIds.length}</span>
            <span className="bulk-action-bar-label">Part Terpilih</span>
          </div>

          <div className="bulk-action-bar-divider" />

          <div className="bulk-action-bar-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-sm bulk-action-btn"
              onClick={handleOpenBulkPoModal}
            >
              Kirim PO
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm bulk-action-btn"
              onClick={() => setActiveBulkModal("status")}
            >
              Ubah Status
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm bulk-action-btn"
              onClick={handleOpenBulkSubcontModal}
            >
              Kirim Subcont
            </button>

            <button
              type="button"
              className="btn btn-sm bulk-action-btn"
              onClick={() => setBatchDeleteOpen(true)}
              style={{
                background: "var(--color-status-problem)",
                color: "#fff",
                borderColor: "var(--color-status-problem)",
              }}
            >
              Hapus ({selectedItemIds.length})
            </button>
          </div>

          <button
            type="button"
            className="bulk-action-bar-cancel"
            onClick={() => {
              setSelectedItemIds([]);
              setActiveBulkModal(null);
            }}
            title="Batal pilih semua"
          >
            ✕ Batal
          </button>
        </div>
      )}

      {/* Kirim PO Dialog (Bulk & Single Item) */}
      <Dialog
        open={activeBulkModal === "po" || singlePoItem !== null}
        onClose={() => {
          setActiveBulkModal(null);
          setSinglePoItem(null);
        }}
        title={
          singlePoItem
            ? `Kirim PO — ${singlePoItem.item.description} (${poTrackingLabel(singlePoItem.process)})`
            : alreadySentPoItems.length > 0
              ? `Kirim PO (Bulk — ${eligiblePoItems.length} dari ${selectedItemIds.length} Part Terpilih)`
              : `Kirim PO (Bulk — ${selectedItemIds.length} Part Terpilih)`
        }
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setActiveBulkModal(null);
                setSinglePoItem(null);
              }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              disabled={
                singlePoItem
                  ? isItemPoSent(singlePoItem.item, singlePoItem.process === "PO" ? "Component" : "Part")
                  : eligiblePoItems.length === 0
              }
              onClick={() => {
                if (singlePoItem) {
                  if (isItemPoSent(singlePoItem.item, singlePoItem.process === "PO" ? "Component" : "Part")) {
                    return;
                  }
                  dispatch({
                    type: "BULK_SEND_PO",
                    projectId,
                    joId,
                    itemIds: [singlePoItem.item.id],
                    supplier: poSupplier,
                    poNo: poNo,
                    poDate: poDate,
                    targetArrival: poTargetArrival,
                    notes: poNotes,
                  });
                  setSinglePoItem(null);
                } else if (activeBulkModal === "po") {
                  if (eligiblePoItems.length === 0) return;
                  dispatch({
                    type: "BULK_SEND_PO",
                    projectId,
                    joId,
                    itemIds: eligiblePoItems.map((p: { item: Item; categoryKind: string }) => p.item.id),
                    supplier: poSupplier,
                    poNo: poNo,
                    poDate: poDate,
                    targetArrival: poTargetArrival,
                    notes: poNotes,
                  });
                  setActiveBulkModal(null);
                  setSelectedItemIds([]);
                }
              }}
            >
              {singlePoItem
                ? isItemPoSent(singlePoItem.item, singlePoItem.process === "PO" ? "Component" : "Part")
                  ? "Sudah Dikirim PO"
                  : "Simpan & Kirim PO"
                : eligiblePoItems.length === 0
                  ? "Semua Part Sudah Dikirim PO"
                  : `Kirim PO (${eligiblePoItems.length} Part)`}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {singlePoItem && isItemPoSent(singlePoItem.item, singlePoItem.process === "PO" ? "Component" : "Part") && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-wash)",
                border: "1px solid var(--color-border)",
                fontSize: 12,
                color: "var(--color-status-problem)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Part ini sudah pernah dikirim PO dan tidak dapat dikirim ulang.</span>
            </div>
          )}

          {!singlePoItem && alreadySentPoItems.length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-wash)",
                border: "1px solid var(--color-border)",
                fontSize: 12,
                color: "var(--color-text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--color-text)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{alreadySentPoItems.length} part dilewati karena sudah pernah dikirim PO</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Part yang dilewati: {alreadySentPoItems.map((p: { item: Item; categoryKind: string }) => `No. ${p.item.no} (${p.item.description})`).join(", ")}
              </div>
            </div>
          )}
          <div>
            <label className="label">No. PO</label>
            <input
              type="text"
              className="input"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Tanggal PO</label>
            <input
              type="date"
              className="input"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Pilih Supplier / Vendor</label>
            <select
              className="select"
              value={poSupplier}
              onChange={(e) => setPoSupplier(e.target.value)}
            >
              <option value="">— Pilih Supplier —</option>
              {PO_SUPPLIERS.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Estimasi Target Kedatangan (Target Arrival)</label>
            <input
              type="date"
              className="input"
              value={poTargetArrival}
              onChange={(e) => setPoTargetArrival(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Catatan (Notes)</label>
            <textarea
              className="input"
              rows={2}
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
            />
          </div>
        </div>
      </Dialog>

      {/* Bulk Status Dialog */}
      <Dialog
        open={activeBulkModal === "status"}
        onClose={() => setActiveBulkModal(null)}
        title="Ubah Status Proses (Bulk)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveBulkModal(null)}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              disabled={bulkStatusProcesses.length === 0 || (bulkStatusValue === "Problem" && !bulkStatusNotes.trim())}
              onClick={() => {
                dispatch({
                  type: "BULK_UPDATE_STATUS",
                  projectId,
                  joId,
                  itemIds: selectedItemIds,
                  processes: bulkStatusProcesses,
                  status: bulkStatusValue,
                  notes: bulkStatusNotes,
                });
                if (
                  bulkArrivalDate &&
                  bulkStatusProcesses.some((p) => p === "Material" || p === "Arrival" || p === "PO")
                ) {
                  dispatch({
                    type: "BULK_UPDATE_TARGET_ARRIVAL",
                    projectId,
                    joId,
                    itemIds: selectedItemIds,
                    targetDate: bulkArrivalDate,
                  });
                }
                setActiveBulkModal(null);
                setSelectedItemIds([]);
              }}
            >
              Simpan
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="label" style={{ margin: 0 }}>
                Pilih Proses{" "}
                <span style={{ fontWeight: "normal", color: "var(--color-text-muted)" }}>
                  ({bulkStatusProcesses.length} dipilih)
                </span>
              </label>
              <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer", padding: 0, fontWeight: 500 }}
                  onClick={() => setBulkStatusProcesses(BULK_PROCESS_OPTIONS.map((p) => p.value))}
                >
                  Pilih Semua
                </button>
                <span style={{ color: "var(--color-border)" }}>•</span>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: 0 }}
                  onClick={() => setBulkStatusProcesses([])}
                >
                  Reset
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 6,
                padding: 1,
              }}
            >
              {BULK_PROCESS_OPTIONS.map((proc) => {
                const isChecked = bulkStatusProcesses.includes(proc.value);
                return (
                  <label
                    key={proc.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: "var(--radius-md)",
                      border: isChecked ? "1px solid var(--color-text)" : "1px solid var(--color-border)",
                      background: isChecked
                        ? "color-mix(in srgb, var(--color-text) 5%, var(--color-bg-raised))"
                        : "var(--color-bg-raised)",
                      cursor: "pointer",
                      fontSize: 12,
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setBulkStatusProcesses(bulkStatusProcesses.filter((p) => p !== proc.value));
                        } else {
                          setBulkStatusProcesses([...bulkStatusProcesses, proc.value]);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{proc.label}</span>
                  </label>
                );
              })}
            </div>
            {bulkStatusProcesses.length === 0 && (
              <p style={{ fontSize: 11, color: "var(--color-status-problem)", marginTop: 4 }}>
                Pilih minimal satu proses untuk diubah statusnya.
              </p>
            )}
          </div>

          <div>
            <label className="label">Status Baru</label>
            <select
              className="select"
              value={bulkStatusValue}
              onChange={(e) => setBulkStatusValue(e.target.value as ControlStatus)}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Problem">Problem</option>
            </select>
          </div>

          {bulkStatusProcesses.some((p) => p === "Material" || p === "Arrival" || p === "PO") && (
            <div>
              <label className="label">Target Arrival </label>
              <input
                type="date"
                className="input"
                value={bulkArrivalDate}
                onChange={(e) => setBulkArrivalDate(e.target.value)}
              />
            </div>
          )}

          {bulkStatusValue === "Problem" && (
            <div>
              <label className="label">Catatan Masalah</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Jelaskan masalahnya..."
                value={bulkStatusNotes}
                onChange={(e) => setBulkStatusNotes(e.target.value)}
              />
            </div>
          )}
        </div>
      </Dialog>

      {/* Subcont Dialog (Bulk & Single Item) */}
      <Dialog
        open={activeBulkModal === "subcont" || singleSubcontItem !== null}
        onClose={() => {
          setActiveBulkModal(null);
          setSingleSubcontItem(null);
        }}
        title={
          singleSubcontItem
            ? `Kirim ke Subcont — ${singleSubcontItem.item.description} (${singleSubcontItem.process})`
            : alreadySentSubcontItems.length > 0
              ? `Kirim ke Subcont (Bulk — ${eligibleSubcontItems.length} dari ${selectedItemIds.length} Part Terpilih)`
              : `Kirim ke Subcont (Bulk — ${selectedItemIds.length} Part Terpilih)`
        }
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setActiveBulkModal(null);
                setSingleSubcontItem(null);
              }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              disabled={
                !bulkSubcontSupplier ||
                (singleSubcontItem
                  ? isItemSubcontSent(singleSubcontItem.item, singleSubcontItem.process)
                  : eligibleSubcontItems.length === 0)
              }
              onClick={() => {
                if (singleSubcontItem) {
                  if (isItemSubcontSent(singleSubcontItem.item, singleSubcontItem.process)) {
                    return;
                  }
                  dispatch({
                    type: "BULK_SEND_SUBCONT",
                    projectId,
                    joId,
                    itemIds: [singleSubcontItem.item.id],
                    process: bulkSubcontProcess,
                    supplier: bulkSubcontSupplier,
                    arrivalTargetDate: bulkSubcontArrivalDate,
                  });
                  setSingleSubcontItem(null);
                } else if (activeBulkModal === "subcont") {
                  if (eligibleSubcontItems.length === 0) return;
                  dispatch({
                    type: "BULK_SEND_SUBCONT",
                    projectId,
                    joId,
                    itemIds: eligibleSubcontItems.map((p: Item) => p.id),
                    process: bulkSubcontProcess,
                    supplier: bulkSubcontSupplier,
                    arrivalTargetDate: bulkSubcontArrivalDate,
                  });
                  setActiveBulkModal(null);
                  setSelectedItemIds([]);
                }
              }}
            >
              {singleSubcontItem
                ? isItemSubcontSent(singleSubcontItem.item, singleSubcontItem.process)
                  ? "Sudah Aktif di Subcont"
                  : "Simpan & Kirim ke Subcont"
                : eligibleSubcontItems.length === 0
                  ? "Semua Part Sudah di Subcont"
                  : `Kirim ke Subcont (${eligibleSubcontItems.length} Part)`}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {singleSubcontItem && isItemSubcontSent(singleSubcontItem.item, singleSubcontItem.process) && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-wash)",
                border: "1px solid var(--color-border)",
                fontSize: 12,
                color: "var(--color-status-problem)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Part ini sudah aktif di Subcont dan tidak dapat dikirim ulang.</span>
            </div>
          )}

          {!singleSubcontItem && alreadySentSubcontItems.length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-wash)",
                border: "1px solid var(--color-border)",
                fontSize: 12,
                color: "var(--color-text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--color-text)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{alreadySentSubcontItems.length} part dilewati karena sudah aktif di Subcont</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Part yang dilewati: {alreadySentSubcontItems.map((p: Item) => `No. ${p.no} (${p.description})`).join(", ")}
              </div>
            </div>
          )}
          <div>
            <label className="label">Proses Subcont</label>
            {singleSubcontItem ? (
              <input
                type="text"
                className="input"
                value={bulkSubcontProcess}
                disabled
                style={{ opacity: 0.85, cursor: "not-allowed", backgroundColor: "var(--color-bg-muted)" }}
              />
            ) : (
              <select
                className="select"
                value={bulkSubcontProcess}
                onChange={(e) => setBulkSubcontProcess(e.target.value)}
              >
                <option value="Machining">Machining</option>
                <option value="Hardening">Hardening</option>
                <option value="Wirecut">Wirecut</option>
              </select>
            )}
          </div>

          <div>
            <label className="label">
              Pilih Supplier / Vendor <span style={{ color: "var(--color-status-problem)" }}>*</span>
            </label>
            <select
              className="select"
              value={bulkSubcontSupplier}
              onChange={(e) => setBulkSubcontSupplier(e.target.value)}
              autoFocus
            >
              <option value="">— Pilih Supplier —</option>
              {bulkSubcontSupplier && !(SUBCONT_SUPPLIERS as readonly string[]).includes(bulkSubcontSupplier) && (
                <option value={bulkSubcontSupplier}>{bulkSubcontSupplier}</option>
              )}
              {SUBCONT_SUPPLIERS.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Target Kembali (Arrival)</label>
            <input
              type="date"
              className="input"
              value={bulkSubcontArrivalDate}
              onChange={(e) => setBulkSubcontArrivalDate(e.target.value)}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete JO Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (jo && project) {
            dispatch({
              type: "DELETE_JO",
              projectId: project.id,
              joId: jo.id,
            });
            setDeleteConfirmOpen(false);
            router.push("/");
          }
        }}
        title="Hapus Job Order"
        message={
          jo ? (
            <span>
              Hapus JO <strong>{jo.joNumber}</strong> ({jo.product})?
            </span>
          ) : null
        }
        confirmText="Hapus"
      />

      {/* Edit Item Dialog */}
      {editingItem && (
        <ItemEditDialog
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          projectId={projectId}
          joId={joId}
          categoryId={editingItem.categoryId}
          item={editingItem.item}
        />
      )}

      {/* Single Item Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) {
            dispatch({
              type: "DELETE_ITEM",
              projectId,
              joId,
              categoryId: deletingItem.categoryId,
              itemId: deletingItem.item.id,
            });
            setSelectedItemIds((prev) => prev.filter((id) => id !== deletingItem.item.id));
            setDeletingItem(null);
          }
        }}
        title="Hapus Part / Component"
        message={
          deletingItem ? (
            <span>
              Apakah Anda yakin ingin menghapus part <strong>{deletingItem.item.description}</strong>? Seluruh data proses dan kontrol part ini akan dihapus.
            </span>
          ) : null
        }
        confirmText="Hapus Part"
        cancelText="Batal"
        destructive={true}
      />

      {/* Bulk Delete Items Confirmation Dialog */}
      <ConfirmDialog
        open={batchDeleteOpen}
        onClose={() => setBatchDeleteOpen(false)}
        onConfirm={() => {
          dispatch({
            type: "BATCH_DELETE_ITEMS",
            projectId,
            joId,
            itemIds: selectedItemIds,
          });
          setSelectedItemIds([]);
          setBatchDeleteOpen(false);
        }}
        title="Hapus Part Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedItemIds.length} part terpilih? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={`Hapus ${selectedItemIds.length} Part`}
        cancelText="Batal"
        destructive={true}
      />
    </AppShell>
  );
}
