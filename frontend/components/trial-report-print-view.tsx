"use client";
import React from "react";
import {
  sortTrialFindings,
  sortTrialEntries,
  formatFindingNumber,
  formatDateDDMMYYYY,
} from "@/lib/trial-report";
import type { TrialSession, TrialTextEntry, JO, CompanyEntity } from "@/lib/types";
import { formatPhotoUrl } from "@/lib/format";

function renderEntries(entries: TrialTextEntry[]) {
  if (entries.length === 0) {
    return <span className="trial-print-empty-dash">—</span>;
  }
  return (
    <div className="trial-print-entry-list">
      {entries.map((entry) => (
        <div key={entry.id} className="trial-print-entry-item">
          <div className="trial-print-entry-text">{entry.text || "—"}</div>
          {entry.photos && entry.photos.length > 0 && (
            <div className="trial-print-photos">
              {entry.photos.map((ph) => (
                <img
                  key={ph.id}
                  src={formatPhotoUrl(ph.previewUrl)}
                  alt={ph.name}
                  className="trial-print-photo"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function TrialReportPrintView({
  jo,
  sessions,
  company,
}: {
  jo?: JO;
  sessions: TrialSession[];
  company?: CompanyEntity;
}) {
  const isBkp = company === "BKP";
  const logoSrc = isBkp ? "/logo/LOGO BKP.png" : "/company-logo.png";
  const logoAlt = isBkp ? "PT. Bintang Kinerja Perdana Logo" : "Company Logo";

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
                    src={logoSrc}
                    alt={logoAlt}
                    className="trial-print-logo"
                  />
                </div>
                <div className="trial-print-title-area">
                  <h1 className="trial-print-title">RESUME NEW PROJECT</h1>
                </div>
              </div>

              {/* Header metadata */}
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
                      <td className="trial-print-meta-value">
                        {formatDateDDMMYYYY(session.trialDate)}
                      </td>
                    </tr>
                    <tr>
                      <td className="trial-print-meta-label">Update</td>
                      <td className="trial-print-meta-value">
                        {formatDateDDMMYYYY(session.updateDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Header signature boxes */}
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

            {/* Findings table with separate columns for Target, PIC, and Status */}
            <table className="trial-print-findings-table">
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: "center" }}>No</th>
                  <th style={{ width: "25%" }}>Uraian Masalah</th>
                  <th style={{ width: "22%" }}>Penyebab</th>
                  <th style={{ width: "27%" }}>Langkah Perbaikan</th>
                  <th style={{ width: "9%", textAlign: "center" }}>Target</th>
                  <th style={{ width: "9%" }}>PIC</th>
                  <th style={{ width: "8%", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedFindings.map((finding, idx) => {
                  const findingNum = formatFindingNumber(finding.order || idx + 1);
                  const problems = sortTrialEntries(finding.problems ?? []);
                  const causes = sortTrialEntries(finding.causes ?? []);
                  const actions = sortTrialEntries(finding.correctiveActions ?? []);
                  const rowSpan = Math.max(actions.length, 1);

                  if (actions.length === 0) {
                    return (
                      <tr key={finding.id} className="trial-print-finding-row">
                        <td className="trial-print-finding-letter-cell">
                          <span className="trial-print-finding-letter">
                            {findingNum}
                          </span>
                        </td>
                        <td className="trial-print-entries-cell">
                          {renderEntries(problems)}
                        </td>
                        <td className="trial-print-entries-cell">
                          {renderEntries(causes)}
                        </td>
                        <td className="trial-print-entries-cell">
                          <span className="trial-print-empty-dash">—</span>
                        </td>
                        <td className="trial-print-meta-cell" style={{ textAlign: "center" }}>
                          <span className="trial-print-empty-dash">—</span>
                        </td>
                        <td className="trial-print-meta-cell">
                          <span className="trial-print-empty-dash">—</span>
                        </td>
                        <td className="trial-print-meta-cell" style={{ textAlign: "center" }}>
                          <span className="trial-print-empty-dash">—</span>
                        </td>
                      </tr>
                    );
                  }

                  return actions.map((action, aIdx) => (
                    <tr key={action.id} className="trial-print-finding-row">
                      {aIdx === 0 && (
                        <>
                          <td
                            rowSpan={rowSpan}
                            className="trial-print-finding-letter-cell"
                          >
                            <span className="trial-print-finding-letter">
                              {findingNum}
                            </span>
                          </td>
                          <td
                            rowSpan={rowSpan}
                            className="trial-print-entries-cell"
                          >
                            {renderEntries(problems)}
                          </td>
                          <td
                            rowSpan={rowSpan}
                            className="trial-print-entries-cell"
                          >
                            {renderEntries(causes)}
                          </td>
                        </>
                      )}
                      <td className="trial-print-entries-cell">
                        <div className="trial-print-entry-text">
                          {action.text || "—"}
                        </div>
                        {action.photos && action.photos.length > 0 && (
                          <div className="trial-print-photos">
                            {action.photos.map((ph) => (
                              <img
                                key={ph.id}
                                src={formatPhotoUrl(ph.previewUrl)}
                                alt={ph.name}
                                className="trial-print-photo"
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td
                        className="trial-print-meta-cell"
                        style={{ textAlign: "center", whiteSpace: "nowrap" }}
                      >
                        {action.targetDate ? (
                          formatDateDDMMYYYY(action.targetDate)
                        ) : (
                          <span className="trial-print-empty-dash">—</span>
                        )}
                      </td>
                      <td className="trial-print-meta-cell">
                        {action.pic ? (
                          <div className="trial-print-pic-list">
                            {action.pic
                              .split(",")
                              .map((p) => p.trim())
                              .filter(Boolean)
                              .map((name, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="trial-print-pic-item"
                                >
                                  {name}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span className="trial-print-empty-dash">—</span>
                        )}
                      </td>
                      <td
                        className="trial-print-meta-cell"
                        style={{ textAlign: "center" }}
                      >
                        <span
                          className={`trial-print-status-tag ${
                            action.status === "Close"
                              ? "trial-print-status-close"
                              : "trial-print-status-open"
                          }`}
                        >
                          {action.status}
                        </span>
                      </td>
                    </tr>
                  ));
                })}
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

