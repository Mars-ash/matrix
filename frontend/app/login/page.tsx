"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("controller@matrix.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/");
      } else {
        setError("Invalid email or password. Please check your credentials.");
      }
    } catch {
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("password123");
    setError("");
    setLoading(true);

    const success = await login(quickEmail, "password123");
    setLoading(false);
    if (success) {
      router.push("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        padding: "24px 16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "32px 28px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--color-text)",
              color: "var(--color-bg)",
              fontWeight: 800,
              fontSize: 20,
              marginBottom: 12,
            }}
          >
            M
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>MATRIX</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
            Project Controlling System
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid var(--color-status-problem)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-status-problem)",
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "10px 16px", marginTop: 4 }}
          >
            {loading ? "Signing in..." : "Sign In to Matrix"}
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 10px 0", textAlign: "center" }}>
            Quick Demo Sign In
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin("controller@matrix.com")}
              style={{ flex: 1, fontSize: 11, padding: "6px 8px" }}
            >
              Role: Controller
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin("viewer@matrix.com")}
              style={{ flex: 1, fontSize: 11, padding: "6px 8px" }}
            >
              Role: Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
