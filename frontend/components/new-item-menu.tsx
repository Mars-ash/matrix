"use client";
import React, { useState, useRef, useEffect } from "react";

interface NewItemMenuProps {
  onNewProject: () => void;
  onNewJo: () => void;
  onNewData: () => void;
}

export function NewItemMenu({ onNewProject, onNewJo, onNewData }: NewItemMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
        + New Item
      </button>
      {open && (
        <div className="new-item-menu">
          <button
            className="new-item-menu-option"
            onClick={() => { setOpen(false); onNewProject(); }}
          >
            <span style={{ fontSize: 14 }}></span>
            <span>New Project</span>
          </button>
          <button
            className="new-item-menu-option"
            onClick={() => { setOpen(false); onNewJo(); }}
          >
            <span style={{ fontSize: 14 }}></span>
            <span>New JO</span>
          </button>
          <div style={{ height: 1, background: "var(--color-border-subtle)", margin: "2px 0" }} />
          <button
            className="new-item-menu-option"
            onClick={() => { setOpen(false); onNewData(); }}
          >
            <span style={{ fontSize: 14 }}></span>
            <span>New Data</span>
          </button>
        </div>
      )}
    </div>
  );
}
