import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Not Found" }]}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 48, marginBottom: 16 }}>🔍</span>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Page Not Found</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 24 }}>
          The page you are looking for does not exist or the data has been reset.
        </p>
        <Link href="/" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    </AppShell>
  );
}
