"use client";

import React from "react";
import Link from "next/link";
import type { Project, JO } from "@/lib/types";
import { formatProgress } from "@/lib/format";

export interface JoDetailHeaderProps {
  project: Project;
  jo: JO;
  projectId: string;
  joId: string;
  progress: number | null;
  problems: number;
  isController: boolean;
  onOpenActivities: () => void;
  onFinishClick: () => void;
  onDeleteClick: () => void;
}

export function JoDetailHeader({
  project,
  jo,
  projectId,
  joId,
  progress,
  problems,
  isController,
  onOpenActivities,
  onFinishClick,
  onDeleteClick,
}: JoDetailHeaderProps) {
  return (
    <>
      <div className="jo-detail-header">
        {/* Left Side: Title & Progress Lock-up */}
        <div className="jo-detail-title-block">
          {/* JO Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1
                style={{
                  fontSize: "clamp(20px, 4.5vw, 30px)",
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                JO {jo.joNumber}
              </h1>
              {project.company && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    background:
                      project.company === "BMI"
                        ? "var(--color-status-done-bg)"
                        : "var(--color-status-not-started-bg)",
                    color:
                      project.company === "BMI"
                        ? "var(--color-status-done)"
                        : "var(--color-status-not-started)",
                    border: `1px solid ${
                      project.company === "BMI"
                        ? "rgba(13, 124, 74, 0.3)"
                        : "rgba(37, 99, 235, 0.3)"
                    }`,
                    letterSpacing: "0.04em",
                  }}
                >
                  {project.company}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: "clamp(12px, 2.8vw, 16px)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "var(--color-text)",
                lineHeight: 1,
              }}
            >
              {jo.type.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "clamp(11px, 2.2vw, 15px)",
                color: "var(--color-text-muted)",
                lineHeight: 1,
              }}
            >
              {jo.product} · {project.name} ({project.customer})
            </span>
          </div>

          {/* Vertical Divider — hidden on mobile via CSS */}
          <div
            className="jo-detail-divider"
            style={{
              width: 2,
              height: 64,
              backgroundColor: "var(--color-text)",
              borderRadius: 1,
            }}
          />

          {/* Progress */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "clamp(26px, 5.5vw, 38px)",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color:
                  progress === 100
                    ? "var(--color-status-done)"
                    : "var(--color-text)",
              }}
            >
              {formatProgress(progress)}
            </span>
            <span
              style={{
                fontSize: "clamp(10px, 1.8vw, 13px)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              PROGRESS
            </span>
          </div>
        </div>

        {/* Right Side: Target, Problems, Buttons */}
        <div className="jo-detail-meta">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {jo.targetDate && (
              <span>
                Target{" "}
                <strong style={{ fontSize: 16, color: "var(--color-text)" }}>
                  {jo.targetDate}
                </strong>
              </span>
            )}
            {problems > 0 && (
              <span>
                Problems{" "}
                <strong
                  style={{
                    fontSize: 20,
                    color: "var(--color-status-problem)",
                  }}
                >
                  {problems}
                </strong>
              </span>
            )}
          </div>

          <div className="jo-detail-actions">
            <Link
              href={`/projects/${projectId}/jos/${joId}/trial-reports`}
              className="btn btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              Trial Reports
            </Link>
            <button
              className="btn btn-secondary"
              onClick={onOpenActivities}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              Activity & Problem Log
            </button>

            {jo.finishDate ? (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--color-status-done)",
                  fontWeight: 600,
                  padding: "6px 12px",
                  border: "1px solid var(--color-status-done)",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(13, 124, 74, 0.05)",
                  textAlign: "center",
                }}
              >
                Finished: {jo.finishDate}
              </span>
            ) : isController ? (
              <button
                className="btn btn-primary"
                onClick={onFinishClick}
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Finish JO
              </button>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--color-status-in-progress)",
                  fontWeight: 600,
                  padding: "6px 12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-wash)",
                }}
              >
                Status: In Progress
              </span>
            )}

            {isController && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={onDeleteClick}
                style={{ padding: "6px 12px", fontSize: 12 }}
                title="Hapus Job Order ini"
              >
                Hapus JO
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thin progress track */}
      {progress !== null && (
        <div
          style={{
            height: 3,
            background: "var(--color-bg-hover)",
            borderRadius: 1,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, progress))}%`,
              background:
                progress === 100
                  ? "var(--color-status-done)"
                  : progress >= 50
                    ? "var(--color-status-in-progress)"
                    : "var(--color-accent)",
              borderRadius: 1,
              transition: "width 200ms ease",
            }}
          />
        </div>
      )}
    </>
  );
}

