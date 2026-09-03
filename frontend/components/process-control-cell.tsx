"use client";
import React, { useState } from "react";
import type { Control, ControlStatus } from "@/lib/types";
import { StatusSelect } from "./status-select";
import { ProcessPhotoDialog } from "./process-photo-dialog";
import { useAuth } from "@/lib/auth";

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
  const { isViewer } = useAuth();
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const photoCount = control.photos?.length ?? 0;

  const isExcludedProcess =
    control.process === "PO" ||
    control.process === "Material" ||
    control.process === "Arrival";

  // In viewer mode, hide the photo button completely if there are no photos attached
  const showPhotoButton = !isExcludedProcess && (!isViewer || photoCount > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <StatusSelect value={control.status} notes={control.notes} onChange={onStatusChange} process={control.process} />

      {showPhotoButton && (
        <button
          type="button"
          className="photo-indicator"
          onClick={() => setPhotoDialogOpen(true)}
          title={photoCount > 0 ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "Add photo"}
          aria-label={photoCount > 0 ? `View ${photoCount} photos for ${itemDescription}` : `Add photo for ${itemDescription}`}
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
