"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import { AddDataDialog } from "./add-data-dialog";
import { useAppState } from "@/lib/store";

interface NewDataDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewDataDialog({ open, onClose }: NewDataDialogProps) {
  const { projects } = useAppState();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedJoId, setSelectedJoId] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedJo = selectedProject?.jos.find((j) => j.id === selectedJoId);
  const selectedCat = selectedJo?.categories.find((c) => c.id === selectedCatId);

  const reset = useCallback(() => {
    setSelectedProjectId("");
    setSelectedJoId("");
    setSelectedCatId("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  if (selectedProjectId && selectedJoId && selectedCatId && selectedCat) {
    return (
      <AddDataDialog
        open={open}
        onClose={handleClose}
        projectId={selectedProjectId}
        joId={selectedJoId}
        categoryId={selectedCatId}
        categoryLabel={`${selectedProject?.name} › JO ${selectedJo?.joNumber} › ${selectedCat.label}`}
        categoryKind={selectedCat.kind}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="New Data"
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                    {p.company && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "var(--radius-sm)",
                          background: p.company === "BMI" ? "var(--color-status-done-bg)" : "var(--color-status-not-started-bg)",
                          color: p.company === "BMI" ? "var(--color-status-done)" : "var(--color-status-not-started)",
                          border: `1px solid ${p.company === "BMI" ? "rgba(13, 124, 74, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {p.company}
                      </span>
                    )}
                  </div>
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
    </Dialog>
  );
}
