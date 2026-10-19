"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog } from "./dialog";
import { useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";
import { COMPANIES, DEFAULT_CUSTOMERS, type CompanyEntity } from "@/lib/types";
import { CustomerCombobox } from "./customer-combobox";
import { api } from "@/lib/api-client";

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
  customers?: readonly string[];
}

export function ProjectCreateDialog({
  open,
  onClose,
  onCreated,
  customers: propCustomers,
}: ProjectCreateDialogProps) {
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [company, setCompany] = useState<CompanyEntity>("BKP");
  const [customer, setCustomer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partnerCustomers, setPartnerCustomers] = useState<string[]>([]);

  // Fetch active customers from API whenever dialog opens
  useEffect(() => {
    if (!open || propCustomers) return;
    let isMounted = true;
    api.getPartners("customer", "active")
      .then((data) => {
        if (isMounted && data.length > 0) {
          setPartnerCustomers(data.map((p) => p.name));
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_CUSTOMERS
      });
    return () => {
      isMounted = false;
    };
  }, [open, propCustomers]);

  const effectiveCustomers = useMemo(() => {
    if (propCustomers && propCustomers.length > 0) return propCustomers;
    if (partnerCustomers.length > 0) return partnerCustomers;
    return DEFAULT_CUSTOMERS;
  }, [propCustomers, partnerCustomers]);

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
    if (!customer.trim()) {
      errs.customer = "Customer name is required.";
    } else if (
      effectiveCustomers.length > 0 &&
      !effectiveCustomers.some((c) => c.toLowerCase() === customer.trim().toLowerCase())
    ) {
      errs.customer = "Pilih customer yang valid dari daftar dropdown.";
    }

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
  }, [name, company, customer, effectiveCustomers, dispatch, onClose, reset, onCreated]);

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
          <label className="label" htmlFor="project-name-input">Project Name *</label>
          <input
            id="project-name-input"
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
          <label className="label" htmlFor="project-company-select">
            Project <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(BMI / BKP)</span>
          </label>
          <select
            id="project-company-select"
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
          <label className="label" htmlFor="project-customer-combobox">Customer *</label>
          <CustomerCombobox
            id="project-customer-combobox"
            value={customer}
            options={effectiveCustomers}
            onChange={(val) => {
              setCustomer(val);
              setErrors((p) => ({ ...p, customer: "" }));
            }}
            error={errors.customer}
          />
        </div>
      </div>
    </Dialog>
  );
}
