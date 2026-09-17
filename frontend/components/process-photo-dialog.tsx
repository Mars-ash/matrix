"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog } from "./dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/format";
import type { Control, ProcessPhoto } from "@/lib/types";

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

/**
 * Compress image file to base64 data URL for persistence across tabs and sessions.
 */
function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve((e.target?.result as string) || "");
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || "");
      img.src = (e.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
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
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<ProcessPhoto | null>(null);

  const handleFileAdd = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = await compressImageFile(file);
        if (!previewUrl) continue;
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
          file,
        });
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [dispatch, projectId, joId, categoryId, itemId, control.process]
  );

  const handleRemove = useCallback(
    (photoId: string, previewUrl?: string) => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
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
              title={photo.name}
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
              {isController && (
                <button
                  type="button"
                  onClick={() => setDeletePhotoTarget(photo)}
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
                  title="Hapus foto"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom photo delete confirmation */}
      <ConfirmDialog
        open={!!deletePhotoTarget}
        onClose={() => setDeletePhotoTarget(null)}
        onConfirm={() => {
          if (deletePhotoTarget) {
            handleRemove(deletePhotoTarget.id, deletePhotoTarget.previewUrl);
            setDeletePhotoTarget(null);
          }
        }}
        title="Hapus Foto"
        message="Hapus foto ini?"
        confirmText="Hapus"
        thumbnailUrl={deletePhotoTarget?.previewUrl}
        photoName={deletePhotoTarget?.name}
      />
    </Dialog>
  );
}
