"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppUser, UserRole, UserAccount } from "@/types/user";
import hardcodedUsers from "@/data/users.json";

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "idi_racepack_user_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore saved session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as AppUser;
          // Verify user still exists in hardcoded json
          const valid = (hardcodedUsers as UserAccount[]).find(
            (u) => u.email.toLowerCase() === parsed.email.toLowerCase() && u.isActive
          );
          if (valid) {
            setUser(parsed);
          } else {
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
          }
        }
      } catch (e) {
        console.warn("Session restore failed:", e);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // Pure JSON Hardcoded Authentication
  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      const matched = (hardcodedUsers as UserAccount[]).find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (!matched) {
        setIsLoading(false);
        return {
          success: false,
          error: "Email tidak terdaftar dalam sistem.",
        };
      }

      if (matched.password !== cleanPass) {
        setIsLoading(false);
        return {
          success: false,
          error: "Password yang Anda masukkan salah.",
        };
      }

      if (!matched.isActive) {
        setIsLoading(false);
        return {
          success: false,
          error: "Akun ini telah dinonaktifkan.",
        };
      }

      const { password: _, ...appUser } = matched;
      setUser(appUser);

      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || "Gagal melakukan login. Silakan coba lagi.",
      };
    }
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
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
