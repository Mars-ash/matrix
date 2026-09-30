"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, UserRole } from "./types";
import { API_BASE_URL } from "./config";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, clearAuthStorage } from "./auth-storage";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole;
  isController: boolean;
  isViewer: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        document.cookie = `matrix_token=${storedToken}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        setToken(null);
        setUser(null);
        document.cookie = "matrix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
    } catch {
      setToken(null);
      setUser(null);
      document.cookie = "matrix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
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

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      document.cookie = `matrix_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    try {
      if (token) {
        fetch(`${API_BASE_URL}/auth/logout`, {
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
      clearAuthStorage();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
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
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || FALLBACK_AUTH_CONTEXT;
}
