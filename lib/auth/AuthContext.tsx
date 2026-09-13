"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppUser, UserRole } from "@/types/user";

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_CACHE_KEY = "idi_racepack_user_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check active server session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      // Optimistic load from local storage for fast UX
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(SESSION_CACHE_KEY);
          if (cached) {
            setUser(JSON.parse(cached));
          }
        } catch (e) {
          // ignore cache parse error
        }
      }

      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: { credentials: "same-origin" },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
            if (typeof window !== "undefined") {
              localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data.user));
            }
          } else if (isMounted) {
            setUser(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem(SESSION_CACHE_KEY);
            }
          }
        } else if (isMounted) {
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_CACHE_KEY);
          }
        }
      } catch (err) {
        console.warn("Session verification network error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || "Gagal melakukan login. Silakan coba lagi.",
        };
      }

      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data.user));
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || "Terjadi kesalahan jaringan saat mencoba login.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_CACHE_KEY);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
