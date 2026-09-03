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
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => void;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: 1,
  name: "Admin Controller",
  email: "controller@matrix.com",
  role: "controller",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage if present
    try {
      const storedToken = localStorage.getItem("matrix_auth_token");
      const storedUser = localStorage.getItem("matrix_auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Default to demo controller user so prototype remains completely frictionless
        setUser(DEFAULT_DEMO_USER);
        setToken("demo-prototype-token");
        try {
          localStorage.setItem("matrix_auth_token", "demo-prototype-token");
          localStorage.setItem("matrix_auth_user", JSON.stringify(DEFAULT_DEMO_USER));
        } catch {}
      }
    } catch {
      setUser(DEFAULT_DEMO_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password: pass }),
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
      // Fallback for offline demo
      if (email.includes("viewer")) {
        const viewerUser: AuthUser = {
          id: 2,
          name: "Floor Viewer",
          email: "viewer@matrix.com",
          role: "viewer",
        };
        setUser(viewerUser);
        setToken("demo-viewer-token");
        localStorage.setItem("matrix_auth_user", JSON.stringify(viewerUser));
        return true;
      } else {
        setUser(DEFAULT_DEMO_USER);
        setToken("demo-controller-token");
        localStorage.setItem("matrix_auth_user", JSON.stringify(DEFAULT_DEMO_USER));
        return true;
      }
    }
  };

  const logout = () => {
    try {
      if (token && token.startsWith("1|") || token?.startsWith("2|")) {
        fetch("http://127.0.0.1:8000/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }).catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("matrix_auth_token");
      localStorage.removeItem("matrix_auth_user");
      document.cookie = "matrix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const switchRoleDemo = (newRole: UserRole) => {
    const updated: AuthUser = {
      id: newRole === "controller" ? 1 : 2,
      name: newRole === "controller" ? "Admin Controller" : "Floor Viewer",
      email: `${newRole}@matrix.com`,
      role: newRole,
    };
    setUser(updated);
    localStorage.setItem("matrix_auth_user", JSON.stringify(updated));
  };

  const role = user?.role || "controller";
  const isController = role === "controller";
  const isViewer = role === "viewer";

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
  user: DEFAULT_DEMO_USER,
  token: "demo-fallback-token",
  role: "controller",
  isController: true,
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
