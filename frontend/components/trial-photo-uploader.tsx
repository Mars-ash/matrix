"use client";
import React, { useRef, useCallback } from "react";
import { useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";

interface TrialPhotoUploaderProps {
  projectId: string;
  joId: string;
  sessionId: string;
  findingId: string;
  photos: { id: string; name: string; previewUrl: string }[];
}

export function TrialPhotoUploader({
  projectId,
  joId,
  sessionId,
  findingId,
  photos,
}: TrialPhotoUploaderProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAdd = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        dispatch({
          type: "ADD_TRIAL_FINDING_PHOTO",
          projectId,
          joId,
          sessionId,
          findingId,
          photo: {
            id: uid(),
            name: file.name,
            previewUrl,
          },
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [dispatch, projectId, joId, sessionId, findingId]
  );

  const handleRemove = useCallback(
    (photoId: string, previewUrl: string) => {
      if (!confirm("Hapus foto ini?")) return;
      // Only revoke blob URLs, not local public paths
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      dispatch({
        type: "REMOVE_TRIAL_FINDING_PHOTO",
        projectId,
        joId,
        sessionId,
        findingId,
        photoId,
      });
    },
    [dispatch, projectId, joId, sessionId, findingId]
  );

  return (
    <div className="trial-photo-uploader">
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
      {photos.length > 0 && (
        <div className="trial-photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="trial-photo-thumb">
              <img
                src={photo.previewUrl}
                alt={photo.name}
                style={{
                  width: "100%",
                  height: 72,
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
              <button
                onClick={() => handleRemove(photo.id, photo.previewUrl)}
                className="trial-photo-remove-btn"
                aria-label={`Hapus ${photo.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
