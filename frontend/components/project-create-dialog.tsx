"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import { useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

export function ProjectCreateDialog({ open, onClose, onCreated }: ProjectCreateDialogProps) {
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setName("");
    setCustomer("");
    setErrors({});
  }, []);

  const handleSubmit = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Project name is required.";
    if (!customer.trim()) errs.customer = "Customer name is required.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const newId = uid();
    dispatch({
      type: "CREATE_PROJECT",
      id: newId,
      name: name.trim(),
      customer: customer.trim(),
    });

    reset();
    onClose();
    if (onCreated) onCreated(newId);
  }, [name, customer, dispatch, onClose, reset, onCreated]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create New Project"
      footer={
        <>
          <button
            className="btn btn-secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Create Project
          </button>
        </>
      }
    >
      <div 
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      >
        <div>
          <label className="label">Project Name *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            autoFocus
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div>
          <label className="label">Customer *</label>
          <input
            className="input"
            value={customer}
            onChange={(e) => {
              setCustomer(e.target.value);
              setErrors((p) => ({ ...p, customer: "" }));
            }}
          />
          {errors.customer && <p className="error-text">{errors.customer}</p>}
        </div>
      </div>
    </Dialog>
  );
}
