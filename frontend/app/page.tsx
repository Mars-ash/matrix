"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { JoCard } from "@/components/jo-card";
import { JoCreateDialog } from "@/components/jo-create-dialog";
import { ProjectCreateDialog } from "@/components/project-create-dialog";
import { NewItemMenu } from "@/components/new-item-menu";
import { NewDataDialog } from "@/components/new-data-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAppState, useAppDispatch } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { joProblemCount } from "@/lib/progress";
import type { Project, JO } from "@/lib/types";

export default function DashboardPage() {
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const { isController } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createJoProjectId, setCreateJoProjectId] = useState<string | undefined>(undefined);
  const [newDataOpen, setNewDataOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
  const [deleteJoTarget, setDeleteJoTarget] = useState<{ projectId: string; jo: JO } | null>(null);
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(new Set());

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
    projects.length > 0 &&
    projects.every((p) => collapsedProjectIds.has(p.id));

  const toggleAllProjects = () => {
    if (isAllCollapsed) {
      setCollapsedProjectIds(new Set());
    } else {
      setCollapsedProjectIds(new Set(projects.map((p) => p.id)));
    }
  };

  const filteredProjects = projects.map(p => {
    if (!searchQuery.trim()) return p;
    const q = searchQuery.toLowerCase();
    const projectMatches = p.name.toLowerCase().includes(q) ||
      p.customer.toLowerCase().includes(q) ||
      (p.company && p.company.toLowerCase().includes(q));
    const matchingJos = p.jos.filter(jo =>
      projectMatches ||
      jo.joNumber.toLowerCase().includes(q) ||
      jo.product.toLowerCase().includes(q) ||
      jo.type.toLowerCase().includes(q)
    );
    return { ...p, jos: matchingJos };
  }).filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const projectMatches = p.name.toLowerCase().includes(q) ||
      p.customer.toLowerCase().includes(q) ||
      (p.company && p.company.toLowerCase().includes(q));
    return projectMatches || p.jos.length > 0;
  });

  const allJos = filteredProjects.flatMap((p) => p.jos);
  const totalProblems = allJos.reduce((sum, jo) => sum + joProblemCount(jo), 0);

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard" }]}>
      {/* Header row */}
      <div className="dashboard-header">
        <div>
          <h1>Project Controlling</h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              marginTop: 2,
            }}
          >
            {projects.length} project{projects.length !== 1 ? "s" : ""} · {allJos.length} JO{allJos.length !== 1 ? "s" : ""}
            {totalProblems > 0 && (
              <span style={{ color: "var(--color-status-problem)", marginLeft: 8 }}>
                {totalProblems} problem{totalProblems !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="dashboard-controls">
          {projects.length > 0 && (
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
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 240, minWidth: 140, flex: "1 1 140px", maxWidth: 300 }}
          />
          {isController && (
            <NewItemMenu
              onNewProject={() => setCreateProjectOpen(true)}
              onNewJo={() => setCreateOpen(true)}
              onNewData={() => setNewDataOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Project sections */}
      {filteredProjects.map((project) => {
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
              aria-label={`${isCollapsed ? "Buka" : "Tutup"} daftar JO ${project.name}`}
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
                {project.customer} · {project.jos.length} JO{project.jos.length !== 1 ? "s" : ""}
              </span>
              {isController && (
                <button
                  type="button"
                  className="project-delete-btn"
                  title={`Hapus project ${project.name}`}
                  aria-label={`Hapus project ${project.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteProjectTarget(project);
                  }}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "3px 6px",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text-muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    transition: "color .1s, background .1s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-status-problem)";
                    e.currentTarget.style.background = "var(--color-status-problem-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Hapus</span>
                </button>
              )}
            </div>

            {!isCollapsed && (
              project.jos.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: 12,
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  No JOs yet
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
                    gap: 10,
                  }}
                >
                  {project.jos.map((jo) => (
                    <JoCard
                      key={jo.id}
                      jo={jo}
                      projectId={project.id}
                      projectName={project.name}
                      customer={project.customer}
                      onDelete={
                        isController
                          ? (targetJo) => setDeleteJoTarget({ projectId: project.id, jo: targetJo })
                          : undefined
                      }
                    />
                  ))}
                </div>
              )
            )}
          </section>
        );
      })}

      {filteredProjects.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: 13,
          }}
        >
          {projects.length === 0
            ? "No projects yet. Create one to get started."
            : "No projects or JOs match your search."}
        </div>
      )}

      <ProjectCreateDialog
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={(newId) => {
          setCreateProjectOpen(false);
          setCreateJoProjectId(newId);
          setCreateOpen(true);
        }}
      />
      <JoCreateDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateJoProjectId(undefined);
        }}
        projectId={createJoProjectId}
      />
      <NewDataDialog
        open={newDataOpen}
        onClose={() => setNewDataOpen(false)}
      />

      {/* Confirm Delete Project */}
      <ConfirmDialog
        open={!!deleteProjectTarget}
        onClose={() => setDeleteProjectTarget(null)}
        onConfirm={() => {
          if (deleteProjectTarget) {
            dispatch({ type: "DELETE_PROJECT", projectId: deleteProjectTarget.id });
            setDeleteProjectTarget(null);
          }
        }}
        title="Hapus Project"
        message={
          deleteProjectTarget ? (
            <span>
              Hapus project <strong>{deleteProjectTarget.name}</strong> dan seluruh isinya?
            </span>
          ) : null
        }
        confirmText="Hapus"
      />

      {/* Confirm Delete JO */}
      <ConfirmDialog
        open={!!deleteJoTarget}
        onClose={() => setDeleteJoTarget(null)}
        onConfirm={() => {
          if (deleteJoTarget) {
            dispatch({
              type: "DELETE_JO",
              projectId: deleteJoTarget.projectId,
              joId: deleteJoTarget.jo.id,
            });
            setDeleteJoTarget(null);
          }
        }}
        title="Hapus Job Order"
        message={
          deleteJoTarget ? (
            <span>
              Hapus JO <strong>{deleteJoTarget.jo.joNumber}</strong> ({deleteJoTarget.jo.product})?
            </span>
          ) : null
        }
        confirmText="Hapus"
      />
    </AppShell>
  );
}
