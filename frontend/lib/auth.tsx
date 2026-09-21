"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, UserRole } from "./types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole;
  isController: boolean;
  isViewer: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("matrix_auth_token");
      const storedUser = localStorage.getItem("matrix_auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password: pass }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("matrix_auth_token", data.token);
      localStorage.setItem("matrix_auth_user", JSON.stringify(data.user));
      document.cookie = `matrix_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;

      return true;
    } catch {
      // Offline / network failure fallback
      const cleanUser = username.trim().toLowerCase();
      if (
        cleanUser === "viewer" ||
        cleanUser === "matrix#1" ||
        cleanUser === "viewer@matrix.com" ||
        (cleanUser === "matrix" && pass === "matrix#1")
      ) {
        const viewerUser: AuthUser = {
          id: 2,
          name: "Viewer",
          username: "matrix#1",
          email: "viewer@matrix.com",
          role: "viewer",
        };
        setUser(viewerUser);
        setToken("demo-viewer-token");
        localStorage.setItem("matrix_auth_token", "demo-viewer-token");
        localStorage.setItem("matrix_auth_user", JSON.stringify(viewerUser));
        return true;
      } else if (
        cleanUser === "matrix" ||
        cleanUser === "controller" ||
        cleanUser === "controller@matrix.com" ||
        cleanUser === "engineering"
      ) {
        const staffUser: AuthUser = {
          id: 1,
          name: "Staff Engineering",
          username: "matrix",
          email: "engineering@matrix.com",
          role: "controller",
        };
        setUser(staffUser);
        setToken("demo-controller-token");
        localStorage.setItem("matrix_auth_token", "demo-controller-token");
        localStorage.setItem("matrix_auth_user", JSON.stringify(staffUser));
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      if (token && (token.startsWith("1|") || token?.startsWith("2|") || token.includes("|"))) {
        fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("matrix_auth_token");
      localStorage.removeItem("matrix_auth_user");
      document.cookie = "matrix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      } else {
        setUser(null);
        setToken(null);
      }
    }
  };

  const switchRoleDemo = (newRole: UserRole) => {
    const updated: AuthUser = {
      id: newRole === "controller" ? 1 : 2,
      name: newRole === "controller" ? "Staff Engineering" : "Viewer",
      username: newRole === "controller" ? "matrix" : "matrix#1",
      email: newRole === "controller" ? "engineering@matrix.com" : "viewer@matrix.com",
      role: newRole,
    };
    const newToken = newRole === "controller" ? "demo-controller-token" : "demo-viewer-token";
    setUser(updated);
    setToken(newToken);
    localStorage.setItem("matrix_auth_user", JSON.stringify(updated));
    localStorage.setItem("matrix_auth_token", newToken);
    document.cookie = `matrix_token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
  };

  const role: UserRole = user?.role || "viewer";
  const isController = Boolean(user && user.role === "controller");
  const isViewer = Boolean(user && user.role === "viewer");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isController,
        isViewer,
        isLoading,
        login,
        logout,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const FALLBACK_AUTH_CONTEXT: AuthContextType = {
  user: null,
  token: null,
  role: "viewer",
  isController: false,
  isViewer: false,
  isLoading: false,
  login: async () => true,
  logout: () => {},
  switchRoleDemo: () => {},
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || FALLBACK_AUTH_CONTEXT;
}
