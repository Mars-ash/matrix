"use client";
import React, { useRef, useCallback } from "react";
import { uid } from "@/lib/format";
import type { TrialEntryPhoto } from "@/lib/types";
import { useAuth } from "@/lib/auth";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onAddPhoto]
  );

  const handleRemove = useCallback(
    (photoId: string, previewUrl: string) => {
      if (!confirm("Hapus foto ini?")) return;
      onRemovePhoto(photoId, previewUrl);
    },
    [onRemovePhoto]
  );

  return (
    <div className="trial-photo-uploader">
      {isController && (
        <label className="trial-photo-upload-btn">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFileAdd(e.target.files)}
          />
          📷 Tambah Foto
        </label>
      )}
      {photos.length > 0 && (
        <div className="trial-photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="trial-photo-thumb" title={photo.name}>
              <img
                src={photo.previewUrl}
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
                  onClick={() => handleRemove(photo.id, photo.previewUrl)}
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
    </div>
  );
}
