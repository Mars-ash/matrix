"use client";
import React, { use } from "react";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TrialReportPrintView } from "@/components/trial-report-print-view";
import { useAppState } from "@/lib/store";

interface PageProps {
  params: Promise<{ projectId: string; joId: string }>;
}

export default function TrialReportPrintPage({ params }: PageProps) {
  const { projectId, joId } = use(params);
  const searchParams = useSearchParams();
  const { projects } = useAppState();

  const project = projects.find((p) => p.id === projectId)
    || projects.find((p) => p.jos.some((j) => j.id === joId || j.joNumber === joId))
    || projects[0];
  const jo = project?.jos.find((j) => j.id === joId || j.joNumber === joId)
    || project?.jos[0];

  if (!project || !jo) {
    notFound();
  }

  const sessionIds = searchParams.getAll("sessions");
  const allSessions = jo.trialSessions ?? [];
  const selectedSessions =
    sessionIds.length > 0
      ? allSessions.filter((s) => sessionIds.includes(s.id))
      : [];

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: project.name, href: "/" },
        {
          label: `JO ${jo.joNumber}`,
          href: `/projects/${projectId}/jos/${joId}`,
        },
        {
          label: "Trial Reports",
          href: `/projects/${projectId}/jos/${joId}/trial-reports`,
        },
        { label: "Print Preview" },
      ]}
    >
      {/* Print controls — hidden in print */}
      <div className="trial-print-controls no-print">
        <Link
          href={`/projects/${projectId}/jos/${joId}/trial-reports`}
          className="btn btn-secondary"
          style={{ textDecoration: "none" }}
        >
          ← Kembali
        </Link>
        <button
          className="btn btn-primary"
          onClick={() => window.print()}
          disabled={selectedSessions.length === 0}
        >
          🖨️ Print
        </button>
      </div>

      {selectedSessions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--color-text-muted)",
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600 }}>
            Tidak ada session yang dipilih untuk print.
          </p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            Kembali ke halaman Trial Reports dan pilih session yang akan
            dicetak.
          </p>
        </div>
      ) : (
        <TrialReportPrintView
          jo={jo}
          sessions={selectedSessions}
        />
      )}
    </AppShell>
  );
}
