"use client";

import React, { useState, useCallback, useEffect, useMemo, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { JoDetailSkeleton } from "@/components/skeleton-loader";
import { JoItemSearch } from "@/components/jo-item-search";
import { CategoryCreateDialog } from "@/components/category-create-dialog";
import { CategoryEditDialog } from "@/components/category-edit-dialog";
import { ItemEditDialog } from "@/components/item-edit-dialog";
import { AddDataDialog } from "@/components/add-data-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { JoDetailHeader } from "@/components/jo-detail/jo-detail-header";
import { JoActivityDrawer } from "@/components/jo-detail/jo-activity-drawer";
import { JoBulkActionBar } from "@/components/jo-detail/jo-bulk-action-bar";
import { JoCategorySection } from "@/components/jo-detail/jo-category-section";
import {
  JoPoDialog,
  JoBulkStatusDialog,
  JoSubcontDialog,
} from "@/components/jo-detail/jo-bulk-dialogs";

import { useAppState, useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { joProgress, joProblemCount, categoryProgress } from "@/lib/progress";
import { formatProgress } from "@/lib/format";
import type { Item, Category } from "@/lib/types";

interface PageProps {
  params: Promise<{ projectId: string; joId: string }>;
}

export default function JoDetailPage({ params }: PageProps) {
  const { projectId, joId } = use(params);
  const router = useRouter();
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();

  // Navigation & highlights
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [categorySortModes, setCategorySortModes] = useState<Record<string, "default" | "newest" | "oldest">>({});

  // Modals: JO level
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Modals: Category level
  const [addDataCatId, setAddDataCatId] = useState<string | null>(null);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Modals: Item level
  const [editingItem, setEditingItem] = useState<{ item: Item; categoryId: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ item: Item; categoryId: string } | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  // Modals: Bulk operations & Single trigger operations
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeBulkModal, setActiveBulkModal] = useState<"po" | "status" | "subcont" | null>(null);

  const [singlePoItem, setSinglePoItem] = useState<{
    categoryId: string;
    item: Item;
    process: "Material" | "PO";
  } | null>(null);

  const [singleSubcontItem, setSingleSubcontItem] = useState<{
    categoryId: string;
    item: Item;
    process: string;
  } | null>(null);

  // Project & JO resolution
  const project =
    projects.find((p) => p.id === projectId || (p as any).tempId === projectId) ||
    projects.find((p) => p.jos.some((j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId));
  const jo = project?.jos.find((j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId);

  const progress = jo ? joProgress(jo) : null;
  const problems = jo ? joProblemCount(jo) : 0;
  const addDataCat = jo ? jo.categories.find((c) => c.id === addDataCatId) : null;

  // Selected PO items for the PO modal
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

  // Selected Subcont items for the Subcont modal
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

  // Handle search result selection
  const handleSearchSelect = useCallback((categoryId: string, itemId: string) => {
    setHighlightedItemId(itemId);
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

  // URL jump parameter handling (?item=<id> or #item-<id>)
  useEffect(() => {
    if (typeof window === "undefined" || !jo) return;
    const searchParams = new URLSearchParams(window.location.search);
    const targetItemId = searchParams.get("item") || window.location.hash.replace("#item-", "").replace("#", "");
    if (!targetItemId) return;

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
  }, [jo?.id]);

  // Selection toggle callbacks
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

  const cycleCategorySortMode = useCallback((catId: string) => {
    setCategorySortModes((prev) => {
      const current = prev[catId] ?? "default";
      const next = current === "default" ? "newest" : current === "newest" ? "oldest" : "default";
      return { ...prev, [catId]: next };
    });
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
      {/* Header, Progress & Action Bar */}
      <JoDetailHeader
        project={project}
        jo={jo}
        projectId={projectId}
        joId={joId}
        progress={progress}
        problems={problems}
        isController={isController}
        onOpenActivities={() => setIsActivityOpen(true)}
        onFinishClick={() => setFinishConfirmOpen(true)}
        onDeleteClick={() => setDeleteConfirmOpen(true)}
      />

      {/* Search & Category Quick Jump Tabs */}
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

      {/* Category Sections with Control Tables */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
        {jo.categories.map((cat) => (
          <JoCategorySection
            key={cat.id}
            category={cat}
            projectId={projectId}
            joId={joId}
            isController={isController}
            sortMode={categorySortModes[cat.id] ?? "default"}
            onCycleSortMode={() => cycleCategorySortMode(cat.id)}
            onEditCategory={(category) => setEditingCategory(category)}
            onDeleteCategory={(category) => setDeletingCategory(category)}
            onAddData={(catId) => setAddDataCatId(catId)}
            highlightedItemId={highlightedItemId}
            selectedItemIds={selectedItemIds}
            onToggleSelectItem={handleToggleSelectItem}
            onToggleSelectAllCategory={handleToggleSelectAllCategory}
            onRequestSendPo={(payload) => setSinglePoItem(payload)}
            onRequestSendSubcont={(payload) => setSingleSubcontItem(payload)}
            onEditItem={(payload) => setEditingItem(payload)}
            onDeleteItem={(payload) => setDeletingItem(payload)}
          />
        ))}
      </div>

      {/* Add New Category Button (Controller only) */}
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

      {/* Slide-over Activity & Problem Log Drawer */}
      <JoActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={jo.activities}
      />

      {/* Floating Bulk Action Bar */}
      <JoBulkActionBar
        selectedCount={selectedItemIds.length}
        onKirimPo={() => setActiveBulkModal("po")}
        onUbahStatus={() => setActiveBulkModal("status")}
        onKirimSubcont={() => setActiveBulkModal("subcont")}
        onBatchDelete={() => setBatchDeleteOpen(true)}
        onCancel={() => setSelectedItemIds([])}
      />

      {/* Dialogs: PO, Subcont, Status */}
      <JoPoDialog
        open={activeBulkModal === "po" || singlePoItem !== null}
        onClose={() => {
          setActiveBulkModal(null);
          setSinglePoItem(null);
        }}
        projectId={projectId}
        joId={joId}
        singlePoItem={singlePoItem}
        selectedPoItems={selectedPoItems}
        onSuccess={() => setSelectedItemIds([])}
      />

      <JoBulkStatusDialog
        open={activeBulkModal === "status"}
        onClose={() => setActiveBulkModal(null)}
        projectId={projectId}
        joId={joId}
        selectedItemIds={selectedItemIds}
        onSuccess={() => setSelectedItemIds([])}
      />

      <JoSubcontDialog
        open={activeBulkModal === "subcont" || singleSubcontItem !== null}
        onClose={() => {
          setActiveBulkModal(null);
          setSingleSubcontItem(null);
        }}
        projectId={projectId}
        joId={joId}
        singleSubcontItem={singleSubcontItem}
        selectedSubcontItems={selectedSubcontItems}
        onSuccess={() => setSelectedItemIds([])}
      />

      {/* Confirm Finish JO Dialog */}
      <ConfirmDialog
        open={finishConfirmOpen}
        onClose={() => setFinishConfirmOpen(false)}
        onConfirm={() => {
          if (jo) {
            dispatch({
              type: "FINISH_JO",
              projectId: project.id,
              joId: jo.id,
            });
            setFinishConfirmOpen(false);
          }
        }}
        title="Selesaikan Job Order"
        message={
          jo ? (
            <span>
              Tandai JO <strong>{jo.joNumber}</strong> ({jo.product}) sebagai selesai?
            </span>
          ) : null
        }
        confirmText="Selesaikan"
      />

      {/* Confirm Delete JO Dialog */}
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
          projectId={projectId}
          joId={joId}
          category={editingCategory}
        />
      )}

      {/* Confirm Delete Category Dialog */}
      <ConfirmDialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) {
            dispatch({
              type: "DELETE_CATEGORY",
              projectId,
              joId,
              categoryId: deletingCategory.id,
            });
            setDeletingCategory(null);
          }
        }}
        title="Hapus Kategori"
        message={
          deletingCategory ? (
            <span>
              Apakah Anda yakin ingin menghapus kategori <strong>{deletingCategory.label}</strong> beserta seluruh part di dalamnya?
            </span>
          ) : null
        }
        confirmText="Hapus Kategori"
        cancelText="Batal"
        destructive={true}
      />

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
