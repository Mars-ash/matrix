"use client";
import React, { useState, useCallback, useMemo, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TrialReportSessionList } from "@/components/trial-report-session-list";
import { TrialReportEditor } from "@/components/trial-report-editor";
import { TrialReportMatrixView } from "@/components/trial-report-matrix-view";
import { TrialSmartSearch } from "@/components/trial-smart-search";
import { TrialSessionFormDialog } from "@/components/trial-session-form-dialog";
import { useAppState, useAppDispatch } from "@/lib/store";
import { uid } from "@/lib/format";
import {
  cloneTrialSessionWithoutPhotos,
} from "@/lib/trial-report";
import type { TrialSession } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ projectId: string; joId: string }>;
}

export default function TrialReportsPage({ params }: PageProps) {
  const { projectId, joId } = use(params);
  const { projects } = useAppState();
  const dispatch = useAppDispatch();
  const { isController, isViewer } = useAuth();

  const project = projects.find((p) => p.id === projectId)
    || projects.find((p) => p.jos.some((j) => j.id === joId || j.joNumber === joId));
  const jo = project?.jos.find((j) => j.id === joId || j.joNumber === joId);

  const sessions = useMemo(() => jo?.trialSessions ?? [], [jo?.trialSessions]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);
  const [printSelectedIds, setPrintSelectedIds] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  // Keep selection valid
  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;
  useEffect(() => {
    if ((!selectedId || !sessions.some((s) => s.id === selectedId)) && sessions.length > 0) {
      setSelectedId(sessions[0].id);
    }
  }, [selectedId, sessions]);

  // Handle smart search jump to session and finding
  const handleSmartSearchSelect = useCallback(
    (sessionId: string, findingId?: string) => {
      setSelectedId(sessionId);
      if (findingId) {
        setHighlightedFindingId(findingId);
        // Wait a frame for the editor to render if session changed
        setTimeout(() => {
          const el = document.getElementById(`finding-${findingId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 120);
      }
    },
    []
  );

  // Clear highlight after animation completes
  useEffect(() => {
    if (!highlightedFindingId) return;
    const timer = setTimeout(() => setHighlightedFindingId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightedFindingId]);

  const handleCreateSubmit = useCallback(
    (prefix: string, trialDate: string, generatedName: string) => {
      const now = new Date().toISOString();
      const newSession: TrialSession = {
        id: uid(),
        joId,
        name: generatedName,
        trialDate,
        updateDate: trialDate,
        customer: project?.customer ?? "",
        jobNo: jo?.joNumber ?? "",
        picName: "",
        approvedByName: "",
        findings: [],
        createdAt: now,
        updatedAt: now,
      };
      dispatch({
        type: "CREATE_TRIAL_SESSION",
        projectId,
        joId,
        session: newSession,
      });
      setSelectedId(newSession.id);
    },
    [dispatch, projectId, joId, project?.customer, jo?.joNumber]
  );

  const handleDuplicateSubmit = useCallback(
    (prefix: string, trialDate: string, generatedName: string) => {
      const sourceSession = selectedSession ?? sessions[sessions.length - 1];
      if (!sourceSession) return;

      const duplicated = cloneTrialSessionWithoutPhotos(sourceSession, {
        name: generatedName,
        trialDate,
        updateDate: trialDate,
      });

      dispatch({
        type: "DUPLICATE_TRIAL_SESSION",
        projectId,
        joId,
        sourceSessionId: sourceSession.id,
        session: duplicated,
      });
      setSelectedId(duplicated.id);
    },
    [dispatch, projectId, joId, selectedSession, sessions]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      dispatch({
        type: "DELETE_TRIAL_SESSION",
        projectId,
        joId,
        sessionId,
      });
      // Clean up print selection
      setPrintSelectedIds((prev) => prev.filter((id) => id !== sessionId));
      // If we deleted the selected one, select another
      if (selectedId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [dispatch, projectId, joId, selectedId, sessions]
  );

  const handleTogglePrintSelect = useCallback((sessionId: string) => {
    setPrintSelectedIds((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  }, []);

  if (!project || !jo) {
    return (
      <AppShell breadcrumbs={[{ label: "Trial Reports" }]}>
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
          <p>Loading Trial Reports...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: project.name, href: "/" },
        {
          label: `JO ${jo.joNumber}`,
          href: `/projects/${projectId}/jos/${joId}`,
        },
        { label: "Trial Reports" },
      ]}
    >
      {/* JO Context header + Separate Smart Search Bar */}
      <div className="trial-page-context">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Trial Reports — JO {jo.joNumber}
          </h1>
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginLeft: 8,
            }}
          >
            {jo.product} · {project.customer} · {jo.type}
          </span>
        </div>

        {/* Dedicated Search Bar */}
        <div className="trial-page-search-wrapper">
          <TrialSmartSearch
            sessions={sessions}
            onSelectResult={handleSmartSearchSelect}
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="trial-page-layout">
        <TrialReportSessionList
          projectId={projectId}
          joId={joId}
          sessions={sessions}
          selectedId={selectedId}
          onSelectSession={setSelectedId}
          printSelectedIds={printSelectedIds}
          onTogglePrintSelect={handleTogglePrintSelect}
          onCreateNew={() => setCreateDialogOpen(true)}
          onDuplicate={() => setDuplicateDialogOpen(true)}
          onDeleteSession={handleDeleteSession}
        />

        <div className="trial-page-editor-area">
          {selectedSession ? (
            isViewer ? (
              <TrialReportMatrixView
                session={selectedSession}
                joProduct={jo.product}
              />
            ) : (
              <TrialReportEditor
                projectId={projectId}
                joId={joId}
                session={selectedSession}
                highlightedFindingId={highlightedFindingId}
              />
            )
          ) : (
            <div className="trial-page-empty">
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                  Belum ada trial session
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                    marginBottom: 16,
                  }}
                >
                  {isController
                    ? "Buat trial session baru untuk mulai mencatat hasil trial."
                    : "Belum ada catatan hasil trial untuk JO ini."}
                </p>
                {isController && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Buat Trial Baru
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TrialSessionFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        mode="create"
        onSubmit={handleCreateSubmit}
      />
      <TrialSessionFormDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        mode="duplicate"
        defaultPrefix={
          selectedSession
            ? selectedSession.name.replace(/\s*\d{6}$/, "")
            : ""
        }
        onSubmit={handleDuplicateSubmit}
      />
    </AppShell>
  );
}
