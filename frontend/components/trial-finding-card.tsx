"use client";
import React from "react";
import { TrialPhotoUploader } from "./trial-photo-uploader";
import { useAppDispatch } from "@/lib/store";
import type { TrialFinding } from "@/lib/types";
import { TRIAL_FINDING_STATUSES } from "@/lib/types";

interface TrialFindingCardProps {
  projectId: string;
  joId: string;
  sessionId: string;
  finding: TrialFinding;
  displayOrder: number;
  isFirst: boolean;
  isLast: boolean;
}

export function TrialFindingCard({
  projectId,
  joId,
  sessionId,
  finding,
  displayOrder,
  isFirst,
  isLast,
}: TrialFindingCardProps) {
  const dispatch = useAppDispatch();

  const updateField = (
    updates: Partial<Omit<TrialFinding, "id" | "photos" | "createdAt">>
  ) => {
    dispatch({
      type: "UPDATE_TRIAL_FINDING",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      updates,
    });
  };

  const handleDelete = () => {
    if (!confirm(`Hapus temuan #${displayOrder}?`)) return;
    dispatch({
      type: "DELETE_TRIAL_FINDING",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
    });
  };

  const handleMove = (direction: "up" | "down") => {
    dispatch({
      type: "REORDER_TRIAL_FINDING",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      direction,
    });
  };

  return (
    <div className="trial-finding-card">
      {/* Finding header */}
      <div className="trial-finding-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="trial-finding-number">#{displayOrder}</span>
          <select
            className="select trial-finding-status-select"
            value={finding.status}
            onChange={(e) =>
              updateField({
                status: e.target.value as (typeof TRIAL_FINDING_STATUSES)[number],
              })
            }
          >
            {TRIAL_FINDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={isFirst}
            onClick={() => handleMove("up")}
            title="Pindah ke atas"
            style={{ padding: "2px 6px", fontSize: 11 }}
          >
            ▲
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={isLast}
            onClick={() => handleMove("down")}
            title="Pindah ke bawah"
            style={{ padding: "2px 6px", fontSize: 11 }}
          >
            ▼
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDelete}
            title="Hapus temuan"
            style={{
              padding: "2px 6px",
              fontSize: 11,
              color: "var(--color-status-problem)",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Finding fields */}
      <div className="trial-finding-fields">
        <div>
          <label className="label">Uraian Masalah</label>
          <textarea
            className="input"
            rows={2}
            value={finding.problem}
            onChange={(e) => updateField({ problem: e.target.value })}
            placeholder="Deskripsi masalah yang ditemukan..."
          />
        </div>
        <div>
          <label className="label">Penyebab</label>
          <textarea
            className="input"
            rows={2}
            value={finding.cause}
            onChange={(e) => updateField({ cause: e.target.value })}
            placeholder="Penyebab masalah..."
          />
        </div>
        <div>
          <label className="label">Langkah Perbaikan</label>
          <textarea
            className="input"
            rows={2}
            value={finding.correctiveAction}
            onChange={(e) =>
              updateField({ correctiveAction: e.target.value })
            }
            placeholder="Tindakan perbaikan..."
          />
        </div>
        <div className="trial-finding-inline-fields">
          <div>
            <label className="label">Target</label>
            <input
              className="input"
              type="date"
              value={finding.targetDate}
              onChange={(e) => updateField({ targetDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">PIC</label>
            <input
              className="input"
              type="text"
              value={finding.pic}
              onChange={(e) => updateField({ pic: e.target.value })}
              placeholder="PIC"
            />
          </div>
        </div>
      </div>

      {/* Photos */}
      <TrialPhotoUploader
        projectId={projectId}
        joId={joId}
        sessionId={sessionId}
        findingId={finding.id}
        photos={finding.photos}
      />
    </div>
  );
}
