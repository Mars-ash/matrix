"use client";
import React, { type ReactNode, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/lib/types";

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
  category: "subcont" | "po";
  href: string;
  subText: string;
}

function buildNotifications(projects: Project[]): NotifItem[] {
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

            const supplierLabel = item.subcontSupplier ? ` · ${item.subcontSupplier}` : "";
            const href = `/subcont?item=${item.id}#subcont-item-${item.id}`;

            if (diffDays < 0) {
              results.push({
                id: `${item.id}-subcont`,
                label: item.description,
                joNumber: jo.joNumber,
                type: "overdue",
                daysText: `Overdue ${Math.abs(diffDays)}d`,
                category: "subcont",
                href,
                subText: `JO ${jo.joNumber} · Subcont${supplierLabel}`,
              });
            } else if (diffDays === 0) {
              results.push({
                id: `${item.id}-subcont`,
                label: item.description,
                joNumber: jo.joNumber,
                type: "hday",
                daysText: "Hari H",
                category: "subcont",
                href,
                subText: `JO ${jo.joNumber} · Subcont${supplierLabel}`,
              });
            } else if (diffDays <= 3) {
              results.push({
                id: `${item.id}-subcont`,
                label: item.description,
                joNumber: jo.joNumber,
                type: "h3",
                daysText: `H-${diffDays}`,
                category: "subcont",
                href,
                subText: `JO ${jo.joNumber} · Subcont${supplierLabel}`,
              });
            }
          }

          // 2. Material Arrival notifications
          for (const ctrl of item.controls) {
            if ((ctrl.process === "Arrival" || ctrl.process === "Material" || ctrl.process === "PO") && ctrl.targetDate && ctrl.status !== "Done") {
              const target = new Date(ctrl.targetDate);
              target.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const href = `/po-tracker?item=${item.id}#po-item-${item.id}`;
              const supplierInfo = ctrl.poTracking?.supplier ? ` · ${ctrl.poTracking.supplier}` : "";

              if (diffDays < 0) {
                results.push({
                  id: `${item.id}-${ctrl.process}`,
                  label: item.description,
                  joNumber: jo.joNumber,
                  type: "overdue",
                  daysText: `Overdue ${Math.abs(diffDays)}d`,
                  category: "po",
                  href,
                  subText: `JO ${jo.joNumber} · PO / Material${supplierInfo}`,
                });
              } else if (diffDays === 0) {
                results.push({
                  id: `${item.id}-${ctrl.process}`,
                  label: item.description,
                  joNumber: jo.joNumber,
                  type: "hday",
                  daysText: "Hari H",
                  category: "po",
                  href,
                  subText: `JO ${jo.joNumber} · PO / Material${supplierInfo}`,
                });
              } else if (diffDays <= 3) {
                results.push({
                  id: `${item.id}-${ctrl.process}`,
                  label: item.description,
                  joNumber: jo.joNumber,
                  type: "h3",
                  daysText: `H-${diffDays}`,
                  category: "po",
                  href,
                  subText: `JO ${jo.joNumber} · PO / Material${supplierInfo}`,
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
  const [activeTab, setActiveTab] = useState<"po" | "subcont">("po");
  const ref = useRef<HTMLDivElement>(null);
  const notifications = buildNotifications(projects);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const poNotifications = notifications.filter((n) => n.category === "po");
  const subcontNotifications = notifications.filter((n) => n.category === "subcont");
  const activeList = activeTab === "po" ? poNotifications : subcontNotifications;

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
        <div className="notif-popover">
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--color-border)",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span style={{ fontWeight: 500, color: "var(--color-text-muted)", fontSize: 11 }}>
                  ({notifications.length})
                </span>
              )}
            </div>

            {/* Switch Button PO / Subcont */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--color-bg)",
                padding: 2,
                borderRadius: "var(--radius-sm, 6px)",
                border: "1px solid var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("po")}
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: activeTab === "po" ? 700 : 500,
                  color: activeTab === "po" ? "var(--color-text)" : "var(--color-text-muted)",
                  backgroundColor: activeTab === "po" ? "var(--color-bg-raised)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  boxShadow: activeTab === "po" ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                  transition: "all 120ms ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                PO
                {poNotifications.length > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      backgroundColor: "color-mix(in srgb, var(--color-status-problem) 18%, transparent)",
                      color: "var(--color-status-problem)",
                      padding: "0 4px",
                      borderRadius: 8,
                      minWidth: 14,
                      textAlign: "center",
                    }}
                  >
                    {poNotifications.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("subcont")}
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: activeTab === "subcont" ? 700 : 500,
                  color: activeTab === "subcont" ? "var(--color-text)" : "var(--color-text-muted)",
                  backgroundColor: activeTab === "subcont" ? "var(--color-bg-raised)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  boxShadow: activeTab === "subcont" ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                  transition: "all 120ms ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                SC
                {subcontNotifications.length > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      backgroundColor: "color-mix(in srgb, var(--color-status-problem) 18%, transparent)",
                      color: "var(--color-status-problem)",
                      padding: "0 4px",
                      borderRadius: 8,
                      minWidth: 14,
                      textAlign: "center",
                    }}
                  >
                    {subcontNotifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeList.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>
              {activeTab === "po" ? "Tidak ada deadline PO mendekati" : "Tidak ada deadline SC mendekati"}
            </div>
          ) : (
            activeList.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--color-border-subtle, var(--color-border))",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 80ms ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 3,
                    }}
                  >
                    {n.category === "subcont" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--color-accent)" }}>
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--color-text-muted)" }}>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.subText}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: typeColor[n.type],
                      backgroundColor: `color-mix(in srgb, ${typeColor[n.type]} 14%, transparent)`,
                      padding: "2px 8px",
                      borderRadius: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.daysText}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))
          )}

          {/* Popover Footer link */}
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg)",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Link
              href={activeTab === "po" ? "/po-tracker" : "/subcont"}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11,
                color: "var(--color-accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {activeTab === "po" ? "Buka PO Tracker →" : "Buka SC Tracker →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  const { user, role, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }} suppressHydrationWarning>
      {/* Top Header */}
      <header className="top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" className="header-brand">
            <span className="header-brand-title">MATRIX</span>
            <span className="header-brand-subtitle">PROJECT CONTROL</span>
          </Link>

          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/po-tracker" style={{ color: "var(--color-text)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
              PO Tracker
            </Link>
            <Link href="/subcont" style={{ color: "var(--color-text)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
              SC Tracker
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="header-user-badge" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                {user?.name || (role === "controller" ? "Staff Engineering" : "Viewer")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
              }}
              title="Sign Out"
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                fontSize: 12,
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-status-problem)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
            >
              Sign Out
            </button>
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
