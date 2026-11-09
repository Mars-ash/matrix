"use client";
import React, { useState } from "react";
import type { Control, ControlStatus } from "@/lib/types";
import { StatusSelect } from "./status-select";
import { ProcessPhotoDialog } from "./process-photo-dialog";
import { ProblemNoteDialog } from "./problem-note-dialog";
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
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const photoCount = control.photos?.length ?? 0;

  const isExcludedProcess =
    control.process === "PO" ||
    control.process === "Material" ||
    control.process === "Arrival";

  // In viewer mode, hide the photo button completely if there are no photos attached
  const showPhotoButton = !isExcludedProcess && (!isViewer || photoCount > 0);
  const showProblemNoteButton = control.status === "Problem";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <StatusSelect value={control.status} notes={control.notes} onChange={onStatusChange} process={control.process} />

      {(showProblemNoteButton || showPhotoButton) && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
          {showProblemNoteButton && (
            <button
              type="button"
              className="problem-note-indicator"
              onClick={() => setNoteDialogOpen(true)}
              title={control.notes ? `Catatan Problem: ${control.notes}` : "Lihat / Edit Catatan Problem"}
              aria-label={`Problem note for ${itemDescription} - ${control.process}`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="8" y1="9" x2="16" y2="9" />
                <line x1="8" y1="13" x2="13" y2="13" />
              </svg>
            </button>
          )}

          {showPhotoButton && (
            <button
              type="button"
              className="photo-indicator"
              onClick={() => setPhotoDialogOpen(true)}
              title={photoCount > 0 ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "Add photo"}
              aria-label={photoCount > 0 ? `View ${photoCount} photos for ${itemDescription}` : `Add photo for ${itemDescription}`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {photoCount > 0 && <span className="photo-count">{photoCount}</span>}
            </button>
          )}
        </div>
      )}

      {showProblemNoteButton && (
        <ProblemNoteDialog
          open={noteDialogOpen}
          onClose={() => setNoteDialogOpen(false)}
          itemDescription={itemDescription}
          process={control.process}
          notes={control.notes || ""}
          onSaveNotes={(newNotes) => onStatusChange("Problem", newNotes)}
        />
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
