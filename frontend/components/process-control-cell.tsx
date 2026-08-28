"use client";
import React, { useState } from "react";
import type { Control, ControlStatus } from "@/lib/types";
import { StatusSelect } from "./status-select";
import { ProcessPhotoDialog } from "./process-photo-dialog";
import { useAppDispatch } from "@/lib/store";

interface ProcessControlCellProps {
  control: Control;
  projectId: string;
  joId: string;
  categoryId: string;
  itemId: string;
  itemDescription: string;
  onStatusChange: (newStatus: ControlStatus, notes: string) => void;
}

function getDeadlineBadge(targetDate?: string, status?: ControlStatus): { text: string; color: string } | null {
  if (!targetDate || status === "Done") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue ${Math.abs(diffDays)}d`, color: "var(--color-status-problem)" };
  } else if (diffDays === 0) {
    return { text: "Hari H", color: "var(--color-status-in-progress)" };
  } else if (diffDays <= 3) {
    return { text: `H-${diffDays}`, color: "var(--color-status-in-progress)" };
  }
  return null;
}

function formatDate(isoString?: string) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ProcessControlCell({
  control,
  projectId,
  joId,
  categoryId,
  itemId,
  itemDescription,
  onStatusChange,
}: ProcessControlCellProps) {
  const dispatch = useAppDispatch();
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const photoCount = control.photos?.length ?? 0;

  const isPoMaterial = control.process === "PO" || control.process === "Material";
  const isArrival = control.process === "Arrival";
  const showArrivalDatePicker = isArrival && (control.status !== "Done" || Boolean(control.targetDate));
  const deadline = isArrival ? getDeadlineBadge(control.targetDate, control.status) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <StatusSelect value={control.status} notes={control.notes} onChange={onStatusChange} process={control.process} />

      {/* PO Mtl: Auto Start Date display */}
      {isPoMaterial && control.status === "In Progress" && control.inProgressAt && (
        <span style={{ fontSize: 10, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
          Start: {formatDate(control.inProgressAt)}
        </span>
      )}

      {/* Arrival: Compact Target Arrival Date Input */}
      {showArrivalDatePicker && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginTop: 1 }}>
          <input
            type="date"
            className="input"
            style={{
              fontSize: 10,
              padding: "1px 3px",
              width: 98,
              textAlign: "center",
              height: 22,
            }}
            value={control.targetDate || ""}
            onChange={(e) => {
              dispatch({
                type: "UPDATE_CONTROL_TARGET_DATE",
                projectId,
                joId,
                categoryId,
                itemId,
                process: control.process,
                targetDate: e.target.value,
              });
            }}
            title="Target Kedatangan Material"
          />
          {deadline && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: deadline.color,
                background: `color-mix(in srgb, ${deadline.color} 12%, transparent)`,
                padding: "1px 5px",
                borderRadius: 3,
                whiteSpace: "nowrap",
              }}
            >
              {deadline.text}
            </span>
          )}
        </div>
      )}

      {control.process !== "PO" && control.process !== "Material" && control.process !== "Arrival" && (
        <button
          className="photo-indicator"
          onClick={() => setPhotoDialogOpen(true)}
          title={photoCount > 0 ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "Add photo"}
        >
          📷{photoCount > 0 && <span className="photo-count">{photoCount}</span>}
        </button>
      )}

      <ProcessPhotoDialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        control={control}
        itemDescription={itemDescription}
        projectId={projectId}
        joId={joId}
        categoryId={categoryId}
        itemId={itemId}
      />
    </div>
  );
}
