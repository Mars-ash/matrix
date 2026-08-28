"use client";
import React, { type ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        color: "var(--color-text-muted)",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: 11, maxWidth: 280, marginBottom: 10 }}>{description}</p>
      )}
      {action}
    </div>
  );
}
