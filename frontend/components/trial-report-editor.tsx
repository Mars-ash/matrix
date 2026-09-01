"use client";
import React, { useState, useCallback, useEffect } from "react";
import { TrialFindingCard } from "./trial-finding-card";
import { useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";
import { sortTrialFindings, deriveTrialSessionStatus } from "@/lib/trial-report";
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
  const sortedFindings = sortTrialFindings(session.findings);
  const derivedStatus = deriveTrialSessionStatus(session);

  // Set of expanded finding IDs (default: empty set -> all collapsed)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Reset expanded findings when session changes
  useEffect(() => {
    setExpandedIds(new Set());
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
      {/* Session identity */}
      <div className="trial-editor-identity">
        <div style={{ flex: 1, minWidth: 240, maxWidth: 460 }}>
          <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>
            Nama Session
          </label>
          <input
            className="input"
            type="text"
            value={session.name}
            onChange={(e) => updateSession({ name: e.target.value })}
            style={{ fontSize: 16, fontWeight: 700 }}
            placeholder="Masukkan nama session..."
          />
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
          <input
            className="input"
            type="date"
            value={session.trialDate}
            onChange={(e) => updateSession({ trialDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Update</label>
          <input
            className="input"
            type="date"
            value={session.updateDate}
            onChange={(e) => updateSession({ updateDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Customer</label>
          <input
            className="input"
            type="text"
            value={session.customer}
            onChange={(e) => updateSession({ customer: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Job No.</label>
          <input
            className="input"
            type="text"
            value={session.jobNo}
            onChange={(e) => updateSession({ jobNo: e.target.value })}
          />
        </div>
        <div>
          <label className="label">PIC</label>
          <input
            className="input"
            type="text"
            value={session.picName}
            onChange={(e) => updateSession({ picName: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Approved by</label>
          <input
            className="input"
            type="text"
            value={session.approvedByName}
            onChange={(e) => updateSession({ approvedByName: e.target.value })}
          />
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
          <button className="btn btn-primary btn-sm" onClick={handleAddFinding}>
            + Tambah Temuan
          </button>
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
