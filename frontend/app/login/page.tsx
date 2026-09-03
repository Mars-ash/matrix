"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.push("/");
      } else {
        setError("Username atau password yang Anda masukkan salah.");
      }
    } catch {
      setError("Terjadi kendala saat proses sign in. Silakan coba lagi.");
    } finally {
      setLoading(false);
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
          maxWidth: 400,
          padding: "36px 30px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 10px 32px rgba(0, 0, 0, 0.08)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 50,
              height: 50,
              borderRadius: 12,
              background: "var(--color-text)",
              color: "var(--color-bg)",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "-0.03em",
              marginBottom: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            M
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>MATRIX</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4, fontWeight: 500 }}>
            Project Controlling System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid var(--color-status-problem)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-status-problem)",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="label" htmlFor="login-username" style={{ fontSize: 12, fontWeight: 600 }}>
              Username
            </label>
            <input
              id="login-username"
              data-testid="login-username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username..."
              required
              autoFocus
              style={{ padding: "8px 12px", fontSize: 13 }}
            />
            {/* Hidden fallback id to maintain compatibility with legacy tests */}
            <input
              id="login-email"
              type="hidden"
              value={username}
              aria-hidden="true"
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label" htmlFor="login-password" style={{ fontSize: 12, fontWeight: 600 }}>
                Password
              </label>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                data-testid="login-password"
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                required
                style={{ padding: "8px 52px 8px 12px", fontSize: 13, width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 4,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 16px",
              marginTop: 6,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? "Memproses..." : "Sign In to Matrix"}
          </button>
        </form>
      </div>
    </div>
  );
}
