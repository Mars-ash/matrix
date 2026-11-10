"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "@/components/dialog";
import { useAppDispatch } from "@/lib/store";
import {
  SUBCONT_SUPPLIERS,
  PO_SUPPLIERS,
  type ControlStatus,
  type Item,
} from "@/lib/types";
import { poTrackingLabel, isItemPoSent } from "@/lib/po-tracking";
import { isItemSubcontSent } from "@/lib/subcont-tracking";

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

export interface JoPoDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
  singlePoItem: {
    categoryId: string;
    item: Item;
    process: "Material" | "PO";
  } | null;
  selectedPoItems: { item: Item; categoryKind: string }[];
  onSuccess: () => void;
}

export function JoPoDialog({
  open,
  onClose,
  projectId,
  joId,
  singlePoItem,
  selectedPoItems,
  onSuccess,
}: JoPoDialogProps) {
  const dispatch = useAppDispatch();
  const [poSupplier, setPoSupplier] = useState("");
  const [poNo, setPoNo] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poTargetArrival, setPoTargetArrival] = useState("");
  const [poNotes, setPoNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (singlePoItem) {
      const { item, process } = singlePoItem;
      const ctrl = item.controls.find((c) => c.process === process);
      const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
      setPoSupplier(ctrl?.poTracking?.supplier || "");
      setPoNo(ctrl?.poTracking?.poNo || "");
      setPoDate(ctrl?.poTracking?.poDate || new Date().toISOString().split("T")[0]);
      setPoTargetArrival(ctrl?.poTracking?.targetArrival || arrivalCtrl?.targetDate || "");
      setPoNotes(ctrl?.poTracking?.notes || "");
    } else {
      setPoSupplier("");
      setPoNo("");
      setPoDate(new Date().toISOString().split("T")[0]);
      setPoTargetArrival("");
      setPoNotes("");
    }
  }, [open, singlePoItem]);

  const eligiblePoItems = useMemo(() => {
    return selectedPoItems.filter(({ item, categoryKind }) => !isItemPoSent(item, categoryKind));
  }, [selectedPoItems]);

  const alreadySentPoItems = useMemo(() => {
    return selectedPoItems.filter(({ item, categoryKind }) => isItemPoSent(item, categoryKind));
  }, [selectedPoItems]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        singlePoItem
          ? `Kirim PO — ${singlePoItem.item.description} (${poTrackingLabel(singlePoItem.process)})`
          : alreadySentPoItems.length > 0
            ? `Kirim PO (Bulk — ${eligiblePoItems.length} dari ${selectedPoItems.length} Part Terpilih)`
            : `Kirim PO (Bulk — ${selectedPoItems.length} Part Terpilih)`
      }
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
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
                onClose();
                onSuccess();
              } else {
                if (eligiblePoItems.length === 0) return;
                dispatch({
                  type: "BULK_SEND_PO",
                  projectId,
                  joId,
                  itemIds: eligiblePoItems.map((p) => p.item.id),
                  supplier: poSupplier,
                  poNo: poNo,
                  poDate: poDate,
                  targetArrival: poTargetArrival,
                  notes: poNotes,
                });
                onClose();
                onSuccess();
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
              Part yang dilewati: {alreadySentPoItems.map((p) => `No. ${p.item.no} (${p.item.description})`).join(", ")}
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
  );
}

export interface JoBulkStatusDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
  selectedItemIds: string[];
  onSuccess: () => void;
}

export function JoBulkStatusDialog({
  open,
  onClose,
  projectId,
  joId,
  selectedItemIds,
  onSuccess,
}: JoBulkStatusDialogProps) {
  const dispatch = useAppDispatch();
  const [bulkStatusProcesses, setBulkStatusProcesses] = useState<string[]>(["Machining"]);
  const [bulkStatusValue, setBulkStatusValue] = useState<ControlStatus>("In Progress");
  const [bulkStatusNotes, setBulkStatusNotes] = useState("");
  const [bulkArrivalDate, setBulkArrivalDate] = useState("");

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ubah Status Proses (Bulk)"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
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
              onClose();
              onSuccess();
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
            <label className="label">Target Arrival</label>
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
  );
}

export interface JoSubcontDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  joId: string;
  singleSubcontItem: {
    categoryId: string;
    item: Item;
    process: string;
  } | null;
  selectedSubcontItems: Item[];
  onSuccess: () => void;
}

export function JoSubcontDialog({
  open,
  onClose,
  projectId,
  joId,
  singleSubcontItem,
  selectedSubcontItems,
  onSuccess,
}: JoSubcontDialogProps) {
  const dispatch = useAppDispatch();
  const [bulkSubcontProcess, setBulkSubcontProcess] = useState("Machining");
  const [bulkSubcontSupplier, setBulkSubcontSupplier] = useState("");
  const [bulkSubcontArrivalDate, setBulkSubcontArrivalDate] = useState("");

  useEffect(() => {
    if (!open) return;
    if (singleSubcontItem) {
      const { item, process } = singleSubcontItem;
      const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
      setBulkSubcontProcess(process || "Machining");
      setBulkSubcontSupplier(item.subcontSupplier || "");
      setBulkSubcontArrivalDate(item.arrivalTargetDate || arrivalCtrl?.targetDate || "");
    } else {
      setBulkSubcontProcess("Machining");
      setBulkSubcontSupplier("");
      setBulkSubcontArrivalDate("");
    }
  }, [open, singleSubcontItem]);

  const eligibleSubcontItems = useMemo(() => {
    return selectedSubcontItems.filter((item) => !isItemSubcontSent(item, bulkSubcontProcess));
  }, [selectedSubcontItems, bulkSubcontProcess]);

  const alreadySentSubcontItems = useMemo(() => {
    return selectedSubcontItems.filter((item) => isItemSubcontSent(item, bulkSubcontProcess));
  }, [selectedSubcontItems, bulkSubcontProcess]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        singleSubcontItem
          ? `Kirim ke Subcont — ${singleSubcontItem.item.description} (${singleSubcontItem.process})`
          : alreadySentSubcontItems.length > 0
            ? `Kirim ke Subcont (Bulk — ${eligibleSubcontItems.length} dari ${selectedSubcontItems.length} Part Terpilih)`
            : `Kirim ke Subcont (Bulk — ${selectedSubcontItems.length} Part Terpilih)`
      }
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
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
                onClose();
                onSuccess();
              } else {
                if (eligibleSubcontItems.length === 0) return;
                dispatch({
                  type: "BULK_SEND_SUBCONT",
                  projectId,
                  joId,
                  itemIds: eligibleSubcontItems.map((p) => p.id),
                  process: bulkSubcontProcess,
                  supplier: bulkSubcontSupplier,
                  arrivalTargetDate: bulkSubcontArrivalDate,
                });
                onClose();
                onSuccess();
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
              Part yang dilewati: {alreadySentSubcontItems.map((p) => `No. ${p.no} (${p.description})`).join(", ")}
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
  );
}

