"use client";
import React, { useState, useCallback, useEffect, type KeyboardEvent } from "react";
import { TrialPhotoUploader } from "./trial-photo-uploader";
import { useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";
import {
  formatFindingLetter,
  sortTrialEntries,
  deriveTrialFindingStatus,
} from "@/lib/trial-report";
import type {
  TrialFinding,
  TrialTextEntry,
  TrialCorrectiveActionEntry,
  TrialFindingStatus,
} from "@/lib/types";
import { TRIAL_FINDING_STATUSES } from "@/lib/types";
import { useAuth } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/* PIC Tag Input — Enter to add, click ✕ to remove, comma-separated   */
/* ------------------------------------------------------------------ */
function PicTagInput({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const addTag = useCallback(
    (raw: string) => {
      const name = raw.trim();
      if (!name) return;
      // avoid exact duplicate
      if (tags.some((t) => t.toLowerCase() === name.toLowerCase())) {
        setDraft("");
        return;
      }
      onChange([...tags, name].join(", "));
      setDraft("");
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (idx: number) => {
      onChange(tags.filter((_, i) => i !== idx).join(", "));
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(draft);
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="pic-tag-input">
      {tags.map((tag, i) => (
        <span key={i} className="pic-tag">
          {tag}
          {!readOnly && (
            <button
              type="button"
              className="pic-tag-remove"
              onClick={() => removeTag(i)}
              aria-label={`Hapus ${tag}`}
            >
              ✕
            </button>
          )}
        </span>
      ))}
      {!readOnly && (
        <input
          className="pic-tag-draft"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={tags.length === 0 ? "Nama PIC, tekan Enter" : "+ Tambah"}
        />
      )}
      {readOnly && tags.length === 0 && (
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>-</span>
      )}
    </div>
  );
}

interface TrialFindingCardProps {
  projectId: string;
  joId: string;
  sessionId: string;
  finding: TrialFinding;
  displayOrder: number;
  isFirst: boolean;
  isLast: boolean;
  isHighlighted?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export function TrialFindingCard({
  projectId,
  joId,
  sessionId,
  finding,
  displayOrder,
  isFirst,
  isLast,
  isHighlighted = false,
  isOpen,
  onToggleOpen,
}: TrialFindingCardProps) {
  const dispatch = useAppDispatch();
  const { isController, isViewer } = useAuth();
  const findingLetter = formatFindingLetter(displayOrder);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;

  const toggleOpen = useCallback(() => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [onToggleOpen]);

  useEffect(() => {
    if (isHighlighted && !open) {
      if (onToggleOpen) {
        onToggleOpen();
      } else {
        setInternalOpen(true);
      }
    }
  }, [isHighlighted, open, onToggleOpen]);

  const sortedProblems = sortTrialEntries(finding.problems ?? []);
  const sortedCauses = sortTrialEntries(finding.causes ?? []);
  const sortedActions = sortTrialEntries(finding.correctiveActions ?? []);
  const findingStatus = deriveTrialFindingStatus(finding);
  const firstProblemSnippet = sortedProblems[0]?.text?.trim();

  // Finding-level operations
  const handleDeleteFinding = () => {
    if (!confirm(`Hapus Temuan ${findingLetter}?`)) return;
    dispatch({
      type: "DELETE_TRIAL_FINDING",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
    });
  };

  const handleMoveFinding = (direction: "up" | "down") => {
    dispatch({
      type: "REORDER_TRIAL_FINDING",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      direction,
    });
  };

  // Section entry operations
  const handleAddProblem = () => {
    const now = new Date().toISOString();
    const newEntry: TrialTextEntry = {
      id: uid(),
      order: sortedProblems.length + 1,
      text: "",
      photos: [],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({
      type: "ADD_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section: "problems",
      entry: newEntry,
    });
  };

  const handleAddCause = () => {
    const now = new Date().toISOString();
    const newEntry: TrialTextEntry = {
      id: uid(),
      order: sortedCauses.length + 1,
      text: "",
      photos: [],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({
      type: "ADD_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section: "causes",
      entry: newEntry,
    });
  };

  const handleAddAction = () => {
    const now = new Date().toISOString();
    const newEntry: TrialCorrectiveActionEntry = {
      id: uid(),
      order: sortedActions.length + 1,
      text: "",
      targetDate: "",
      pic: "",
      status: "On Process",
      photos: [],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({
      type: "ADD_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section: "correctiveActions",
      entry: newEntry,
    });
  };

  const handleUpdateEntry = (
    section: "problems" | "causes" | "correctiveActions",
    entryId: string,
    updates:
      | Partial<Omit<TrialTextEntry, "id" | "photos" | "createdAt">>
      | Partial<Omit<TrialCorrectiveActionEntry, "id" | "photos" | "createdAt">>
  ) => {
    dispatch({
      type: "UPDATE_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section,
      entryId,
      updates,
    });
  };

  const handleDeleteEntry = (
    section: "problems" | "causes" | "correctiveActions",
    entryId: string,
    label: string
  ) => {
    if (!confirm(`Hapus ${label}?`)) return;
    dispatch({
      type: "DELETE_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section,
      entryId,
    });
  };

  const handleMoveEntry = (
    section: "problems" | "causes" | "correctiveActions",
    entryId: string,
    direction: "up" | "down"
  ) => {
    dispatch({
      type: "REORDER_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section,
      entryId,
      direction,
    });
  };

  const handleAddPhoto = (
    section: "problems" | "causes" | "correctiveActions",
    entryId: string,
    photo: { id: string; name: string; previewUrl: string }
  ) => {
    dispatch({
      type: "ADD_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section,
      entryId,
      photo,
    });
  };

  const handleRemovePhoto = (
    section: "problems" | "causes" | "correctiveActions",
    entryId: string,
    photoId: string
  ) => {
    dispatch({
      type: "REMOVE_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId,
      findingId: finding.id,
      section,
      entryId,
      photoId,
    });
  };

  return (
    <div
      id={`finding-${finding.id}`}
      className={`trial-finding-card ${isHighlighted ? "finding-highlight" : ""} ${
        !open ? "is-collapsed" : ""
      }`}
    >
      {/* Finding header */}
      <div
        className="trial-finding-header"
        onClick={toggleOpen}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <div className="trial-finding-header-left">
          <button
            type="button"
            className={`trial-finding-chevron ${open ? "is-open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            aria-label={open ? "Tutup temuan" : "Buka temuan"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <span className="trial-finding-number">Temuan {findingLetter}</span>

          <span
            className={`trial-status-badge-sm ${
              findingStatus === "Close"
                ? "trial-status-close"
                : "trial-status-on-process"
            }`}
          >
            {findingStatus}
          </span>

          <span className="trial-finding-count-badge">
            {sortedProblems.length} Masalah · {sortedCauses.length} Penyebab · {sortedActions.length} Perbaikan
          </span>

          {!open && firstProblemSnippet && (
            <span className="trial-finding-snippet" title={firstProblemSnippet}>
              &ldquo;{firstProblemSnippet}&rdquo;
            </span>
          )}
        </div>

        {isController && (
          <div
            className="trial-finding-header-right"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isFirst}
              onClick={() => handleMoveFinding("up")}
              title="Pindah temuan ke atas"
              style={{ padding: "2px 6px", fontSize: 11 }}
            >
              ▲
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isLast}
              onClick={() => handleMoveFinding("down")}
              title="Pindah temuan ke bawah"
              style={{ padding: "2px 6px", fontSize: 11 }}
            >
              ▼
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDeleteFinding}
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
        )}
      </div>

      {open && (
        <div className="trial-finding-body">

      {/* 1. Uraian Masalah Section */}
      <div className="trial-section-block">
        <div className="trial-section-header">
          <span className="trial-section-title">Uraian Masalah</span>
          {isController && (
            <button
              type="button"
              className="btn btn-secondary btn-sm trial-add-entry-btn"
              onClick={handleAddProblem}
            >
              + Tambah Masalah
            </button>
          )}
        </div>
        {sortedProblems.length === 0 ? (
          <div className="trial-section-empty">
            Belum ada uraian masalah. Klik &quot;+ Tambah Masalah&quot; untuk menambahkan.
          </div>
        ) : (
          <div className="trial-entry-list">
            {sortedProblems.map((problem, pIdx) => (
              <div key={problem.id} className="trial-entry-row">
                <div className="trial-entry-header">
                  <span className="trial-entry-index">#{problem.order}</span>
                  {isController && (
                    <div className="trial-entry-controls">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={pIdx === 0}
                        onClick={() => handleMoveEntry("problems", problem.id, "up")}
                        title="Pindah ke atas"
                        style={{ padding: "1px 5px", fontSize: 10 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={pIdx === sortedProblems.length - 1}
                        onClick={() => handleMoveEntry("problems", problem.id, "down")}
                        title="Pindah ke bawah"
                        style={{ padding: "1px 5px", fontSize: 10 }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleDeleteEntry("problems", problem.id, `masalah #${problem.order}`)
                        }
                        title="Hapus baris masalah"
                        style={{
                          padding: "1px 5px",
                          fontSize: 10,
                          color: "var(--color-status-problem)",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  className="input"
                  rows={2}
                  value={problem.text}
                  onChange={(e) =>
                    handleUpdateEntry("problems", problem.id, { text: e.target.value })
                  }
                  readOnly={isViewer}
                  placeholder={isViewer ? "" : "Deskripsi masalah yang ditemukan..."}
                />
                <TrialPhotoUploader
                  photos={problem.photos ?? []}
                  onAddPhoto={(photo) => handleAddPhoto("problems", problem.id, photo)}
                  onRemovePhoto={(photoId) => handleRemovePhoto("problems", problem.id, photoId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Penyebab Section */}
      <div className="trial-section-block">
        <div className="trial-section-header">
          <span className="trial-section-title">Penyebab</span>
          {isController && (
            <button
              type="button"
              className="btn btn-secondary btn-sm trial-add-entry-btn"
              onClick={handleAddCause}
            >
              + Tambah Penyebab
            </button>
          )}
        </div>
        {sortedCauses.length === 0 ? (
          <div className="trial-section-empty">
            Belum ada penyebab. Klik &quot;+ Tambah Penyebab&quot; untuk menambahkan.
          </div>
        ) : (
          <div className="trial-entry-list">
            {sortedCauses.map((cause, cIdx) => (
              <div key={cause.id} className="trial-entry-row">
                <div className="trial-entry-header">
                  <span className="trial-entry-index">#{cause.order}</span>
                  {isController && (
                    <div className="trial-entry-controls">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={cIdx === 0}
                        onClick={() => handleMoveEntry("causes", cause.id, "up")}
                        title="Pindah ke atas"
                        style={{ padding: "1px 5px", fontSize: 10 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={cIdx === sortedCauses.length - 1}
                        onClick={() => handleMoveEntry("causes", cause.id, "down")}
                        title="Pindah ke bawah"
                        style={{ padding: "1px 5px", fontSize: 10 }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleDeleteEntry("causes", cause.id, `penyebab #${cause.order}`)
                        }
                        title="Hapus baris penyebab"
                        style={{
                          padding: "1px 5px",
                          fontSize: 10,
                          color: "var(--color-status-problem)",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  className="input"
                  rows={2}
                  value={cause.text}
                  onChange={(e) =>
                    handleUpdateEntry("causes", cause.id, { text: e.target.value })
                  }
                  readOnly={isViewer}
                  placeholder={isViewer ? "" : "Penyebab masalah..."}
                />
                <TrialPhotoUploader
                  photos={cause.photos ?? []}
                  onAddPhoto={(photo) => handleAddPhoto("causes", cause.id, photo)}
                  onRemovePhoto={(photoId) => handleRemovePhoto("causes", cause.id, photoId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Langkah Perbaikan Section */}
      <div className="trial-section-block">
        <div className="trial-section-header">
          <span className="trial-section-title">Langkah Perbaikan</span>
          {isController && (
            <button
              type="button"
              className="btn btn-primary btn-sm trial-add-entry-btn"
              onClick={handleAddAction}
            >
              + Tambah Langkah Perbaikan
            </button>
          )}
        </div>
        {sortedActions.length === 0 ? (
          <div className="trial-section-empty">
            Belum ada langkah perbaikan. Klik &quot;+ Tambah Langkah Perbaikan&quot; untuk menambahkan.
          </div>
        ) : (
          <div className="trial-entry-list">
            {sortedActions.map((action, aIdx) => (
              <div key={action.id} className="trial-entry-row">
                <div className="trial-entry-header">
                  <span className="trial-entry-index">#{action.order}</span>
                  {isController && (
                    <div className="trial-entry-controls">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={aIdx === 0}
                        onClick={() => handleMoveEntry("correctiveActions", action.id, "up")}
                        title="Pindah ke atas"
                        style={{ padding: "1px 5px", fontSize: 10 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={aIdx === sortedActions.length - 1}
                        onClick={() => handleMoveEntry("correctiveActions", action.id, "down")}
                        title="Pindah ke bawah"
                        style={{ padding: "1px 5px", fontSize: 10 }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleDeleteEntry("correctiveActions", action.id, `langkah perbaikan #${action.order}`)
                        }
                        title="Hapus baris langkah perbaikan"
                        style={{
                          padding: "1px 5px",
                          fontSize: 10,
                          color: "var(--color-status-problem)",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  className="input"
                  rows={2}
                  value={action.text}
                  onChange={(e) =>
                    handleUpdateEntry("correctiveActions", action.id, { text: e.target.value })
                  }
                  readOnly={isViewer}
                  placeholder={isViewer ? "" : "Tindakan perbaikan..."}
                />
                {/* Target · PIC · Status — each in its own column */}
                <div className="trial-action-columns">
                  <div className="trial-action-col">
                    <label className="label" style={{ fontSize: 11, marginBottom: 2 }}>
                      Target
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={action.targetDate}
                      onChange={(e) =>
                        handleUpdateEntry("correctiveActions", action.id, { targetDate: e.target.value })
                      }
                      readOnly={isViewer}
                    />
                  </div>
                  <div className="trial-action-col">
                    <label className="label" style={{ fontSize: 11, marginBottom: 2 }}>
                      PIC
                    </label>
                    <PicTagInput
                      value={action.pic}
                      readOnly={isViewer}
                      onChange={(v) =>
                        handleUpdateEntry("correctiveActions", action.id, { pic: v })
                      }
                    />
                  </div>
                  <div className="trial-action-col">
                    <label className="label" style={{ fontSize: 11, marginBottom: 2 }}>
                      Status
                    </label>
                    <select
                      className="select trial-finding-status-select"
                      value={action.status}
                      disabled={isViewer}
                      onChange={(e) =>
                        handleUpdateEntry("correctiveActions", action.id, {
                          status: e.target.value as TrialFindingStatus,
                        })
                      }
                      style={{ width: "100%" }}
                    >
                      {TRIAL_FINDING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <TrialPhotoUploader
                  photos={action.photos ?? []}
                  onAddPhoto={(photo) => handleAddPhoto("correctiveActions", action.id, photo)}
                  onRemovePhoto={(photoId) => handleRemovePhoto("correctiveActions", action.id, photoId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}
