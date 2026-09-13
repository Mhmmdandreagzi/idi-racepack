"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
} from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    error: (msg: string, duration?: number) => void;
    success: (msg: string, duration?: number) => void;
    warning: (msg: string, duration?: number) => void;
    info: (msg: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    error: (msg: string, dur?: number) => addToast("error", msg, dur),
    success: (msg: string, dur?: number) => addToast("success", msg, dur),
    warning: (msg: string, dur?: number) => addToast("warning", msg, dur),
    info: (msg: string, dur?: number) => addToast("info", msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Global Toast Floating Container (z-[9999] floats above modals & headers) */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 w-full max-w-md px-4 pointer-events-none select-none">
        {toasts.map((t) => {
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto w-full flex items-start justify-between gap-3 p-3.5 rounded-xl border-2 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${
                t.type === "error"
                  ? "bg-[#FAF5EA] border-[#D71920] text-[#111111]"
                  : t.type === "success"
                  ? "bg-[#FAF5EA] border-[#26734D] text-[#111111]"
                  : t.type === "warning"
                  ? "bg-[#FAF5EA] border-[#D4B84C] text-[#111111]"
                  : "bg-[#FAF5EA] border-[#111111] text-[#111111]"
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {t.type === "error" && (
                  <div className="w-6 h-6 rounded-md bg-[#D71920] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle className="w-4 h-4" />
                  </div>
                )}
                {t.type === "success" && (
                  <div className="w-6 h-6 rounded-md bg-[#26734D] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {t.type === "warning" && (
                  <div className="w-6 h-6 rounded-md bg-[#D4B84C] text-[#111111] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {t.type === "info" && (
                  <div className="w-6 h-6 rounded-md bg-[#111111] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      t.type === "error"
                        ? "text-[#D71920]"
                        : t.type === "success"
                        ? "text-[#26734D]"
                        : t.type === "warning"
                        ? "text-[#D4B84C]"
                        : "text-[#111111]"
                    }`}
                  >
                    {t.type === "error"
                      ? "Pemberitahuan Sistem"
                      : t.type === "success"
                      ? "Berhasil"
                      : t.type === "warning"
                      ? "Perhatian"
                      : "Informasi"}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#111111] leading-snug mt-0.5 break-words">
                    {t.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md text-[#111111]/50 hover:text-[#111111] hover:bg-[#E6D8BE] transition shrink-0"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
