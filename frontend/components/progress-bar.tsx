"use client";
import React from "react";

interface ProgressBarProps {
  /** 0-100, or null for '-' (all N/A). */
  value: number | null;
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  if (value === null) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: "var(--color-bg-hover)",
          }}
        />
        <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>-</span>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped === 100
      ? "var(--color-status-done)"
      : clamped >= 50
        ? "var(--color-status-in-progress)"
        : "var(--color-accent)";

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: "var(--color-bg-hover)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            transition: "width 300ms ease",
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
