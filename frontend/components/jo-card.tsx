"use client";
import React from "react";
import Link from "next/link";
import type { JO } from "@/lib/types";
import { joProgress, joProblemCount } from "@/lib/progress";

interface JoCardProps {
  jo: JO;
  projectId: string;
  projectName?: string;
  customer?: string;
  onDelete?: (jo: JO) => void;
}

export function JoCard({ jo, projectId, projectName, customer, onDelete }: JoCardProps) {
  const progress = joProgress(jo);
  const problems = joProblemCount(jo);
  const pctText = progress === null ? "–" : `${Math.round(progress)}%`;

  return (
    <Link
      href={`/projects/${projectId}/jos/${jo.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top row: JO number + progress + delete */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{jo.joNumber}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: progress === null
                  ? "var(--color-text-muted)"
                  : progress === 100
                    ? "var(--color-status-done)"
                    : "var(--color-text-secondary)",
              }}
            >
              {pctText}
            </span>
            {onDelete && (
              <button
                type="button"
                className="jo-card-delete-btn"
                title="Hapus JO"
                aria-label={`Hapus ${jo.joNumber}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(jo);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "3px 4px",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color .1s, background .1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-status-problem)";
                  e.currentTarget.style.background = "var(--color-status-problem-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
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
