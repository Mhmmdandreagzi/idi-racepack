"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Loader2, ShieldAlert, Check } from "lucide-react";

interface TypedConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  expectedKeyword: string;
  confirmButtonLabel?: string;
  isLoading?: boolean;
}

export default function TypedConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  expectedKeyword,
  confirmButtonLabel = "Ya, Eksekusi Sekarang",
  isLoading = false,
}: TypedConfirmModalProps) {
  const [typedInput, setTypedInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTypedInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = typedInput.trim() === expectedKeyword.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched || isLoading) return;
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-[#111111]/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-[#FAF5EA] border-2 border-[#D71920] rounded-2xl shadow-2xl overflow-hidden text-[#111111] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Danger */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#D71920] text-white border-b border-[#111111]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                KONFIRMASI AKSI KRITIKAL
              </span>
              <h3 className="font-display text-lg font-bold leading-tight">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Warning */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#D71920]/10 border border-[#D71920]/30 text-xs text-[#D71920] flex items-start gap-2.5 leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{description}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#111111] block">
              Ketik teks konfirmasi berikut untuk membuka kunci aksi:
            </label>

            <div className="p-2.5 rounded-lg bg-[#111111] text-[#D4B84C] font-mono text-center font-bold text-sm tracking-wider select-all border border-[#111111]">
              {expectedKeyword}
            </div>

            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Ketik "${expectedKeyword}" di sini`}
              disabled={isLoading}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EA] border-2 border-[#111111] text-xs font-bold text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#D71920] font-mono text-center"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[#111111] border border-[#111111] text-xs font-bold transition text-center cursor-pointer"
            >
              Batalkan
            </button>

            <button
              type="submit"
              disabled={!isMatched || isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#b5141a] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{confirmButtonLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
