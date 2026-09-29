"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "./dialog";
import { useAppDispatch } from "@/lib/store";
import type { Project } from "@/lib/types";

interface ProjectEditDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

export function ProjectEditDialog({ open, onClose, project }: ProjectEditDialogProps) {
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setError("");
    }
  }, [project, open]);

  const handleSubmit = useCallback(() => {
    if (!project) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama project wajib diisi.");
      return;
    }

    dispatch({
      type: "UPDATE_PROJECT",
      projectId: project.id,
      name: trimmed,
    });

    onClose();
  }, [project, name, dispatch, onClose]);

  if (!project) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit Project Name"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Simpan Perubahan
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div>
          <label className="label" htmlFor="edit-project-name-input" style={{ fontSize: 12, fontWeight: 600 }}>
            Nama Project *
          </label>
          <input
            id="edit-project-name-input"
            data-testid="edit-project-name-input"
            className="input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Masukkan nama project..."
            autoFocus
            style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
          />
          {error && (
            <p style={{ color: "var(--color-status-problem)", fontSize: 11, marginTop: 4, fontWeight: 500 }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            Customer: <strong style={{ color: "var(--color-text)" }}>{project.customer}</strong>
          </span>
          {project.company && (
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              Entity: <strong style={{ color: "var(--color-text)" }}>{project.company}</strong>
            </span>
          )}
        </div>
      </form>
    </Dialog>
  );
}
