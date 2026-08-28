"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import { ManualItemForm, emptyManualItemData, type ManualItemData } from "./manual-item-form";
import { useAppState, useAppDispatch } from "@/lib/store";

interface NewDataDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewDataDialog({ open, onClose }: NewDataDialogProps) {
  const { projects } = useAppState();
  const dispatch = useAppDispatch();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedJoId, setSelectedJoId] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [formData, setFormData] = useState<ManualItemData>(emptyManualItemData());
  const [error, setError] = useState("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedJo = selectedProject?.jos.find((j) => j.id === selectedJoId);
  const selectedCat = selectedJo?.categories.find((c) => c.id === selectedCatId);

  const reset = useCallback(() => {
    setSelectedProjectId("");
    setSelectedJoId("");
    setSelectedCatId("");
    setFormData(emptyManualItemData());
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSubmit = () => {
    if (!selectedCat) return;
    if (!formData.description.trim()) {
      setError("Description is required.");
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      projectId: selectedProjectId,
      joId: selectedJoId,
      categoryId: selectedCatId,
      item: {
        no: formData.no.trim() || "-",
        description: formData.description.trim(),
        dimension: formData.dimension.trim(),
        material: formData.material.trim(),
        qty: formData.qty || 1,
        hrc: formData.hrc.trim(),
        isSubcont: formData.isSubcont || undefined,
        subcontNotes: formData.isSubcont ? formData.subcontNotes.trim() : undefined,
      },
      kind: selectedCat.kind,
    });

    handleClose();
  };

  const showForm = !!(selectedProjectId && selectedJoId && selectedCatId && selectedCat);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="New Data"
      footer={
        showForm ? (
          <>
            <button className="btn btn-secondary" onClick={() => setSelectedCatId("")}>Back</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Add Item</button>
          </>
        ) : undefined
      }
    >
      {/* Step 1: Select Project */}
      {!selectedProjectId && (
        <div>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>Select Project</p>
          {projects.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", padding: 16 }}>
              No projects yet. Create a project first.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className="card"
                  onClick={() => setSelectedProjectId(p.id)}
                  style={{ textAlign: "left", cursor: "pointer", padding: "10px 14px", border: "1px solid var(--color-border)" }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{p.customer} · {p.jos.length} JO{p.jos.length !== 1 ? "s" : ""}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select JO */}
      {selectedProjectId && !selectedJoId && (
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProjectId("")} style={{ marginBottom: 8 }}>← Back</button>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
            Select JO in <strong>{selectedProject?.name}</strong>
          </p>
          {(!selectedProject || selectedProject.jos.length === 0) ? (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", padding: 16 }}>
              No JOs in this project.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedProject!.jos.map((jo) => (
                <button
                  key={jo.id}
                  className="card"
                  onClick={() => setSelectedJoId(jo.id)}
                  style={{ textAlign: "left", cursor: "pointer", padding: "10px 14px", border: "1px solid var(--color-border)" }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>JO {jo.joNumber}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{jo.product} · {jo.type} · {jo.categories.length} categories</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Category */}
      {selectedProjectId && selectedJoId && !selectedCatId && (
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJoId("")} style={{ marginBottom: 8 }}>← Back</button>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
            Select Category in <strong>JO {selectedJo?.joNumber}</strong>
          </p>
          {(!selectedJo || selectedJo.categories.length === 0) ? (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", padding: 16 }}>
              No categories in this JO.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedJo!.categories.map((cat) => (
                <button
                  key={cat.id}
                  className="card"
                  onClick={() => setSelectedCatId(cat.id)}
                  style={{ textAlign: "left", cursor: "pointer", padding: "10px 14px", border: "1px solid var(--color-border)" }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{cat.kind} · {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Manual item form */}
      {showForm && (
        <div>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 10 }}>
            Adding to <strong>{selectedProject?.name}</strong> → <strong>JO {selectedJo?.joNumber}</strong> → <strong>{selectedCat?.label}</strong>
          </p>
          <ManualItemForm
            data={formData}
            onChange={setFormData}
            error={error}
            onClearError={() => setError("")}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </Dialog>
  );
}
