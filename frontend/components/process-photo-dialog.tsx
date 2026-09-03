"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog } from "./dialog";
import { useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/format";
import type { Control } from "@/lib/types";

interface ProcessPhotoDialogProps {
  open: boolean;
  onClose: () => void;
  control: Control;
  itemDescription: string;
  projectId: string;
  joId: string;
  categoryId: string;
  itemId: string;
}

export function ProcessPhotoDialog({
  open,
  onClose,
  control,
  itemDescription,
  projectId,
  joId,
  categoryId,
  itemId,
}: ProcessPhotoDialogProps) {
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        dispatch({
          type: "ADD_PROCESS_PHOTO",
          projectId,
          joId,
          categoryId,
          itemId,
          process: control.process,
          photo: {
            id: uid(),
            name: file.name,
            previewUrl,
          },
        });
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [dispatch, projectId, joId, categoryId, itemId, control.process]
  );

  const handleRemove = useCallback(
    (photoId: string, previewUrl: string) => {
      URL.revokeObjectURL(previewUrl);
      dispatch({
        type: "REMOVE_PROCESS_PHOTO",
        projectId,
        joId,
        categoryId,
        itemId,
        process: control.process,
        photoId,
      });
    },
    [dispatch, projectId, joId, categoryId, itemId, control.process]
  );

  const photos = control.photos ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Photos — ${itemDescription} → ${control.process}`}
      footer={
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      }
    >
      {isController && (
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              transition: "border-color 100ms",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileAdd(e.target.files)}
            />
            📷 Add Photo
          </label>
        </div>
      )}

      {photos.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", padding: 16 }}>
          No photos attached yet.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                position: "relative",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-wash)",
              }}
            >
              <img
                src={photo.previewUrl}
                alt={photo.name}
                style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  padding: "4px 6px",
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {photo.name}
              </div>
              {isController && (
                <button
                  onClick={() => handleRemove(photo.id, photo.previewUrl)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={`Remove ${photo.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
