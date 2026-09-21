"use client";
import React from "react";
import Link from "next/link";
import type { JO } from "@/lib/types";
import { joProgress } from "@/lib/progress";

interface ArchiveJoCardProps {
  jo: JO;
  projectId: string;
  projectName?: string;
  customer?: string;
  onRestore?: (jo: JO) => void;
}

export function ArchiveJoCard({ jo, projectId, projectName, customer, onRestore }: ArchiveJoCardProps) {
  const progress = joProgress(jo);
  const pctText = progress === null ? "–" : `${Math.round(progress)}%`;

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: 0.95,
        transition: "border-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.borderColor = "var(--color-border-hover, var(--color-border))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.95";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {/* Top row: JO Number + Type Badge + Finish Date */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{jo.joNumber}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-hover)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                letterSpacing: "0.02em",
              }}
            >
              {jo.type}
            </span>
          </div>
        </div>

        {jo.finishDate && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-status-done)",
              background: "rgba(13, 124, 74, 0.08)",
              border: "1px solid rgba(13, 124, 74, 0.25)",
              padding: "2px 7px",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="11"
              height="11"
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
            Selesai: {jo.finishDate}
          </span>
        )}
      </div>

      {/* Product & customer metadata */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
          {jo.product}
        </div>
        {(customer || projectName) && (
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
            {[customer, projectName].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>

      {/* Progress mini track */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Progress Akhir</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: "var(--color-status-done)",
            }}
          >
            {pctText}
          </span>
        </div>
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
              width: `${progress ?? 0}%`,
              background: "var(--color-status-done)",
              borderRadius: 1,
            }}
          />
        </div>
      </div>

      {/* Action footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          borderTop: "1px solid var(--color-border)",
          marginTop: 2,
        }}
      >
        <Link
          href={`/projects/${projectId}/jos/${jo.id}`}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-accent, #3b82f6)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>Buka JO</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {onRestore && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRestore(jo);
            }}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: 11,
              padding: "3px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--color-text-secondary)",
            }}
            title={`Kembalikan JO ${jo.joNumber} ke status aktif`}
          >
            <svg
              width="12"
              height="12"
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
  );
}
