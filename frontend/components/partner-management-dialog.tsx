"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog } from "./dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { api } from "@/lib/api-client";
import type { Partner, PartnerType, PartnerStatus } from "@/lib/types";

interface PartnerManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onPartnersChanged?: () => void;
}

const TABS: { id: PartnerType; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "supplier_po", label: "Supp PO" },
  { id: "supplier_subcont", label: "Supp SC" },
];

export function PartnerManagementDialog({
  open,
  onClose,
  onPartnersChanged,
}: PartnerManagementDialogProps) {
  const [activeTab, setActiveTab] = useState<PartnerType>("customer");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Add state
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load partners when dialog opens
  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPartners();
      setPartners(data);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data mitra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadPartners();
      setSearchQuery("");
      setNewName("");
      setEditingId(null);
      setError(null);
    }
  }, [open, loadPartners]);

  // Filtered partners by activeTab and optional search
  const tabPartners = useMemo(() => {
    return partners.filter((p) => p.type === activeTab);
  }, [partners, activeTab]);

  const displayPartners = useMemo(() => {
    if (!searchQuery.trim()) return tabPartners;
    const q = searchQuery.toLowerCase().trim();
    return tabPartners.filter((p) => p.name.toLowerCase().includes(q));
  }, [tabPartners, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      customer: partners.filter((p) => p.type === "customer").length,
      supplier_po: partners.filter((p) => p.type === "supplier_po").length,
      supplier_subcont: partners.filter((p) => p.type === "supplier_subcont").length,
    };
  }, [partners]);

  // Handle Add Partner (Inline Option 1)
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.createPartner({
        name: trimmed,
        type: activeTab,
        status: "active",
      });
      setPartners((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      onPartnersChanged?.();
    } catch (err: any) {
      setError(err?.message || "Gagal menambahkan data baru");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status (Active <-> Discontinued)
  const handleToggleStatus = async (partner: Partner) => {
    const nextStatus: PartnerStatus = partner.status === "active" ? "discontinued" : "active";

    // Optimistic update
    setPartners((prev) =>
      prev.map((p) => (p.id === partner.id ? { ...p, status: nextStatus } : p))
    );

    try {
      await api.updatePartner(partner.id, { status: nextStatus });
      onPartnersChanged?.();
    } catch (err: any) {
      // Revert optimistic update on failure
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, status: partner.status } : p))
      );
      setError(err?.message || "Gagal mengubah status mitra");
    }
  };

  // Handle Edit Name
  const startEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setEditName(partner.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (partner: Partner) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === partner.name) {
      cancelEdit();
      return;
    }

    setIsSavingEdit(true);
    setError(null);
    try {
      const res = await api.updatePartner(partner.id, { name: trimmed });
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? res.data : p)).sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
      onPartnersChanged?.();
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan perubahan nama");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!deletingPartner || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.deletePartner(deletingPartner.id);
      setPartners((prev) => prev.filter((p) => p.id !== deletingPartner.id));
      setDeletingPartner(null);
      onPartnersChanged?.();
    } catch (err: any) {
      setError(err?.message || "Gagal menghapus mitra");
    } finally {
      setIsDeleting(false);
    }
  };

  const placeholderText =
    activeTab === "customer"
      ? "Ketik nama customer baru..."
      : activeTab === "supplier_po"
      ? "Ketik nama supplier PO baru..."
      : "Ketik nama supplier subcont baru...";

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Customer & Supplier"
        maxWidth={640}
        panelStyle={{ width: "min(640px, 94vw)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: 6,
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setEditingId(null);
                    setNewName("");
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                    backgroundColor: isActive ? "var(--color-bg-raised)" : "transparent",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 120ms ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 5px",
                      borderRadius: 10,
                      background: isActive ? "var(--color-bg)" : "var(--color-border-subtle)",
                      color: "var(--color-text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-status-problem)",
                background: "var(--color-status-problem-bg)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
              }}
            >
              {error}
            </div>
          )}

          {/* Option 1: Inline Add Bar */}
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={placeholderText}
              disabled={isSubmitting}
              className="input-search"
              style={{
                flex: 1,
                fontSize: 12.5,
                padding: "7px 10px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
            <button
              type="submit"
              disabled={!newName.trim() || isSubmitting}
              className="btn btn-primary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "0 12px",
                height: 34,
                cursor: !newName.trim() || isSubmitting ? "not-allowed" : "pointer",
                opacity: !newName.trim() || isSubmitting ? 0.6 : 1,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Add</span>
            </button>
          </form>

          {/* Quick Filter Search if list has more than 5 items */}
          {tabPartners.length > 5 && (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama mitra..."
                style={{
                  width: "100%",
                  fontSize: 11.5,
                  padding: "5px 8px 5px 28px",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg-secondary, transparent)",
                  color: "var(--color-text)",
                }}
              />
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          )}

          {/* Table Container */}
          <div
            style={{
              maxHeight: 380,
              overflowY: "auto",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-bg-secondary, var(--color-bg-raised))",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "8px 10px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    Nama
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      width: 120,
                      textAlign: "center",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      width: 80,
                      textAlign: "center",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)" }}>
                      Memuat data mitra...
                    </td>
                  </tr>
                ) : displayPartners.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)" }}>
                      {searchQuery.trim()
                        ? "Tidak ada mitra yang cocok dengan pencarian."
                        : "Belum ada mitra pada kategori ini."}
                    </td>
                  </tr>
                ) : (
                  displayPartners.map((partner) => {
                    const isEditing = editingId === partner.id;

                    return (
                      <tr
                        key={partner.id}
                        style={{
                          borderBottom: "1px solid var(--color-border-subtle)",
                          transition: "background 80ms ease",
                        }}
                      >
                        {/* Nama Kolom */}
                        <td style={{ padding: "8px 10px" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(partner);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                disabled={isSavingEdit}
                                autoFocus
                                style={{
                                  fontSize: 12,
                                  padding: "4px 6px",
                                  border: "1px solid var(--color-accent)",
                                  borderRadius: "var(--radius-sm)",
                                  background: "var(--color-bg)",
                                  color: "var(--color-text)",
                                  flex: 1,
                                }}
                              />
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => saveEdit(partner)}
                                disabled={isSavingEdit}
                                title="Simpan"
                                style={{
                                  width: 24,
                                  height: 24,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "var(--radius-sm)",
                                  background: "transparent",
                                  border: "1px solid var(--color-border-subtle)",
                                  color: "var(--color-status-done)",
                                  cursor: "pointer",
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={cancelEdit}
                                disabled={isSavingEdit}
                                title="Batal"
                                style={{
                                  width: 24,
                                  height: 24,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "var(--radius-sm)",
                                  background: "transparent",
                                  border: "1px solid var(--color-border-subtle)",
                                  color: "var(--color-text-muted)",
                                  cursor: "pointer",
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
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{partner.name}</span>
                          )}
                        </td>

                        {/* Status Kolom */}
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <span
                            onClick={() => handleToggleStatus(partner)}
                            title={
                              partner.status === "active"
                                ? "Klik untuk ganti status ke Discontinued"
                                : "Klik untuk ganti status ke Active"
                            }
                            style={{
                              display: "inline-block",
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              userSelect: "none",
                              transition: "all 120ms ease",
                              background:
                                partner.status === "active"
                                  ? "var(--color-status-done-bg)"
                                  : "var(--color-status-na-bg, rgba(150, 150, 150, 0.15))",
                              color:
                                partner.status === "active"
                                  ? "var(--color-status-done)"
                                  : "var(--color-text-muted)",
                              border:
                                partner.status === "active"
                                  ? "1px solid rgba(13, 124, 74, 0.25)"
                                  : "1px solid var(--color-border-subtle)",
                            }}
                          >
                            {partner.status === "active" ? "Active" : "Discontinued"}
                          </span>
                        </td>

                        {/* Action Kolom */}
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => startEdit(partner)}
                              title="Edit Nama"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 24,
                                height: 24,
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
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => setDeletingPartner(partner)}
                              title="Hapus Mitra"
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
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingPartner && (
        <ConfirmDialog
          open={Boolean(deletingPartner)}
          onClose={() => setDeletingPartner(null)}
          onConfirm={confirmDelete}
          title="Hapus Data Mitra"
          message={
            <span>
              Apakah Anda yakin ingin menghapus <strong>{deletingPartner.name}</strong> dari daftar{" "}
              {deletingPartner.type === "customer"
                ? "Customer"
                : deletingPartner.type === "supplier_po"
                ? "Supplier PO"
                : "Supplier Subcont"}
              ?
            </span>
          }
          confirmText="Hapus"
          cancelText="Batal"
          destructive
          loading={isDeleting}
        />
      )}
    </>
  );
}
