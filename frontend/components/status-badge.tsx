"use client";
import React from "react";
import type { ControlStatus } from "@/lib/types";

const STATUS_STYLES: Record<ControlStatus, { bg: string; text: string; label: string }> = {
  "-":            { bg: "var(--color-status-na-bg)",           text: "var(--color-status-na)",           label: "-" },
  "Not Started":  { bg: "var(--color-status-not-started-bg)",  text: "var(--color-status-not-started)",  label: "Not Started" },
  "In Progress":  { bg: "var(--color-status-in-progress-bg)",  text: "var(--color-status-in-progress)",  label: "In Progress" },
  "In Progress SC": { bg: "var(--color-status-in-progress-bg)", text: "var(--color-status-in-progress)", label: "In Progress SC" },
  "Done":         { bg: "var(--color-status-done-bg)",         text: "var(--color-status-done)",         label: "Done" },
  "Problem":      { bg: "var(--color-status-problem-bg)",      text: "var(--color-status-problem)",      label: "Problem" },
};

interface StatusBadgeProps {
  status: ControlStatus;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusBadge({ status, className = "", style }: StatusBadgeProps) {
  const styleObj = STATUS_STYLES[status];
  return (
    <span
      className={`badge ${className}`}
      style={{ background: styleObj.bg, color: styleObj.text, ...style }}
      data-status={status}
    >
      {styleObj.label}
    </span>
  );
}
