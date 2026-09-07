"use client";
import React, { useState, useCallback } from "react";
import { Dialog } from "./dialog";
import { useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";
import { COMPANIES, type CompanyEntity } from "@/lib/types";

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

export function ProjectCreateDialog({ open, onClose, onCreated }: ProjectCreateDialogProps) {
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [company, setCompany] = useState<CompanyEntity>("BKP");
  const [customer, setCustomer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setName("");
    setCompany("BKP");
    setCustomer("");
    setErrors({});
  }, []);

  const handleSubmit = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Project name is required.";
    if (!company) errs.company = "Company (BMI / BKP) is required.";
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
      company: company as CompanyEntity,
    });

    reset();
    onClose();
    if (onCreated) onCreated(newId);
  }, [name, company, customer, dispatch, onClose, reset, onCreated]);

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
          <label className="label">
            Project  <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(BMI / BKP)</span>
          </label>
          <select
            className="select"
            value={company}
            onChange={(e) => {
              setCompany(e.target.value as CompanyEntity);
              setErrors((p) => ({ ...p, company: "" }));
            }}
          >
            {COMPANIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.company && <p className="error-text">{errors.company}</p>}
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
