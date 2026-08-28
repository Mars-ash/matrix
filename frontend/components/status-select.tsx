"use client";
import React, { useState, useCallback } from "react";
import type { ControlStatus } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { Dialog } from "./dialog";

interface StatusSelectProps {
  value: ControlStatus;
  notes: string;
  process?: string;
  allowedStatuses?: ControlStatus[];
  onChange: (status: ControlStatus, notes: string) => void;
}

export function StatusSelect({ value, notes, process, allowedStatuses, onChange }: StatusSelectProps) {
  const [pendingProblem, setPendingProblem] = useState(false);
  const [problemNotes, setProblemNotes] = useState("");
  const [notesError, setNotesError] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as ControlStatus;
      if (newStatus === "Problem") {
        setProblemNotes("");
        setNotesError("");
        setPendingProblem(true);
      } else {
        onChange(newStatus, "");
      }
    },
    [onChange]
  );

  const handleConfirmProblem = useCallback(() => {
    if (!problemNotes.trim()) {
      setNotesError("Notes are required when setting status to Problem.");
      return;
    }
    onChange("Problem", problemNotes.trim());
    setPendingProblem(false);
  }, [problemNotes, onChange]);

  const handleCancelProblem = useCallback(() => {
    setPendingProblem(false);
    setProblemNotes("");
    setNotesError("");
  }, []);

  // Determine select color based on current status
  const statusColorVar: Record<ControlStatus, string> = {
    "-": "var(--color-status-na)",
    "Not Started": "var(--color-status-not-started)",
    "In Progress": "var(--color-status-in-progress)",
    "In Progress SC": "var(--color-status-in-progress)",
    Done: "var(--color-status-done)",
    Problem: "var(--color-status-problem)",
  };

  const statusBgVar: Record<ControlStatus, string> = {
    "-": "var(--color-status-na-bg)",
    "Not Started": "var(--color-status-not-started-bg)",
    "In Progress": "var(--color-status-in-progress-bg)",
    "In Progress SC": "var(--color-status-in-progress-bg)",
    Done: "var(--color-status-done-bg)",
    Problem: "var(--color-status-problem-bg)",
  };

  const availableStatuses = (allowedStatuses || STATUSES.filter((s) => {
    if (s === "In Progress SC") {
      return ["Machining", "Hardening", "Wirecut"].includes(process || "");
    }
    return true;
  })).slice();

  if (!availableStatuses.includes(value)) {
    availableStatuses.unshift(value);
  }

  return (
    <>
      <select
        className="select"
        value={value}
        onChange={handleChange}
        style={{
          color: statusColorVar[value],
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 18px 4px 8px", // Adjusted right padding slightly to help optical centering
          width: "auto",
          minWidth: 100,
          backgroundColor: statusBgVar[value],
          borderColor: "transparent",
          textAlign: "center",
          display: "block",
          margin: "0 auto",
        }}
      >
        {availableStatuses.map((s) => (
          <option
            key={s}
            value={s}
            style={{
              color: "var(--color-text)",
              backgroundColor: "var(--color-bg-raised)",
            }}
          >
            {s}
          </option>
        ))}
      </select>

      {/* Notes indicator removed in favor of Activity Log */}

      {/* Problem notes dialog */}
      <Dialog
        open={pendingProblem}
        onClose={handleCancelProblem}
        title="Problem Notes Required"
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCancelProblem}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmProblem}>
              Confirm Problem
            </button>
          </>
        }
      >
        <textarea
          className="input"
          placeholder="Describe the problem..."
          value={problemNotes}
          onChange={(e) => {
            setProblemNotes(e.target.value);
            if (e.target.value.trim()) setNotesError("");
          }}
          rows={3}
          autoFocus
        />
        {notesError && <p className="error-text">{notesError}</p>}
      </Dialog>
    </>
  );
}
