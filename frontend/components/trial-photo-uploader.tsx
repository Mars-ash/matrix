"use client";
import React, { useState, useRef, useCallback } from "react";
import { uid, formatPhotoUrl } from "@/lib/format";
import type { TrialEntryPhoto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "./confirm-dialog";

interface TrialPhotoUploaderProps {
  photos: TrialEntryPhoto[];
  onAddPhoto: (photo: { id: string; name: string; previewUrl: string }, file?: File) => void;
  onRemovePhoto: (photoId: string, previewUrl: string) => void;
}

/**
 * Compress image file to base64 data URL for persistence across tabs and sessions.
 */
function compressImageFile(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.80): Promise<string> {
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

export function TrialPhotoUploader({
  photos,
  onAddPhoto,
  onRemovePhoto,
}: TrialPhotoUploaderProps) {
  const { isController } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<TrialEntryPhoto | null>(null);

  const handleFileAdd = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = await compressImageFile(file);
        if (previewUrl) {
          onAddPhoto(
            {
              id: uid(),
              name: file.name,
              previewUrl,
            },
            file
          );
        }
      }
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    },
    [onAddPhoto]
  );

  return (
    <div className="trial-photo-uploader">
      {isController && (
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
            className="trial-photo-upload-btn"
            onClick={() => cameraInputRef.current?.click()}
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
            className="trial-photo-upload-btn"
            onClick={() => galleryInputRef.current?.click()}
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
      {photos.length > 0 && (
        <div className="trial-photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="trial-photo-thumb" title={photo.name}>
              <img
                src={formatPhotoUrl(photo.previewUrl)}
                alt={photo.name}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  display: "block",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              {isController && (
                <button
                  type="button"
                  onClick={() => setDeletePhotoTarget(photo)}
                  className="trial-photo-remove-btn"
                  aria-label={`Hapus foto`}
                  title="Hapus foto"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom non-native Photo Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePhotoTarget}
        onClose={() => setDeletePhotoTarget(null)}
        onConfirm={() => {
          if (deletePhotoTarget) {
            onRemovePhoto(deletePhotoTarget.id, deletePhotoTarget.previewUrl);
            setDeletePhotoTarget(null);
          }
        }}
        title="Hapus Foto"
        message="Hapus foto ini?"
        confirmText="Hapus"
        thumbnailUrl={formatPhotoUrl(deletePhotoTarget?.previewUrl)}
        photoName={deletePhotoTarget?.name}
      />
    </div>
  );
}
