"use client";
import React from "react";

export function SkeletonBlock({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-sm)",
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        display: "inline-block",
        ...style,
      }}
    />
  );
}

export function JoCardSkeleton() {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock width="80px" height="18px" />
        <SkeletonBlock width="40px" height="16px" borderRadius="10px" />
      </div>
      <SkeletonBlock width="130px" height="13px" />
      <SkeletonBlock width="100%" height="4px" borderRadius="2px" style={{ margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock width="90px" height="12px" />
        <SkeletonBlock width="55px" height="16px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function ArchiveJoCardSkeleton() {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock width="80px" height="18px" />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <SkeletonBlock width="38px" height="16px" borderRadius="10px" />
          <SkeletonBlock width="65px" height="18px" borderRadius="4px" />
        </div>
      </div>
      <SkeletonBlock width="120px" height="13px" />
      <SkeletonBlock width="100%" height="4px" borderRadius="2px" style={{ margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock width="85px" height="12px" />
        <SkeletonBlock width="60px" height="20px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, opacity: 0.9 }}>Project Controlling</h1>
          <div style={{ marginTop: 6 }}>
            <SkeletonBlock width="140px" height="13px" />
          </div>
        </div>
        <div className="dashboard-controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SkeletonBlock width="70px" height="28px" borderRadius="var(--radius-md)" />
          <SkeletonBlock width="90px" height="28px" borderRadius="var(--radius-md)" />
          <SkeletonBlock width="180px" height="28px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* 2 Project sections */}
      {[1, 2].map((i) => (
        <section key={i} style={{ marginBottom: 28 }}>
          <div
            className="project-section-header"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 10 }}
          >
            <SkeletonBlock width="14px" height="14px" borderRadius="2px" />
            <SkeletonBlock width="160px" height="16px" />
            <SkeletonBlock width="45px" height="16px" borderRadius="4px" />
            <SkeletonBlock width="80px" height="12px" style={{ marginLeft: "auto" }} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
              gap: 10,
            }}
          >
            {[1, 2, 3].map((j) => (
              <JoCardSkeleton key={j} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ArchiveSkeleton() {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, opacity: 0.9 }}>Archive — Project</h1>
          <div style={{ marginTop: 6 }}>
            <SkeletonBlock width="160px" height="13px" />
          </div>
        </div>
        <div className="dashboard-controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SkeletonBlock width="130px" height="28px" borderRadius="var(--radius-md)" />
          <SkeletonBlock width="90px" height="28px" borderRadius="var(--radius-md)" />
          <SkeletonBlock width="180px" height="28px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* 1 Archived Project section */}
      <section style={{ marginBottom: 28 }}>
        <div
          className="project-section-header"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 10 }}
        >
          <SkeletonBlock width="14px" height="14px" borderRadius="2px" />
          <SkeletonBlock width="180px" height="16px" />
          <SkeletonBlock width="45px" height="16px" borderRadius="4px" />
          <SkeletonBlock width="70px" height="12px" style={{ marginLeft: "auto" }} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
            gap: 10,
          }}
        >
          {[1, 2].map((j) => (
            <ArchiveJoCardSkeleton key={j} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function JoDetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Header */}
      <div
        className="jo-detail-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SkeletonBlock width="140px" height="26px" />
              <SkeletonBlock width="50px" height="18px" borderRadius="4px" />
            </div>
            <SkeletonBlock width="120px" height="14px" />
            <SkeletonBlock width="200px" height="12px" />
          </div>
          <div
            style={{
              borderLeft: "2px solid var(--color-border-subtle)",
              paddingLeft: 24,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <SkeletonBlock width="60px" height="28px" />
            <SkeletonBlock width="70px" height="10px" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SkeletonBlock width="120px" height="28px" borderRadius="var(--radius-md)" />
          <SkeletonBlock width="90px" height="28px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
        <SkeletonBlock width="100px" height="28px" borderRadius="var(--radius-md)" />
        <SkeletonBlock width="120px" height="28px" borderRadius="var(--radius-md)" />
      </div>

      {/* Table Skeleton */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--color-bg-surface)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "var(--color-bg-wash)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <SkeletonBlock width="120px" height="16px" />
          <SkeletonBlock width="80px" height="22px" borderRadius="var(--radius-md)" />
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "6px 0",
                borderBottom: row < 5 ? "1px solid var(--color-border-subtle)" : "none",
              }}
            >
              <SkeletonBlock width="20px" height="14px" />
              <SkeletonBlock width="140px" height="14px" />
              <SkeletonBlock width="90px" height="14px" />
              <SkeletonBlock width="60px" height="14px" />
              <SkeletonBlock width="35px" height="14px" />
              <SkeletonBlock width="70px" height="22px" borderRadius="var(--radius-sm)" style={{ marginLeft: "auto" }} />
              <SkeletonBlock width="70px" height="22px" borderRadius="var(--radius-sm)" />
              <SkeletonBlock width="70px" height="22px" borderRadius="var(--radius-sm)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrackerTableSkeleton({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, opacity: 0.9 }}>{title}</h1>
          <div style={{ marginTop: 6 }}>
            <SkeletonBlock width="140px" height="13px" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonBlock width="100px" height="28px" borderRadius="var(--radius-md)" />
          <SkeletonBlock width="140px" height="28px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--color-bg-surface)",
          padding: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4, 6].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "8px 4px",
                borderBottom: i < 6 ? "1px solid var(--color-border-subtle)" : "none",
              }}
            >
              <SkeletonBlock width="24px" height="16px" />
              <SkeletonBlock width="80px" height="16px" />
              <SkeletonBlock width="160px" height="16px" />
              <SkeletonBlock width="110px" height="16px" />
              <SkeletonBlock width="90px" height="16px" />
              <SkeletonBlock width="90px" height="24px" borderRadius="var(--radius-sm)" style={{ marginLeft: "auto" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrialReportSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Context header */}
      <div className="trial-page-context" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <SkeletonBlock width="220px" height="24px" />
          <SkeletonBlock width="180px" height="14px" />
        </div>
        <SkeletonBlock width="240px" height="32px" borderRadius="var(--radius-md)" />
      </div>

      {/* Main layout */}
      <div className="trial-page-layout">
        {/* Left session list skeleton */}
        <div
          className="trial-session-sidebar"
          style={{
            width: 280,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderRight: "1px solid var(--color-border-subtle)",
            paddingRight: 16,
          }}
        >
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            <SkeletonBlock width="110px" height="28px" borderRadius="var(--radius-md)" />
            <SkeletonBlock width="90px" height="28px" borderRadius="var(--radius-md)" />
          </div>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="card-static"
              style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <SkeletonBlock width="100px" height="16px" />
                <SkeletonBlock width="50px" height="14px" borderRadius="3px" />
              </div>
              <SkeletonBlock width="130px" height="12px" />
            </div>
          ))}
        </div>

        {/* Right editor area skeleton */}
        <div className="trial-page-editor-area" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            className="card-static"
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonBlock width="160px" height="20px" />
              <div style={{ display: "flex", gap: 8 }}>
                <SkeletonBlock width="80px" height="26px" borderRadius="var(--radius-md)" />
                <SkeletonBlock width="80px" height="26px" borderRadius="var(--radius-md)" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <SkeletonBlock width="100%" height="32px" borderRadius="var(--radius-sm)" />
              <SkeletonBlock width="100%" height="32px" borderRadius="var(--radius-sm)" />
              <SkeletonBlock width="100%" height="32px" borderRadius="var(--radius-sm)" />
            </div>
          </div>

          {[1, 2].map((f) => (
            <div
              key={f}
              className="card-static"
              style={{
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <SkeletonBlock width="120px" height="16px" />
                <SkeletonBlock width="70px" height="20px" borderRadius="4px" />
              </div>
              <SkeletonBlock width="100%" height="45px" borderRadius="var(--radius-sm)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

