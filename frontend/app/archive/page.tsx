"use client";
import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArchiveJoCard } from "@/components/archive-jo-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAppState, useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { JO } from "@/lib/types";

export default function ArchivePage() {
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<{ projectId: string; jo: JO } | null>(null);
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(new Set());

  // Segregate to only archived (finished) JOs
  const archivedProjects = projects
    .map((p) => {
      const finishedJos = p.jos.filter((jo) => Boolean(jo.finishDate));
      return { ...p, jos: finishedJos };
    })
    .filter((p) => p.jos.length > 0);

  const toggleProject = (projectId: string) => {
    setCollapsedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const isAllCollapsed =
    archivedProjects.length > 0 &&
    archivedProjects.every((p) => collapsedProjectIds.has(p.id));

  const toggleAllProjects = () => {
    if (isAllCollapsed) {
      setCollapsedProjectIds(new Set());
    } else {
      setCollapsedProjectIds(new Set(archivedProjects.map((p) => p.id)));
    }
  };

  const filteredArchivedProjects = archivedProjects
    .map((p) => {
      if (!searchQuery.trim()) return p;
      const q = searchQuery.toLowerCase();
      const projectMatches =
        p.name.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q) ||
        (p.company && p.company.toLowerCase().includes(q));
      const matchingJos = p.jos.filter(
        (jo) =>
          projectMatches ||
          jo.joNumber.toLowerCase().includes(q) ||
          jo.product.toLowerCase().includes(q) ||
          jo.type.toLowerCase().includes(q)
      );
      return { ...p, jos: matchingJos };
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const projectMatches =
        p.name.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q) ||
        (p.company && p.company.toLowerCase().includes(q));
      return projectMatches || p.jos.length > 0;
    });

  const allArchivedJos = filteredArchivedProjects.flatMap((p) => p.jos);

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Archive" }]}>
      {/* Header row */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ margin: 0 }}>Archive — Project</h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              marginTop: 4,
            }}
          >
            {filteredArchivedProjects.length} project{filteredArchivedProjects.length !== 1 ? "s" : ""} · {allArchivedJos.length} completed JO{allArchivedJos.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="dashboard-controls">
          <Link
            href="/"
            className="btn btn-secondary btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              fontSize: 12,
              padding: "4px 10px",
              whiteSpace: "nowrap",
            }}
            title="Kembali ke dashboard utama pekerjaan aktif"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Kembali ke Dashboard</span>
          </Link>

          {archivedProjects.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleAllProjects}
              style={{ fontSize: 12, padding: "4px 10px", whiteSpace: "nowrap" }}
              title={isAllCollapsed ? "Buka semua daftar JO" : "Tutup semua daftar JO"}
            >
              {isAllCollapsed ? "Buka Semua" : "Tutup Semua"}
            </button>
          )}

          <input
            className="input"
            placeholder="Cari arsip JO / project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 240, minWidth: 140, flex: "1 1 140px", maxWidth: 300 }}
          />
        </div>
      </div>

      {/* Project sections */}
      {filteredArchivedProjects.map((project) => {
        const isCollapsed = !searchQuery.trim() && collapsedProjectIds.has(project.id);
        return (
          <section key={project.id} style={{ marginBottom: isCollapsed ? 12 : 28 }}>
            <div
              className={`project-section-header ${isCollapsed ? "is-collapsed" : ""}`}
              onClick={() => toggleProject(project.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleProject(project.id);
                }
              }}
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? "Buka" : "Tutup"} daftar arsip JO ${project.name}`}
            >
              <span
                className={`project-toggle-chevron ${isCollapsed ? "is-collapsed" : ""}`}
                aria-hidden="true"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 8 10 12 14 8" />
                </svg>
              </span>
              <h2 style={{ margin: 0 }}>{project.name}</h2>
              {project.company && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "var(--radius-sm)",
                    background: project.company === "BMI" ? "var(--color-status-done-bg)" : "var(--color-status-not-started-bg)",
                    color: project.company === "BMI" ? "var(--color-status-done)" : "var(--color-status-not-started)",
                    border: `1px solid ${project.company === "BMI" ? "rgba(13, 124, 74, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                    letterSpacing: "0.04em",
                  }}
                >
                  {project.company}
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                {project.customer} · {project.jos.length} JO selesai
              </span>
            </div>

            {!isCollapsed && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
                  gap: 10,
                }}
              >
                {project.jos.map((jo) => (
                  <ArchiveJoCard
                    key={jo.id}
                    jo={jo}
                    projectId={project.id}
                    projectName={project.name}
                    customer={project.customer}
                    onRestore={
                      isController
                        ? (targetJo) => setRestoreTarget({ projectId: project.id, jo: targetJo })
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {filteredArchivedProjects.length === 0 && (
        <div
          style={{
            padding: "50px 20px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: 13,
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-lg)",
            marginTop: 12,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto", opacity: 0.4 }}
            >
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </div>
          {archivedProjects.length === 0
            ? "Belum ada project atau Job Order yang diarsipkan. Job Order yang diselesaikan akan otomatis muncul di halaman ini."
            : "Tidak ada data arsip yang sesuai dengan pencarian."}
        </div>
      )}

      {/* Restore confirmation dialog */}
      <ConfirmDialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (restoreTarget) {
            dispatch({
              type: "RESTORE_JO",
              projectId: restoreTarget.projectId,
              joId: restoreTarget.jo.id,
            });
            setRestoreTarget(null);
          }
        }}
        title="Kembalikan ke Status Aktif"
        message={`Kembalikan JO ${restoreTarget?.jo.joNumber} (${restoreTarget?.jo.product}) ke Dashboard aktif? Tanggal selesai akan dihapus.`}
        confirmText="Kembalikan ke Aktif"
        cancelText="Batal"
        destructive={false}
      />
    </AppShell>
  );
}
