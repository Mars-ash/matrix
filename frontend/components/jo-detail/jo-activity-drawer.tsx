"use client";

import React from "react";
import type { ActivityEntry } from "@/lib/types";
import { ActivityPanel } from "@/components/activity-panel";

export interface JoActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities?: ActivityEntry[];
}

export function JoActivityDrawer({
  isOpen,
  onClose,
  activities,
}: JoActivityDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.15)",
          zIndex: 40,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: "100%",
          background: "var(--color-bg)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 200ms ease-out",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 18, margin: 0 }}>Activity & Problem Log</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "var(--color-text-secondary)",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          <ActivityPanel activities={activities ?? []} />
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
