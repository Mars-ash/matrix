"use client";
import React from "react";
import Link from "next/link";
import type { JO } from "@/lib/types";
import { joProgress, joProblemCount } from "@/lib/progress";

interface JoCardProps {
  jo: JO;
  projectId: string;
}

export function JoCard({ jo, projectId }: JoCardProps) {
  const progress = joProgress(jo);
  const problems = joProblemCount(jo);
  const pctText = progress === null ? "–" : `${Math.round(progress)}%`;

  return (
    <Link
      href={`/projects/${projectId}/jos/${jo.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top row: JO number + progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{jo.joNumber}</span>
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
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {jo.product}
        </div>

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
