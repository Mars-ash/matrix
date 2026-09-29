"use client";
import React from "react";
import Link from "next/link";
import type { JO } from "@/lib/types";
import { joProgress, joProblemCount } from "@/lib/progress";

export function formatFinishDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y.slice(-2)}`;
    }
    const [d, m, y] = parts;
    return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y.slice(-2)}`;
  }
  return dateStr;
}

interface ArchiveJoCardProps {
  jo: JO;
  projectId: string;
  projectName?: string;
  customer?: string;
  onRestore?: (jo: JO) => void;
}

export function ArchiveJoCard({
  jo,
  projectId,
  projectName,
  customer,
  onRestore,
}: ArchiveJoCardProps) {
  const progress = joProgress(jo);
  const problems = joProblemCount(jo);
  const pctText = progress === null ? "–" : `${Math.round(progress)}%`;

  return (
    <Link
      href={`/projects/${projectId}/jos/${jo.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top row: JO number + progress + finish date badge + restore button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{jo.joNumber}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color:
                  progress === null
                    ? "var(--color-text-muted)"
                    : progress === 100
                      ? "var(--color-status-done)"
                      : "var(--color-text-secondary)",
              }}
            >
              {pctText}
            </span>

            {jo.finishDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--color-status-done)",
                  background: "rgba(13, 124, 74, 0.08)",
                  border: "1px solid rgba(13, 124, 74, 0.25)",
                  padding: "1px 5px",
                  borderRadius: "var(--radius-sm)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{formatFinishDate(jo.finishDate)}</span>
              </span>
            )}

            {onRestore && (
              <button
                type="button"
                className="jo-card-restore-btn"
                title={`Restore JO ${jo.joNumber} ke aktif`}
                aria-label={`Restore ${jo.joNumber}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRestore(jo);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-secondary)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  transition: "color .1s, background .1s, border-color .1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-status-done)";
                  e.currentTarget.style.background = "rgba(13, 124, 74, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(13, 124, 74, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Restore</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress track — thin, no rounded pill */}
        {progress !== null && (
          <div
            style={{
              height: 3,
              background: "var(--color-bg-hover)",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(0, Math.min(100, progress))}%`,
                background:
                  progress === 100
                    ? "var(--color-status-done)"
                    : progress >= 50
                      ? "var(--color-status-in-progress)"
                      : "var(--color-accent)",
                borderRadius: 1,
                transition: "width 200ms ease",
              }}
            />
          </div>
        )}

        {/* Product name */}
        <div style={{ fontSize: 12, color: "var(--color-text)", fontWeight: 500 }}>
          {jo.product}
        </div>

        {/* Project & Customer */}
        {(projectName || customer) && (
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {projectName && (
              <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                {projectName}
              </span>
            )}
            {projectName && customer && <span style={{ opacity: 0.6 }}>·</span>}
            {customer && <span>{customer}</span>}
          </div>
        )}

        {/* Footer: type + problems */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "var(--color-text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {jo.type}
          </span>

          {problems > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--color-status-problem)",
                background: "var(--color-status-problem-bg)",
                padding: "1px 5px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {problems} problem{problems > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
