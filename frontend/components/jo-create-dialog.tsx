"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import {
  JO_TYPES,
  PART_CATEGORIES,
  COMPONENT_CATEGORIES,
  type JoType,
  type CategoryKind,
} from "@/lib/types";
import { useAppDispatch, useAppState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { uid } from "@/lib/format";

interface JoCreateDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  onCreated?: (joId: string) => void;
}

interface SelectedCategory {
  label: string;
  kind: CategoryKind;
  isCustom: boolean;
}

export function JoCreateDialog({ open, onClose, projectId, onCreated }: JoCreateDialogProps) {
  const dispatch = useAppDispatch();
  const { projects } = useAppState();
  const router = useRouter();

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[0]?.id || "");
  const [joNumber, setJoNumber] = useState("");
  const [product, setProduct] = useState("");
  const [joType, setJoType] = useState<JoType | "">("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customKind, setCustomKind] = useState<CategoryKind>("Part");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const targetProjectId = projectId || selectedProjectId || projects[0]?.id || "";

  const reset = useCallback(() => {
    setJoNumber("");
    setProduct("");
    setJoType("");
    setTargetDate("");
    setSelectedKeys(new Set());
    setCustomEnabled(false);
    setCustomName("");
    setCustomKind("Part");
    setErrors({});
  }, []);

  const toggleCategory = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!targetProjectId) errs.project = "Project is required.";
    if (!joNumber.trim()) errs.joNumber = "JO number is required.";
    if (!product.trim()) errs.product = "Product name is required.";
    if (!joType) errs.joType = "Type is required.";
    if (customEnabled && !customName.trim()) errs.customName = "Custom category name is required.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const categories: SelectedCategory[] = [];

    for (const key of selectedKeys) {
      const isPart = (PART_CATEGORIES as readonly string[]).includes(key);
      categories.push({
        label: key,
        kind: isPart ? "Part" : "Component",
        isCustom: false,
      });
    }

    if (customEnabled && customName.trim()) {
      categories.push({
        label: customName.trim(),
        kind: customKind,
        isCustom: true,
      });
    }

    // Sort categories: Parts first, Components second.
    // Within each kind, standard categories follow their defined order,
    // and custom categories come last.
    categories.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "Part" ? -1 : 1;
      }
      
      if (a.isCustom && !b.isCustom) return 1;
      if (!a.isCustom && b.isCustom) return -1;
      if (a.isCustom && b.isCustom) return 0;
      
      const list = (a.kind === "Part" ? PART_CATEGORIES : COMPONENT_CATEGORIES) as readonly string[];
      const aIndex = list.indexOf(a.label);
      const bIndex = list.indexOf(b.label);
      return aIndex - bIndex;
    });

    const newJoId = uid();

    dispatch({
      type: "CREATE_JO",
      id: newJoId,
      projectId: targetProjectId,
      joNumber: joNumber.trim(),
      product: product.trim(),
      joType: joType as JoType,
      targetDate: targetDate || undefined,
      categories,
    });

    reset();
    onClose();
    
    // Redirect to the newly created JO details page
    router.push(`/projects/${targetProjectId}/jos/${newJoId}`);

  }, [targetProjectId, joNumber, product, joType, selectedKeys, customEnabled, customName, customKind, dispatch, onClose, reset, router]);

  return (
    <Dialog
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Create New JO"
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => { reset(); onClose(); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Create JO</button>
        </>
      }
    >
      <div 
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      >
        {/* Project Selector (if not fixed by props) */}
        {!projectId && projects.length > 0 && (
          <div>
            <label className="label">Project *</label>
            <select
              className="select"
              value={targetProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.customer})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* JO Number */}
        <div>
          <label className="label">JO Number *</label>
          <input
            className="input"
            value={joNumber}
            onChange={(e) => { setJoNumber(e.target.value); setErrors((p) => ({ ...p, joNumber: "" })); }}
          />
          {errors.joNumber && <p className="error-text">{errors.joNumber}</p>}
        </div>

        {/* Product */}
        <div>
          <label className="label">Product Name *</label>
          <input
            className="input"
            value={product}
            onChange={(e) => { setProduct(e.target.value); setErrors((p) => ({ ...p, product: "" })); }}
          />
          {errors.product && <p className="error-text">{errors.product}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="label">Type *</label>
          <select
            className="select"
            value={joType}
            onChange={(e) => { setJoType(e.target.value as JoType); setErrors((p) => ({ ...p, joType: "" })); }}
          >
            <option value="">Select type...</option>
            {JO_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.joType && <p className="error-text">{errors.joType}</p>}
        </div>

        {/* Target Date */}
        <div>
          <label className="label">Target Date</label>
          <input
            type="date"
            className="input"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div>

          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8 }}>Part</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {PART_CATEGORIES.map((key) => {
              const selected = selectedKeys.has(key);
              return (
                <button
                  key={key}
                  className="badge"
                  onClick={() => toggleCategory(key)}
                  style={{
                    cursor: "pointer",
                    background: selected ? "rgba(75, 131, 240, 0.2)" : "var(--color-bg-hover)",
                    color: selected ? "var(--color-accent)" : "var(--color-text-secondary)",
                    border: selected ? "1px solid var(--color-accent)" : "1px solid transparent",
                    padding: "4px 10px",
                    fontSize: 11,
                  }}
                >
                  {selected ? "✓ " : ""}{key}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8 }}>Component</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {COMPONENT_CATEGORIES.map((key) => {
              const selected = selectedKeys.has(key);
              return (
                <button
                  key={key}
                  className="badge"
                  onClick={() => toggleCategory(key)}
                  style={{
                    cursor: "pointer",
                    background: selected ? "rgba(75, 131, 240, 0.2)" : "var(--color-bg-hover)",
                    color: selected ? "var(--color-accent)" : "var(--color-text-secondary)",
                    border: selected ? "1px solid var(--color-accent)" : "1px solid transparent",
                    padding: "4px 10px",
                    fontSize: 11,
                  }}
                >
                  {selected ? "✓ " : ""}{key}
                </button>
              );
            })}
          </div>

          {/* Custom */}
          <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary)" }}>
              <input
                type="checkbox"
                checked={customEnabled}
                onChange={(e) => setCustomEnabled(e.target.checked)}
              />
              Add Custom Category
            </label>

            {customEnabled && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    placeholder="Category name"
                    value={customName}
                    onChange={(e) => { setCustomName(e.target.value); setErrors((p) => ({ ...p, customName: "" })); }}
                  />
                  {errors.customName && <p className="error-text">{errors.customName}</p>}
                </div>
                <select
                  className="select"
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value as CategoryKind)}
                  style={{ width: 120 }}
                >
                  <option value="Part">Part</option>
                  <option value="Component">Component</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
