"use client";
import React, { useState, useCallback, useEffect } from "react";
import { TrialFindingCard } from "./trial-finding-card";
import { useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/format";
import {
  sortTrialFindings,
  deriveTrialSessionStatus,
  formatDateTimeDDMMYYYYHHmm,
  hasUnpublishedTrialChanges,
} from "@/lib/trial-report";
import type { TrialSession, TrialFinding } from "@/lib/types";

interface TrialReportEditorProps {
  projectId: string;
  joId: string;
  session: TrialSession;
  highlightedFindingId?: string | null;
}

export function TrialReportEditor({
  projectId,
  joId,
  session,
  highlightedFindingId = null,
}: TrialReportEditorProps) {
  const dispatch = useAppDispatch();
  const { isController, isViewer } = useAuth();
  const sortedFindings = sortTrialFindings(session.findings);
  const derivedStatus = deriveTrialSessionStatus(session);
  const isUnpublished = hasUnpublishedTrialChanges(session);
  const [showToast, setShowToast] = useState(false);

  const formatPublishedTimestamp = (iso?: string) => {
    if (!iso) return "Belum pernah";
    return formatDateTimeDDMMYYYYHHmm(iso);
  };

  const handlePublishToViewer = () => {
    dispatch({
      type: "PUBLISH_TRIAL_SESSION_TO_VIEWER",
      projectId,
      joId,
      sessionId: session.id,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Set of expanded finding IDs (default: all findings expanded so inputs and statuses are immediately accessible)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(session.findings.map((f) => f.id))
  );

  // Expand all findings when session changes
  useEffect(() => {
    setExpandedIds(new Set(session.findings.map((f) => f.id)));
  }, [session.id]);

  // Auto-expand highlighted finding if smart search jumps to it
  useEffect(() => {
    if (highlightedFindingId) {
      setExpandedIds((prev) => {
        if (prev.has(highlightedFindingId)) return prev;
        const next = new Set(prev);
        next.add(highlightedFindingId);
        return next;
      });
    }
  }, [highlightedFindingId]);

  const handleToggleFinding = useCallback((findingId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(session.findings.map((f) => f.id)));
  }, [session.findings]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const updateSession = (
    updates: Partial<
      Omit<TrialSession, "id" | "joId" | "findings" | "createdAt">
    >
  ) => {
    dispatch({
      type: "UPDATE_TRIAL_SESSION",
      projectId,
      joId,
      sessionId: session.id,
      updates,
    });
  };

  const handleAddFinding = () => {
    const now = new Date().toISOString();
    const maxOrder = session.findings.reduce(
      (max, f) => Math.max(max, f.order),
      0
    );
    const newFinding: TrialFinding = {
      id: uid(),
      order: maxOrder + 1,
      problems: [
        {
          id: uid(),
          order: 1,
          text: "",
          photos: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      causes: [
        {
          id: uid(),
          order: 1,
          text: "",
          photos: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      correctiveActions: [
        {
          id: uid(),
          order: 1,
          text: "",
          targetDate: "",
          pic: "",
          status: "On Process",
          photos: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({
      type: "ADD_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: session.id,
      finding: newFinding,
    });
    // Ensure newly created finding starts expanded so user can immediately edit it
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(newFinding.id);
      return next;
    });
  };

  return (
    <div className="trial-editor">
      {/* Staff Engineering Synchronization Bar */}
      {isController && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            marginBottom: 16,
            background: "var(--color-bg-surface, #ffffff)",
            border: isUnpublished
              ? "1px solid rgba(217, 119, 6, 0.4)"
              : "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            gap: 12,
            transition: "border-color .15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              Terakhir diperbarui:{" "}
              <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                {formatPublishedTimestamp(session.lastPublishedAt)}
              </span>
            </div>

            {/* Status indicator: bila ada perubahan "Ada perubahan yang belum di-update", bila sudah sinkron ya pakai tanda aja */}
            {isUnpublished ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-status-in-progress, #d97706)",
                  background: "rgba(217, 119, 6, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(217, 119, 6, 0.25)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-status-in-progress, #d97706)",
                    display: "inline-block",
                  }}
                />
                Ada perubahan yang belum di-update
              </span>
            ) : (
              <span
                title="Sudah sinkron"
                aria-label="Sudah sinkron"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--color-status-done-bg, rgba(13, 124, 74, 0.1))",
                  color: "var(--color-status-done, #0d7c4a)",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid rgba(13, 124, 74, 0.25)",
                }}
              >
                ✓
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {showToast && (
              <span style={{ fontSize: 12, color: "var(--color-status-done)", fontWeight: 500 }}>
                Tersimpan
              </span>
            )}
            <button
              type="button"
              onClick={handlePublishToViewer}
              className="btn btn-primary"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                padding: "5px 14px",
              }}
            >
              UPDATE
            </button>
          </div>
        </div>
      )}

      {/* Session identity */}
      <div className="trial-editor-identity">
        <div style={{ flex: 1, minWidth: 240, maxWidth: 460 }}>
          <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>
            Nama Session
          </label>
          {isViewer ? (
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, padding: "4px 0", color: "var(--color-text)" }}>
              {session.name}
            </h2>
          ) : (
            <input
              className="input"
              type="text"
              value={session.name}
              onChange={(e) => updateSession({ name: e.target.value })}
              style={{ fontSize: 16, fontWeight: 700 }}
              placeholder="Masukkan nama session..."
            />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-end", paddingBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Status:</span>
          <span
            className={`trial-status-badge ${
              derivedStatus === "Close"
                ? "trial-status-close"
                : "trial-status-on-process"
            }`}
          >
            {derivedStatus}
          </span>
        </div>
      </div>

      {/* Session header fields */}
      <div className="trial-editor-header-fields">
        <div>
          <label className="label">Hari Trial</label>
          {isViewer ? (
            <div style={{ fontSize: 13, fontWeight: 500, padding: "6px 0", color: "var(--color-text)" }}>
              {session.trialDate || "—"}
            </div>
          ) : (
            <input
              className="input"
              type="date"
              value={session.trialDate}
              onChange={(e) => updateSession({ trialDate: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="label">Update</label>
          {isViewer ? (
            <div style={{ fontSize: 13, fontWeight: 500, padding: "6px 0", color: "var(--color-text)" }}>
              {session.updateDate || "—"}
            </div>
          ) : (
            <input
              className="input"
              type="date"
              value={session.updateDate}
              onChange={(e) => updateSession({ updateDate: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="label">Customer</label>
          {isViewer ? (
            <div style={{ fontSize: 13, fontWeight: 500, padding: "6px 0", color: "var(--color-text)" }}>
              {session.customer || "—"}
            </div>
          ) : (
            <input
              className="input"
              type="text"
              value={session.customer}
              onChange={(e) => updateSession({ customer: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="label">Job No.</label>
          {isViewer ? (
            <div style={{ fontSize: 13, fontWeight: 500, padding: "6px 0", color: "var(--color-text)" }}>
              {session.jobNo || "—"}
            </div>
          ) : (
            <input
              className="input"
              type="text"
              value={session.jobNo}
              onChange={(e) => updateSession({ jobNo: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="label">PIC</label>
          {isViewer ? (
            <div style={{ fontSize: 13, fontWeight: 500, padding: "6px 0", color: "var(--color-text)" }}>
              {session.picName || "—"}
            </div>
          ) : (
            <input
              className="input"
              type="text"
              value={session.picName}
              onChange={(e) => updateSession({ picName: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="label">Approved by</label>
          {isViewer ? (
            <div style={{ fontSize: 13, fontWeight: 500, padding: "6px 0", color: "var(--color-text)" }}>
              {session.approvedByName || "—"}
            </div>
          ) : (
            <input
              className="input"
              type="text"
              value={session.approvedByName}
              onChange={(e) => updateSession({ approvedByName: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* Findings */}
      <div className="trial-findings-section">
        <div className="trial-findings-section-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              Temuan ({sortedFindings.length})
            </h3>
            {sortedFindings.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExpandAll}
                  style={{ fontSize: 11, padding: "2px 8px" }}
                  title="Buka semua temuan"
                >
                  Buka Semua
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCollapseAll}
                  style={{ fontSize: 11, padding: "2px 8px" }}
                  title="Tutup semua temuan"
                >
                  Tutup Semua
                </button>
              </div>
            )}
          </div>
          {isController && (
            <button className="btn btn-primary btn-sm" onClick={handleAddFinding}>
              + Tambah Temuan
            </button>
          )}
        </div>

        {sortedFindings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: "var(--color-text-muted)",
              fontSize: 13,
            }}
          >
            Belum ada temuan. Klik &quot;Tambah Temuan&quot; untuk memulai.
          </div>
        ) : (
          <div className="trial-findings-list">
            {sortedFindings.map((f, idx) => (
              <TrialFindingCard
                key={f.id}
                projectId={projectId}
                joId={joId}
                sessionId={session.id}
                finding={f}
                displayOrder={idx + 1}
                isFirst={idx === 0}
                isLast={idx === sortedFindings.length - 1}
                isHighlighted={highlightedFindingId === f.id}
                isOpen={expandedIds.has(f.id)}
                onToggleOpen={() => handleToggleFinding(f.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
