"use client";
import React from "react";
import type { ActivityEntry } from "@/lib/types";

interface ActivityPanelProps {
  activities: ActivityEntry[];
}

export function ActivityPanel({ activities }: ActivityPanelProps) {
  if (activities.length === 0) {
    return (
      <div style={{ padding: 12, color: "var(--color-text-muted)", fontSize: 11 }}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {activities.map((entry, idx) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            gap: 10,
            padding: "7px 0",
            borderBottom:
              idx < activities.length - 1
                ? "1px solid var(--color-border-subtle)"
                : "none",
            fontSize: 12,
          }}
        >
          <span
            style={{
              color: "var(--color-text-muted)",
              fontSize: 10,
              whiteSpace: "nowrap",
              minWidth: 110,
              fontVariantNumeric: "tabular-nums",
              paddingTop: 1,
            }}
          >
            {new Date(entry.timestamp).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span
            style={{
              color: entry.message.includes("Problem")
                ? "var(--color-status-problem)"
                : "var(--color-text)",
            }}
          >
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
}
