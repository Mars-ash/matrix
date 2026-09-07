"use client";
import React, { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { JoCard } from "@/components/jo-card";
import { JoCreateDialog } from "@/components/jo-create-dialog";
import { ProjectCreateDialog } from "@/components/project-create-dialog";
import { NewItemMenu } from "@/components/new-item-menu";
import { NewDataDialog } from "@/components/new-data-dialog";
import { useAppState } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { joProblemCount } from "@/lib/progress";

export default function DashboardPage() {
  const { projects } = useAppState();
  const { isController } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createJoProjectId, setCreateJoProjectId] = useState<string | undefined>(undefined);
  const [newDataOpen, setNewDataOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      {filteredProjects.map((project) => (
        <section key={project.id} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "1px solid var(--color-border)",
              flexWrap: "wrap",
            }}
          >
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
          </div>

          {project.jos.length === 0 ? (
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
                />
              ))}
            </div>
          )}
        </section>
      ))}

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
    </AppShell>
  );
}
