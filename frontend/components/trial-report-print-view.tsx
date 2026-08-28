"use client";
import React from "react";
import { sortTrialFindings, formatDateDDMMYYYY } from "@/lib/trial-report";
import type { TrialSession, JO } from "@/lib/types";

export function TrialReportPrintView({
  sessions,
}: {
  jo?: JO;
  sessions: TrialSession[];
}) {
  return (
    <div className="trial-print-view">
      {sessions.map((session, sessionIdx) => {
        const sortedFindings = sortTrialFindings(session.findings);

        return (
          <div
            key={session.id}
            className="trial-print-session"
            style={sessionIdx > 0 ? { pageBreakBefore: "always" } : undefined}
          >
            {/* Print header */}
            <div className="trial-print-header">
              <div className="trial-print-header-left">
                <div className="trial-print-logo-area">
                  <img
                    src="/company-logo.png"
                    alt="Company Logo"
                    className="trial-print-logo"
                  />
                </div>
                <div className="trial-print-title-area">
                  <h1 className="trial-print-title">RESUME NEW PROJECT</h1>
                </div>
              </div>

              {/* Header metadata (4 items stacked: Customer, Job No, Hari Trial, Update) */}
              <div className="trial-print-header-meta">
                <table className="trial-print-header-meta-table">
                  <tbody>
                    <tr>
                      <td className="trial-print-meta-label">Customer</td>
                      <td className="trial-print-meta-value">{session.customer}</td>
                    </tr>
                    <tr>
                      <td className="trial-print-meta-label">Job . No.</td>
                      <td className="trial-print-meta-value">{session.jobNo}</td>
                    </tr>
                    <tr>
                      <td className="trial-print-meta-label">Hari Trial</td>
                      <td className="trial-print-meta-value">{formatDateDDMMYYYY(session.trialDate)}</td>
                    </tr>
                    <tr>
                      <td className="trial-print-meta-label">Update</td>
                      <td className="trial-print-meta-value">{formatDateDDMMYYYY(session.updateDate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Header signature boxes (sejajar dengan logo) */}
              <div className="trial-print-header-signatures">
                <table className="trial-print-sig-table">
                  <thead>
                    <tr>
                      <th>PIC</th>
                      <th>Approved by</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="trial-print-sig-space" />
                        <div className="trial-print-sig-name">
                          {session.picName || "—"}
                        </div>
                      </td>
                      <td>
                        <div className="trial-print-sig-space" />
                        <div className="trial-print-sig-name">
                          {session.approvedByName || "—"}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Findings table */}
            <table className="trial-print-findings-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>No</th>
                  <th>Uraian Masalah</th>
                  <th>Penyebab</th>
                  <th>Langkah Perbaikan</th>
                  <th style={{ width: 80 }}>Target</th>
                  <th style={{ width: 60 }}>PIC</th>
                  <th style={{ width: 72 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedFindings.map((finding, idx) => (
                  <React.Fragment key={finding.id}>
                    <tr>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {finding.problem}
                      </td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {finding.cause}
                      </td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {finding.correctiveAction}
                      </td>
                      <td>{formatDateDDMMYYYY(finding.targetDate)}</td>
                      <td>{finding.pic}</td>
                      <td>
                        <span
                          className={
                            finding.status === "Close"
                              ? "trial-print-status-close"
                              : "trial-print-status-open"
                          }
                        >
                          {finding.status}
                        </span>
                      </td>
                    </tr>
                    {/* Inline photos */}
                    {finding.photos.length > 0 && (
                      <tr>
                        <td></td>
                        <td colSpan={6}>
                          <div className="trial-print-photos">
                            {finding.photos.map((photo) => (
                              <img
                                key={photo.id}
                                src={photo.previewUrl}
                                alt={photo.name}
                                className="trial-print-photo"
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {sortedFindings.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  padding: 24,
                  color: "#666",
                  fontSize: 13,
                }}
              >
                Tidak ada temuan pada session ini.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
