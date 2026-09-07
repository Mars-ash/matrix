"use client";
import React, { useState, useCallback, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ControlTable } from "@/components/control-table";
import { ActivityPanel } from "@/components/activity-panel";
import { AddDataDialog } from "@/components/add-data-dialog";
import { CategoryCreateDialog } from "@/components/category-create-dialog";
import { JoItemSearch } from "@/components/jo-item-search";
import { Dialog } from "@/components/dialog";
import { useAppState, useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { joProgress, joProblemCount, categoryProgress } from "@/lib/progress";
import { formatProgress } from "@/lib/format";
import { SUBCONT_SUPPLIERS, type ControlStatus, type Item } from "@/lib/types";
import { poTrackingLabel } from "@/lib/po-tracking";

interface PageProps {
  params: Promise<{ projectId: string; joId: string }>;
}

const BULK_PROCESS_OPTIONS = [
  { value: "Material", label: "PO Mtl" },
  { value: "Arrival", label: "Arrival" },
  { value: "Machining", label: "Machining" },
  { value: "Hardening", label: "Hardening" },
  { value: "Grinding", label: "Grinding" },
  { value: "Wirecut", label: "Wirecut" },
  { value: "Assembly", label: "Assembly" },
];

export default function JoDetailPage({ params }: PageProps) {
  const { projectId, joId } = use(params);
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const [addDataCatId, setAddDataCatId] = useState<string | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

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

  const project = projects.find((p) => p.id === projectId)
    || projects.find((p) => p.jos.some((j) => j.id === joId || j.joNumber === joId))
    || projects[0];
  const jo = project?.jos.find((j) => j.id === joId || j.joNumber === joId)
    || project?.jos[0];

  const progress = jo ? joProgress(jo) : null;
  const problems = jo ? joProblemCount(jo) : 0;
  const addDataCat = jo ? jo.categories.find((c) => c.id === addDataCatId) : null;

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

  // Handle direct item jump from URL or notification link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetItemId = urlParams.get("item") || window.location.hash.replace("#item-", "").replace("#", "");
    if (targetItemId) {
      setHighlightedItemId(targetItemId);
      setTimeout(() => {
        const el = document.getElementById(`item-${targetItemId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  }, []);

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

  if (!project || !jo) {
    return (
      <AppShell breadcrumbs={[{ label: "Job Order" }]}>
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
          <p>Loading Job Order...</p>
        </div>
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
          <section key={cat.id} id={`cat-${cat.id}`}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <h2 style={{ fontSize: 18 }}>{cat.label}</h2>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-text-muted)",
                    fontWeight: 500,
                  }}
                >
                  {cat.kind} · {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}
                  {cat.isCustom && " · Custom"}
                </span>
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
          projectId={projectId}
          joId={joId}
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
              onClick={() => setActiveBulkModal("subcont")}
            >
              Kirim Subcont
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
              onClick={() => {
                if (singlePoItem) {
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
                  dispatch({
                    type: "BULK_SEND_PO",
                    projectId,
                    joId,
                    itemIds: selectedItemIds,
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
              {singlePoItem ? "Simpan & Kirim PO" : `Kirim PO (${selectedItemIds.length} Part)`}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            <input
              type="text"
              className="input"
              list="po-supplier-options"
              placeholder="Pilih atau ketik nama supplier..."
              value={poSupplier}
              onChange={(e) => setPoSupplier(e.target.value)}
            />
            <datalist id="po-supplier-options">
              {SUBCONT_SUPPLIERS.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
              <option value="PT Baja Makmur">PT Baja Makmur</option>
              <option value="MISUMI">MISUMI</option>
              <option value="FUTABA">FUTABA</option>
            </datalist>
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
              disabled={bulkStatusProcesses.length === 0}
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

      {/* Bulk Subcont Dialog */}
      <Dialog
        open={activeBulkModal === "subcont"}
        onClose={() => setActiveBulkModal(null)}
        title="Kirim ke Subcont (Bulk Dispatch)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveBulkModal(null)}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                dispatch({
                  type: "BULK_SEND_SUBCONT",
                  projectId,
                  joId,
                  itemIds: selectedItemIds,
                  process: bulkSubcontProcess,
                  supplier: bulkSubcontSupplier,
                  arrivalTargetDate: bulkSubcontArrivalDate,
                });
                setActiveBulkModal(null);
                setSelectedItemIds([]);
              }}
            >
              Kirim ke Subcont ({selectedItemIds.length} Part)
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="label">Proses Subcont</label>
            <select
              className="select"
              value={bulkSubcontProcess}
              onChange={(e) => setBulkSubcontProcess(e.target.value)}
            >
              <option value="Machining">Machining</option>
              <option value="Hardening">Hardening</option>
              <option value="Wirecut">Wirecut</option>
            </select>
          </div>

          <div>
            <label className="label">Pilih Supplier / Vendor</label>
            <select
              className="select"
              value={bulkSubcontSupplier}
              onChange={(e) => setBulkSubcontSupplier(e.target.value)}
            >
              <option value="">— Pilih Supplier —</option>
              {SUBCONT_SUPPLIERS.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Estimasi Target Kembali (Arrival)</label>
            <input
              type="date"
              className="input"
              value={bulkSubcontArrivalDate}
              onChange={(e) => setBulkSubcontArrivalDate(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
