"use client";
import React from "react";
import Link from "next/link";
import { deriveTrialSessionStatus, formatDateDDMMYYYY } from "@/lib/trial-report";
import type { TrialSession } from "@/lib/types";

interface TrialReportSessionListProps {
  projectId: string;
  joId: string;
  sessions: TrialSession[];
  selectedId: string | null;
  onSelectSession: (id: string) => void;
  printSelectedIds: string[];
  onTogglePrintSelect: (id: string) => void;
  onCreateNew: () => void;
  onDuplicate: () => void;
  onDeleteSession: (id: string) => void;
}

export function TrialReportSessionList({
  projectId,
  joId,
  sessions,
  selectedId,
  onSelectSession,
  printSelectedIds,
  onTogglePrintSelect,
  onCreateNew,
  onDuplicate,
  onDeleteSession,
}: TrialReportSessionListProps) {
  const printQuery = printSelectedIds
    .map((id) => `sessions=${encodeURIComponent(id)}`)
    .join("&");

  const handleDelete = (sessionId: string, sessionName: string) => {
    if (!confirm(`Hapus trial session "${sessionName}"?`)) return;
    onDeleteSession(sessionId);
  };

  return (
    <div className="trial-session-list">
      <div className="trial-session-list-header">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
          Trial Sessions
        </h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={onCreateNew}>
            Buat Trial Baru
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onDuplicate}
            disabled={sessions.length === 0}
          >
            Duplikat Trial Sebelumnya
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px 12px",
            color: "var(--color-text-muted)",
            fontSize: 13,
          }}
        >
          Belum ada trial session.
        </div>
      ) : (
        <div className="trial-session-items">
          {sessions.map((session) => {
            const isSelected = session.id === selectedId;
            const isPrintSelected = printSelectedIds.includes(session.id);
            const status = deriveTrialSessionStatus(session);

            return (
              <div
                key={session.id}
                className={`trial-session-item ${
                  isSelected ? "trial-session-item-selected" : ""
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={isPrintSelected}
                    style={{ flexShrink: 0, cursor: "pointer" }}
                    onChange={(e) => {
                      e.stopPropagation();
                      onTogglePrintSelect(session.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="Pilih untuk print"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={session.name}
                    >
                      {session.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateDDMMYYYY(session.trialDate)} · {session.findings.length} temuan
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span
                    className={`trial-status-badge-sm ${
                      status === "Close"
                        ? "trial-status-close"
                        : "trial-status-on-process"
                    }`}
                  >
                    {status}
                  </span>
                  <button
                    className="trial-session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id, session.name);
                    }}
                    title="Hapus session"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print action */}
      {sessions.length > 0 && (
        <div className="trial-session-list-footer">
          {printSelectedIds.length > 0 ? (
            <Link
              href={`/projects/${projectId}/jos/${joId}/trial-reports/print?${printQuery}`}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none", width: "100%" }}
            >
              🖨️ Print Terpilih ({printSelectedIds.length})
            </Link>
          ) : (
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                textAlign: "center",
                display: "block",
              }}
            >
              Centang session untuk print
            </span>
          )}
        </div>
      )}
    </div>
  );
}
