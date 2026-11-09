"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog } from "./dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid, formatPhotoUrl } from "@/lib/format";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<ProcessPhoto | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<ProcessPhoto | null>(null);

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
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
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
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={`Photos — ${itemDescription} → ${control.process}`}
        footer={
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        }
      >
        {isController && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleFileAdd(e.target.files)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileAdd(e.target.files)}
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 12px",
                fontSize: 12,
                fontWeight: 600,
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background: "var(--color-bg-wash)",
                color: "var(--color-text)",
              }}
            >
              <svg
                width="14"
                height="14"
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
              <span>Ambil Foto</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 12px",
                fontSize: 12,
                fontWeight: 600,
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background: "var(--color-bg-wash)",
                color: "var(--color-text)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Pilih Galeri</span>
            </button>
          </div>
        )}

        {photos.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", padding: 16 }}>
            No photos attached yet.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {photos.map((photo) => {
              const formattedUrl = formatPhotoUrl(photo.previewUrl);
              return (
                <div
                  key={photo.id}
                  title={`Lihat foto: ${photo.name}`}
                  onClick={() => setPreviewPhoto(photo)}
                  style={{
                    position: "relative",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-wash)",
                    cursor: "pointer",
                    transition: "border-color 120ms ease, transform 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-accent, #3b82f6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  <img
                    src={formattedUrl}
                    alt={photo.name}
                    style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".img-error-fallback")) {
                        const fallback = document.createElement("div");
                        fallback.className = "img-error-fallback";
                        fallback.style.cssText =
                          "height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; font-size: 10px; color: var(--color-text-muted); text-align: center; background: var(--color-bg-subtle, #1e293b);";
                        fallback.innerHTML = `<span style="font-size: 16px;">🖼️</span><span style="font-size: 9px; max-width: 85px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">${photo.name}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {isController && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePhotoTarget(photo);
                      }}
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
                        zIndex: 2,
                      }}
                      aria-label={`Remove ${photo.name}`}
                      title="Hapus foto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
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
          thumbnailUrl={formatPhotoUrl(deletePhotoTarget?.previewUrl)}
          photoName={deletePhotoTarget?.name}
        />
      </Dialog>

      {/* Lightbox / Full-size photo viewer */}
      {previewPhoto && (
        <Dialog
          open={!!previewPhoto}
          onClose={() => setPreviewPhoto(null)}
          title={`Foto: ${previewPhoto.name}`}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <a
                href={formatPhotoUrl(previewPhoto.previewUrl)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: "none" }}
              >
                Buka Resolusi Penuh ↗
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewPhoto(null)}
              >
                Tutup
              </button>
            </div>
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-bg-wash, #0f172a)",
              borderRadius: "var(--radius-md)",
              padding: 8,
              overflow: "hidden",
              maxHeight: "70vh",
            }}
          >
            <img
              src={formatPhotoUrl(previewPhoto.previewUrl)}
              alt={previewPhoto.name}
              style={{
                maxWidth: "100%",
                maxHeight: "65vh",
                objectFit: "contain",
                borderRadius: "var(--radius-sm)",
                display: "block",
              }}
            />
          </div>
        </Dialog>
      )}
    </>
  );
}
