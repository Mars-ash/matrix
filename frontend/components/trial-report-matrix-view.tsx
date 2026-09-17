"use client";

import React, { useState, useEffect } from "react";
import {
  sortTrialFindings,
  sortTrialEntries,
  formatFindingNumber,
  formatDateDDMMYYYY,
  formatDateTimeDDMMYYYYHHmm,
  deriveTrialSessionStatus,
} from "@/lib/trial-report";
import type { TrialSession } from "@/lib/types";

/**
 * Clean industrial photo thumbnail: crisp border, subtle hover, no emoji badges.
 */
function PhotoThumbnails({
  photos,
  onSelectPhoto,
}: {
  photos?: { id: string; name: string; previewUrl: string }[];
  onSelectPhoto: (photo: { name: string; url: string }) => void;
}) {
  const validPhotos = (photos || []).filter((ph) => Boolean(ph && ph.previewUrl));
  if (validPhotos.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
      {validPhotos.map((ph) => (
        <button
          key={ph.id}
          type="button"
          onClick={() => onSelectPhoto({ name: ph.name, url: ph.previewUrl })}
          title={`Lihat foto: ${ph.name}`}
          style={{
            cursor: "pointer",
            borderRadius: "var(--radius-sm, 3px)",
            overflow: "hidden",
            border: "1px solid var(--color-border, #d8d5cf)",
            background: "var(--color-bg-wash, #faf9f7)",
            padding: 0,
            display: "inline-flex",
            transition: "border-color 0.12s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent, #2563eb)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border, #d8d5cf)";
          }}
        >
          <img
            src={ph.previewUrl}
            alt={ph.name}
            style={{
              width: 72,
              height: 48,
              objectFit: "cover",
              display: "block",
            }}
          />
        </button>
      ))}
    </div>
  );
}

interface TrialReportMatrixViewProps {
  session: TrialSession;
  joProduct?: string;
}

export function TrialReportMatrixView({
  session,
  joProduct = "",
}: TrialReportMatrixViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "Close" | "On Process">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPhoto(null);
      }
    };
    if (selectedPhoto) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedPhoto]);

  const published = session.publishedSnapshot;

  // If no published snapshot exists yet
  if (!published) {
    return (
      <div
        style={{
          background: "var(--color-bg-raised, #ffffff)",
          border: "1px solid var(--color-border, #d8d5cf)",
          borderRadius: "var(--radius-lg, 6px)",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--color-text-muted, #8a8880)",
          }}
        >
          Status: Menunggu pembaruan dari Staff Engineering
        </span>
      </div>
    );
  }

  // Use published data
  const rawFindings = published.findings ?? [];
  const sortedFindings = sortTrialFindings(rawFindings);

  // Compute status summary
  const derivedStatus = deriveTrialSessionStatus({
    ...published,
    findings: sortedFindings,
  } as TrialSession);

  const allActions = sortedFindings.flatMap((f) => f.correctiveActions ?? []);
  const closeCount = allActions.filter((a) => a.status === "Close").length;
  const onProcessCount = allActions.filter((a) => a.status === "On Process").length;

  // Filter findings based on status filter
  const filteredFindings = sortedFindings.filter((f) => {
    if (statusFilter === "all") return true;
    const actions = f.correctiveActions ?? [];
    if (statusFilter === "Close") {
      return actions.length > 0 && actions.every((a) => a.status === "Close");
    }
    return actions.some((a) => a.status === "On Process") || actions.length === 0;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top Filter Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 600,
          }}
        >
          Filter Status:
        </span>
        <div
          style={{
            display: "inline-flex",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm, 3px)",
            overflow: "hidden",
            background: "var(--color-bg-raised)",
          }}
        >
          {(["all", "On Process", "Close"] as const).map((filter) => {
            const isActive = statusFilter === filter;
            const label = filter === "all" ? `Semua (${sortedFindings.length})` : filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  border: "none",
                  borderRight: filter !== "Close" ? "1px solid var(--color-border)" : "none",
                  background: isActive ? "var(--color-bg-wash)" : "transparent",
                  color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Document Matrix Card */}
      <div
        style={{
          background: "var(--color-bg-raised, #ffffff)",
          border: "1px solid var(--color-border, #d8d5cf)",
          borderRadius: "var(--radius-lg, 6px)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {/* Document Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border, #d8d5cf)",
            background: "var(--color-bg-wash, #faf9f7)",
          }}
        >
          {/* Top Bar: Title & Session Status */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-muted)",
                  marginBottom: 2,
                }}
              >
                Resume Trial Report
              </div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                {published.name}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className={`trial-status-badge ${
                  derivedStatus === "Close" ? "trial-status-close" : "trial-status-on-process"
                }`}
                style={{
                  borderRadius: "var(--radius-sm, 3px)",
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "3px 8px",
                }}
              >
                {derivedStatus} ({closeCount} Selesai, {onProcessCount} Berjalan)
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--color-border-subtle, #eeedea)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                Customer
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                {published.customer || "—"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                JO No. / Part
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                {published.jobNo || "—"} {joProduct ? `(${joProduct})` : ""}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                Hari Trial
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                {formatDateDDMMYYYY(published.trialDate) || "—"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                Terakhir Diperbarui
              </div>
              <div
                suppressHydrationWarning
                style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}
              >
                {formatDateTimeDDMMYYYYHHmm(session.lastPublishedAt || published.updatedAt || published.updateDate)}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                PIC / Approved
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                {published.picName || "—"}{published.approvedByName ? ` · ${published.approvedByName}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: 12,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--color-bg-wash, #faf9f7)",
                  borderBottom: "2px solid var(--color-border, #d8d5cf)",
                }}
              >
                <th
                  style={{
                    padding: "8px 10px",
                    width: 44,
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    borderRight: "1px solid var(--color-border, #d8d5cf)",
                  }}
                >
                  No
                </th>
                <th
                  style={{
                    padding: "8px 14px",
                    width: "26%",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    borderRight: "1px solid var(--color-border, #d8d5cf)",
                  }}
                >
                  Uraian Masalah
                </th>
                <th
                  style={{
                    padding: "8px 14px",
                    width: "22%",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    borderRight: "1px solid var(--color-border, #d8d5cf)",
                  }}
                >
                  Penyebab
                </th>
                <th
                  style={{
                    padding: "8px 14px",
                    width: "26%",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    borderRight: "1px solid var(--color-border, #d8d5cf)",
                  }}
                >
                  Langkah Perbaikan
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    width: "10%",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    borderRight: "1px solid var(--color-border, #d8d5cf)",
                  }}
                >
                  Target
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    width: "8%",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                    borderRight: "1px solid var(--color-border, #d8d5cf)",
                  }}
                >
                  PIC
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    width: "8%",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFindings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Tidak ada temuan yang sesuai dengan filter status &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((finding, fIdx) => {
                  const findingNum = formatFindingNumber(finding.order || fIdx + 1);
                  const problems = sortTrialEntries(finding.problems ?? []);
                  const causes = sortTrialEntries(finding.causes ?? []);
                  const actions = sortTrialEntries(finding.correctiveActions ?? []);
                  const totalRows = Math.max(actions.length, 1);

                  // If finding has no corrective actions
                  if (actions.length === 0) {
                    return (
                      <tr
                        key={finding.id}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          background: "var(--color-bg-raised)",
                        }}
                      >
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 8px",
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--color-text)",
                            background: "var(--color-bg-wash)",
                            borderRight: "1px solid var(--color-border)",
                          }}
                        >
                          {findingNum}
                        </td>
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 14px",
                            borderRight: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text)",
                          }}
                        >
                          {problems.map((p, pIdx) => (
                            <div key={p.id} style={{ marginBottom: pIdx < problems.length - 1 ? 10 : 0 }}>
                              <div>{p.text || "—"}</div>
                              <PhotoThumbnails photos={p.photos} onSelectPhoto={setSelectedPhoto} />
                            </div>
                          ))}
                        </td>
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 14px",
                            borderRight: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {causes.map((c, cIdx) => (
                            <div key={c.id} style={{ marginBottom: cIdx < causes.length - 1 ? 10 : 0 }}>
                              <div>{c.text || "—"}</div>
                              <PhotoThumbnails photos={c.photos} onSelectPhoto={setSelectedPhoto} />
                            </div>
                          ))}
                        </td>
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 14px",
                            borderRight: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          —
                        </td>
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 10px",
                            textAlign: "center",
                            borderRight: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          —
                        </td>
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 10px",
                            borderRight: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          —
                        </td>
                        <td
                          style={{
                            verticalAlign: "top",
                            padding: "12px 10px",
                            textAlign: "center",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          —
                        </td>
                      </tr>
                    );
                  }

                  // Multiple corrective action rows
                  return actions.map((action, aIdx) => (
                    <tr
                      key={action.id}
                      style={{
                        borderBottom:
                          aIdx === totalRows - 1
                            ? "1px solid var(--color-border)"
                            : "1px solid var(--color-border-subtle)",
                        background: "var(--color-bg-raised)",
                      }}
                    >
                      {/* Col 1: Finding No */}
                      {aIdx === 0 && (
                        <td
                          rowSpan={totalRows}
                          style={{
                            verticalAlign: "top",
                            padding: "12px 8px",
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--color-text)",
                            background: "var(--color-bg-wash)",
                            borderRight: "1px solid var(--color-border)",
                          }}
                        >
                          {findingNum}
                        </td>
                      )}

                      {/* Col 2: Problems */}
                      {aIdx === 0 && (
                        <td
                          rowSpan={totalRows}
                          style={{
                            verticalAlign: "top",
                            padding: "12px 14px",
                            borderRight: "1px solid var(--color-border-subtle)",
                            lineHeight: 1.5,
                            color: "var(--color-text)",
                          }}
                        >
                          {problems.map((p, pIdx) => (
                            <div key={p.id} style={{ marginBottom: pIdx < problems.length - 1 ? 10 : 0 }}>
                              <div style={{ fontWeight: 500 }}>
                                {problems.length > 1 && (
                                  <span style={{ color: "var(--color-text-muted)", marginRight: 4 }}>
                                    #{p.order}
                                  </span>
                                )}
                                {p.text || "—"}
                              </div>
                              <PhotoThumbnails photos={p.photos} onSelectPhoto={setSelectedPhoto} />
                            </div>
                          ))}
                        </td>
                      )}

                      {/* Col 3: Causes */}
                      {aIdx === 0 && (
                        <td
                          rowSpan={totalRows}
                          style={{
                            verticalAlign: "top",
                            padding: "12px 14px",
                            borderRight: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.5,
                          }}
                        >
                          {causes.map((c, cIdx) => (
                            <div key={c.id} style={{ marginBottom: cIdx < causes.length - 1 ? 10 : 0 }}>
                              <div>
                                {causes.length > 1 && (
                                  <span style={{ color: "var(--color-text-muted)", marginRight: 4 }}>
                                    #{c.order}
                                  </span>
                                )}
                                {c.text || "—"}
                              </div>
                              <PhotoThumbnails photos={c.photos} onSelectPhoto={setSelectedPhoto} />
                            </div>
                          ))}
                        </td>
                      )}

                      {/* Col 4: Action */}
                      <td
                        style={{
                          verticalAlign: "top",
                          padding: "12px 14px",
                          borderRight: "1px solid var(--color-border-subtle)",
                          color: "var(--color-text)",
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ display: "flex", gap: 6 }}>
                          {actions.length > 1 && (
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--color-text-muted)",
                                fontSize: 11,
                              }}
                            >
                              #{action.order}
                            </span>
                          )}
                          <div style={{ flex: 1 }}>
                            <div>{action.text || "—"}</div>
                            <PhotoThumbnails photos={action.photos} onSelectPhoto={setSelectedPhoto} />
                          </div>
                        </div>
                      </td>

                      {/* Col 5: Target */}
                      <td
                        style={{
                          verticalAlign: "top",
                          padding: "12px 10px",
                          textAlign: "center",
                          borderRight: "1px solid var(--color-border-subtle)",
                          color: "var(--color-text-secondary)",
                          fontSize: 12,
                        }}
                      >
                        {formatDateDDMMYYYY(action.targetDate) || action.targetDate || "—"}
                      </td>

                      {/* Col 6: PIC */}
                      <td
                        style={{
                          verticalAlign: "top",
                          padding: "12px 10px",
                          borderRight: "1px solid var(--color-border-subtle)",
                          color: "var(--color-text)",
                        }}
                      >
                        {action.pic ? (
                          <span>{action.pic}</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* Col 7: Status */}
                      <td
                        style={{
                          verticalAlign: "top",
                          padding: "12px 10px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          className={`trial-status-badge-sm ${
                            action.status === "Close"
                              ? "trial-status-close"
                              : "trial-status-on-process"
                          }`}
                          style={{
                            borderRadius: "var(--radius-sm, 3px)",
                            fontWeight: 600,
                            display: "inline-block",
                          }}
                        >
                          {action.status}
                        </span>
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="dialog-backdrop"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dialog-panel"
            style={{ maxWidth: 700, width: "95%", padding: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedPhoto.name || "Preview Foto"}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="btn btn-secondary btn-sm"
                aria-label="Tutup"
                style={{ padding: "3px 8px", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Image Box */}
            <div
              style={{
                width: "100%",
                maxHeight: "65vh",
                borderRadius: "var(--radius-md, 4px)",
                background: "var(--color-bg-wash, #faf9f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid var(--color-border, #d8d5cf)",
              }}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="dialog-footer" style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="btn btn-secondary btn-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
