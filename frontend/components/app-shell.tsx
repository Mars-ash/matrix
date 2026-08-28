"use client";
import React, { type ReactNode, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/store";
import type { JO } from "@/lib/types";

interface AppShellProps {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

interface NotifItem {
  id: string;
  label: string;
  joNumber: string;
  type: "h3" | "hday" | "overdue";
  daysText: string;
}

function buildNotifications(projects: { jos: JO[] }[]): NotifItem[] {
  const results: NotifItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const project of projects) {
    for (const jo of project.jos) {
      for (const cat of jo.categories) {
        for (const item of cat.items) {
          // 1. Subcont notifications
          if (item.isSubcont && item.arrivalTargetDate && item.subcontStatus !== "Done") {
            const target = new Date(item.arrivalTargetDate);
            target.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              results.push({
                id: `${item.id}-subcont`,
                label: `${item.description} (Subcont)`,
                joNumber: jo.joNumber,
                type: "overdue",
                daysText: `Overdue ${Math.abs(diffDays)}d`,
              });
            } else if (diffDays === 0) {
              results.push({
                id: `${item.id}-subcont`,
                label: `${item.description} (Subcont)`,
                joNumber: jo.joNumber,
                type: "hday",
                daysText: "Hari H",
              });
            } else if (diffDays <= 3) {
              results.push({
                id: `${item.id}-subcont`,
                label: `${item.description} (Subcont)`,
                joNumber: jo.joNumber,
                type: "h3",
                daysText: `H-${diffDays}`,
              });
            }
          }

          // 2. Material Arrival notifications
          for (const ctrl of item.controls) {
            if ((ctrl.process === "Arrival" || ctrl.process === "Material" || ctrl.process === "PO") && ctrl.targetDate && ctrl.status !== "Done") {
              const target = new Date(ctrl.targetDate);
              target.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (diffDays < 0) {
                results.push({
                  id: `${item.id}-${ctrl.process}`,
                  label: `${item.description} (PO Mtl)`,
                  joNumber: jo.joNumber,
                  type: "overdue",
                  daysText: `Overdue ${Math.abs(diffDays)}d`,
                });
              } else if (diffDays === 0) {
                results.push({
                  id: `${item.id}-${ctrl.process}`,
                  label: `${item.description} (PO Mtl)`,
                  joNumber: jo.joNumber,
                  type: "hday",
                  daysText: "Hari H",
                });
              } else if (diffDays <= 3) {
                results.push({
                  id: `${item.id}-${ctrl.process}`,
                  label: `${item.description} (PO Mtl)`,
                  joNumber: jo.joNumber,
                  type: "h3",
                  daysText: `H-${diffDays}`,
                });
              }
            }
          }
        }
      }
    }
  }

  const order = { overdue: 0, hday: 1, h3: 2 };
  results.sort((a, b) => order[a.type] - order[b.type]);
  return results;
}

function NotificationBell() {
  const { projects } = useAppState();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = buildNotifications(projects);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const typeColor = {
    overdue: "var(--color-status-problem)",
    hday: "var(--color-status-in-progress)",
    h3: "var(--color-status-in-progress)",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          borderRadius: 6,
          color: notifications.length > 0 ? "var(--color-text)" : "var(--color-text-muted)",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2a5 5 0 0 0-5 5c0 4-2 5-2 5h14s-2-1-2-5a5 5 0 0 0-5-5" />
          <path d="M8.5 17a1.5 1.5 0 0 0 3 0" />
        </svg>
        {notifications.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--color-status-problem)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 320,
            maxHeight: 360,
            overflowY: "auto",
            backgroundColor: "var(--color-bg-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--color-border)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Notifications
            {notifications.length > 0 && (
              <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>
                ({notifications.length})
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>
              No upcoming deadlines
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "8px 14px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {n.joNumber}
                  </div>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    color: typeColor[n.type],
                    backgroundColor: `color-mix(in srgb, ${typeColor[n.type]} 12%, transparent)`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.daysText}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Header */}
      <header className="top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/" className="header-brand">
            <span className="header-brand-title">MATRIX</span>
            <span className="header-brand-subtitle">PROJECT CONTROL</span>
          </Link>

          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/subcont" style={{ color: "var(--color-text)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Subcont Tracker
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NotificationBell />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Staff Engineering
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        {breadcrumbs && breadcrumbs.length > 1 && (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="separator">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span style={{ color: "var(--color-text)" }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {children}
      </main>
    </div>
  );
}
