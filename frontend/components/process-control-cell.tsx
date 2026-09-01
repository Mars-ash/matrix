"use client";
import React, { useState } from "react";
import type { Control, ControlStatus } from "@/lib/types";
import { StatusSelect } from "./status-select";
import { ProcessPhotoDialog } from "./process-photo-dialog";

interface ProcessControlCellProps {
  control: Control;
  projectId: string;
  joId: string;
  categoryId: string;
  itemId: string;
  itemDescription: string;
  onStatusChange: (newStatus: ControlStatus, notes: string) => void;
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
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const photoCount = control.photos?.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <StatusSelect value={control.status} notes={control.notes} onChange={onStatusChange} process={control.process} />

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
