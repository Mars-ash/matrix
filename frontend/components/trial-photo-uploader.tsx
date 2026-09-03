"use client";
import React, { useRef, useCallback } from "react";
import { uid } from "@/lib/format";
import type { TrialEntryPhoto } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface TrialPhotoUploaderProps {
  photos: TrialEntryPhoto[];
  onAddPhoto: (photo: { id: string; name: string; previewUrl: string }) => void;
  onRemovePhoto: (photoId: string, previewUrl: string) => void;
}

export function TrialPhotoUploader({
  photos,
  onAddPhoto,
  onRemovePhoto,
}: TrialPhotoUploaderProps) {
  const { isController } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        onAddPhoto({
          id: uid(),
          name: file.name,
          previewUrl,
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onAddPhoto]
  );

  const handleRemove = useCallback(
    (photoId: string, previewUrl: string) => {
      if (!confirm("Hapus foto ini?")) return;
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
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
            <div key={photo.id} className="trial-photo-thumb">
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
              <div
                style={{
                  padding: "2px 4px",
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
                  type="button"
                  onClick={() => handleRemove(photo.id, photo.previewUrl)}
                  className="trial-photo-remove-btn"
                  aria-label={`Hapus ${photo.name}`}
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
