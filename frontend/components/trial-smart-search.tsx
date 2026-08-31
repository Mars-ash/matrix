"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { formatFindingLetter, formatDateDDMMYYYY, deriveTrialSessionStatus } from "@/lib/trial-report";
import type { TrialSession } from "@/lib/types";

export interface SmartSearchResult {
  id: string;
  category: "Masalah" | "Penyebab" | "Perbaikan" | "PIC" | "Status" | "Target" | "Session";
  sessionId: string;
  sessionName: string;
  findingId?: string;
  findingLetter?: string;
  title: string;
  snippet: string;
  meta?: string;
  status?: string;
}

interface TrialSmartSearchProps {
  sessions: TrialSession[];
  onSelectResult: (sessionId: string, findingId?: string) => void;
}

export function TrialSmartSearch({
  sessions,
  onSelectResult,
}: TrialSmartSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const matches: SmartSearchResult[] = [];
    const seen = new Set<string>();

    const addMatch = (res: SmartSearchResult) => {
      const key = `${res.sessionId}-${res.findingId ?? ""}-${res.category}-${res.snippet}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push(res);
      }
    };

    for (const session of sessions) {
      const sessionDateFormatted = formatDateDDMMYYYY(session.trialDate).toLowerCase();
      const sessionRawDate = (session.trialDate || "").toLowerCase();
      const sessionNameLower = (session.name || "").toLowerCase();
      const customerLower = (session.customer || "").toLowerCase();
      const jobNoLower = (session.jobNo || "").toLowerCase();
      const picNameLower = (session.picName || "").toLowerCase();

      // 1. Match on Session
      if (
        sessionNameLower.includes(q) ||
        sessionDateFormatted.includes(q) ||
        sessionRawDate.includes(q) ||
        customerLower.includes(q) ||
        jobNoLower.includes(q) ||
        picNameLower.includes(q)
      ) {
        addMatch({
          id: `session-${session.id}`,
          category: "Session",
          sessionId: session.id,
          sessionName: session.name,
          title: session.name,
          snippet: `${session.customer || "No Customer"} · Job #${session.jobNo || "-"} · ${formatDateDDMMYYYY(session.trialDate)}`,
          status: deriveTrialSessionStatus(session),
        });
      }

      // 2. Match inside Findings
      for (const finding of session.findings ?? []) {
        const letter = formatFindingLetter(finding.order);
        const letterLower = letter.toLowerCase();
        const findingLabel = `Temuan ${letter}`;

        // Finding letter match (e.g. "temuan a" or just "a")
        if (q === letterLower || q === findingLabel.toLowerCase()) {
          addMatch({
            id: `finding-${finding.id}`,
            category: "Session",
            sessionId: session.id,
            sessionName: session.name,
            findingId: finding.id,
            findingLetter: letter,
            title: `${session.name} · Temuan ${letter}`,
            snippet: `${finding.problems?.length ?? 0} masalah · ${finding.correctiveActions?.length ?? 0} tindakan perbaikan`,
          });
        }

        // Problems match
        for (const prob of finding.problems ?? []) {
          if ((prob.text || "").toLowerCase().includes(q)) {
            addMatch({
              id: `prob-${prob.id}`,
              category: "Masalah",
              sessionId: session.id,
              sessionName: session.name,
              findingId: finding.id,
              findingLetter: letter,
              title: `${session.name} · Temuan ${letter} (Masalah #${prob.order})`,
              snippet: prob.text,
            });
          }
        }

        // Causes match
        for (const cause of finding.causes ?? []) {
          if ((cause.text || "").toLowerCase().includes(q)) {
            addMatch({
              id: `cause-${cause.id}`,
              category: "Penyebab",
              sessionId: session.id,
              sessionName: session.name,
              findingId: finding.id,
              findingLetter: letter,
              title: `${session.name} · Temuan ${letter} (Penyebab #${cause.order})`,
              snippet: cause.text,
            });
          }
        }

        // Actions match
        for (const act of finding.correctiveActions ?? []) {
          const actTextLower = (act.text || "").toLowerCase();
          const actPicLower = (act.pic || "").toLowerCase();
          const actTargetLower = (act.targetDate || "").toLowerCase();
          const actTargetFormatted = formatDateDDMMYYYY(act.targetDate).toLowerCase();
          const actStatusLower = (act.status || "").toLowerCase();

          // Action text match
          if (actTextLower.includes(q)) {
            addMatch({
              id: `act-${act.id}`,
              category: "Perbaikan",
              sessionId: session.id,
              sessionName: session.name,
              findingId: finding.id,
              findingLetter: letter,
              title: `${session.name} · Temuan ${letter} (Perbaikan #${act.order})`,
              snippet: act.text,
              meta: act.pic ? `PIC: ${act.pic}` : undefined,
              status: act.status,
            });
          }

          // PIC match
          if (actPicLower.includes(q)) {
            addMatch({
              id: `pic-${act.id}`,
              category: "PIC",
              sessionId: session.id,
              sessionName: session.name,
              findingId: finding.id,
              findingLetter: letter,
              title: `PIC: ${act.pic} (${session.name} · Temuan ${letter})`,
              snippet: act.text || "Langkah perbaikan",
              status: act.status,
            });
          }

          // Target date match
          if (actTargetLower.includes(q) || actTargetFormatted.includes(q)) {
            addMatch({
              id: `target-${act.id}`,
              category: "Target",
              sessionId: session.id,
              sessionName: session.name,
              findingId: finding.id,
              findingLetter: letter,
              title: `Target: ${formatDateDDMMYYYY(act.targetDate)} (${session.name} · Temuan ${letter})`,
              snippet: act.text || "Langkah perbaikan",
              status: act.status,
            });
          }

          // Status match (e.g. searching "close" or "process")
          if (actStatusLower.includes(q) && (q === "close" || q === "on process" || q === "process")) {
            addMatch({
              id: `status-${act.id}`,
              category: "Status",
              sessionId: session.id,
              sessionName: session.name,
              findingId: finding.id,
              findingLetter: letter,
              title: `Status: ${act.status} (${session.name} · Temuan ${letter})`,
              snippet: act.text || "Langkah perbaikan",
              status: act.status,
            });
          }
        }
      }
    }

    return matches.slice(0, 30);
  }, [query, sessions]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const showDropdown = focused && query.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = results[selectedIndex];
      if (sel) {
        onSelectResult(sel.sessionId, sel.findingId);
        setFocused(false);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  const getCategoryBadgeClass = (cat: SmartSearchResult["category"]) => {
    switch (cat) {
      case "Masalah":
        return "trial-search-badge-masalah";
      case "Penyebab":
        return "trial-search-badge-penyebab";
      case "Perbaikan":
        return "trial-search-badge-perbaikan";
      case "PIC":
        return "trial-search-badge-pic";
      case "Target":
        return "trial-search-badge-target";
      case "Status":
        return "trial-search-badge-status";
      default:
        return "trial-search-badge-session";
    }
  };

  return (
    <div ref={wrapperRef} className="trial-smart-search-container">
      <div className="trial-smart-search-input-wrapper">
        <svg
          className="trial-smart-search-icon"
          width="15"
          height="15"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" />
        </svg>

        <input
          ref={inputRef}
          className="input trial-smart-search-input"
          type="text"
          placeholder="Search.."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
        />

        {query && (
          <button
            type="button"
            className="trial-smart-search-clear"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            title="Hapus pencarian"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="trial-smart-search-dropdown">
          <div className="trial-smart-search-header">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {results.length === 0
                ? "Tidak ada hasil"
                : `${results.length} hasil ditemukan`}
            </span>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
              Gunakan ↑ ↓ dan Enter untuk memilih
            </span>
          </div>

          {results.length === 0 ? (
            <div className="trial-smart-search-empty">
              Tidak ditemukan data trial yang cocok dengan &quot;{query}&quot;
            </div>
          ) : (
            <div className="trial-smart-search-results-list">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  className={`trial-smart-search-item ${
                    i === selectedIndex ? "trial-smart-search-item-active" : ""
                  }`}
                  onClick={() => {
                    onSelectResult(r.sessionId, r.findingId);
                    setFocused(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="trial-smart-search-item-top">
                    <span className={`trial-smart-search-category ${getCategoryBadgeClass(r.category)}`}>
                      {r.category}
                    </span>
                    <span className="trial-smart-search-item-title">
                      {r.title}
                    </span>
                    {r.status && (
                      <span
                        className={`trial-status-badge-sm ${
                          r.status === "Close"
                            ? "trial-status-close"
                            : "trial-status-on-process"
                        }`}
                        style={{ marginLeft: "auto" }}
                      >
                        {r.status}
                      </span>
                    )}
                  </div>
                  <div className="trial-smart-search-item-snippet">
                    {r.snippet}
                  </div>
                  {r.meta && (
                    <div className="trial-smart-search-item-meta">
                      {r.meta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
