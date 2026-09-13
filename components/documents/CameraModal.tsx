"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  RotateCcw,
  Check,
  RefreshCw,
  AlertCircle,
  Images,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  allowMultiple?: boolean;
  title?: string;
}

export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
  allowMultiple = false,
  title = "Ambil Foto Dokumen",
}: CameraModalProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Single-mode preview state
  const [capturedPreview, setCapturedPreview] = useState<{
    url: string;
    file: File;
  } | null>(null);

  // Multi-mode captured count in this session
  const [sessionCapturedCount, setSessionCapturedCount] = useState(0);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setIsLoading(true);
    setErrorMsg(null);

    // Check if mediaDevices is supported
    if (typeof navigator === "undefined" || typeof navigator.mediaDevices?.getUserMedia !== "function") {
      setErrorMsg(
        "Fitur kamera web tidak didukung pada browser ini atau memerlukan koneksi aman (HTTPS / localhost)."
      );
      setIsLoading(false);
      return;
    }

    try {
      // Find video devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevs);

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: activeDeviceId
          ? { deviceId: { exact: activeDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      let message = "Tidak dapat mengakses kamera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Izin akses kamera ditolak. Silakan berikan izin kamera pada pengaturan browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "Perangkat kamera tidak ditemukan.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        message = "Kamera sedang digunakan oleh aplikasi lain.";
      }
      setErrorMsg(message);
      setIsLoading(false);
    }
  }, [activeDeviceId, facingMode, stopStream]);

  // Start / stop stream on modal open/close
  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      setSessionCapturedCount(0);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Switch between front and rear cameras
  const handleSwitchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex((d) => d.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setActiveDeviceId(devices[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
      setActiveDeviceId(null);
    }
  };

  // Shutter flash effect
  const [isFlashing, setIsFlashing] = useState(false);

  // Capture current video frame to JPEG file
  const handleTakeShutter = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const timestamp = Date.now();
        const file = new File([blob], `foto_${timestamp}.jpg`, {
          type: "image/jpeg",
          lastModified: timestamp,
        });

        if (allowMultiple) {
          // Immediately send to parent and keep camera alive for next photo
          onCapture(file);
          setSessionCapturedCount((prev) => prev + 1);
          toast.success(`Foto #${sessionCapturedCount + 1} berhasil diambil!`);
        } else {
          // Single mode: show preview for confirmation
          const url = URL.createObjectURL(blob);
          setCapturedPreview({ url, file });
        }
      },
      "image/jpeg",
      0.9
    );
  };

  // Single-mode confirm
  const handleConfirmSingle = () => {
    if (capturedPreview) {
      onCapture(capturedPreview.file);
      onClose();
    }
  };

  // Single-mode retake
  const handleRetakeSingle = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview.url);
      setCapturedPreview(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-[#111111]/90 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl shadow-2xl overflow-hidden text-[#111111] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#111111] bg-[#111111] text-[#F3E8D2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D71920] text-white flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white leading-tight">
                {title}
              </h3>
              {allowMultiple && (
                <span className="text-[10px] text-[#D4B84C] font-bold uppercase tracking-wider">
                  Mode Multi-Foto (Bisa jepret berkali-kali)
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#F3E8D2]/70 hover:text-white hover:bg-white/10 transition"
            title="Tutup Kamera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center overflow-hidden">
          {/* Visual Shutter Flash */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-150" />
          )}

          {errorMsg ? (
            /* Error Fallback */
            <div className="p-6 text-center text-white space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-[#D71920]/20 text-[#D71920] flex items-center justify-center mx-auto border border-[#D71920]/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[#111111] text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : capturedPreview ? (
            /* Single-mode Captured Preview */
            <div className="relative w-full h-full">
              <img
                src={capturedPreview.url}
                alt="Captured Preview"
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 bg-[#111111]/80 text-[#D4B84C] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                Pratinjau Hasil Foto
              </div>
            </div>
          ) : (
            /* Live Video Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Document Framing Guides */}
              <div className="absolute inset-4 sm:inset-6 pointer-events-none border-2 border-white/40 rounded-xl border-dashed">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4B84C]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4B84C]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4B84C]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4B84C]" />
              </div>

              {/* Live Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#111111]/80 px-2.5 py-1 rounded-full text-white text-[10px] font-bold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#D71920] animate-pulse" />
                <span>KAMERA AKTIF</span>
              </div>

              {/* Multi-photo badge */}
              {allowMultiple && (
                <div className="absolute top-3 right-3 bg-[#26734D] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-md">
                  <Images className="w-3 h-3" />
                  <span>{sessionCapturedCount} Foto Diambil</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-[#F3E8D2] border-t border-[#D8CDB8] flex items-center justify-between gap-3">
          {capturedPreview ? (
            /* Single-mode Confirmation Controls */
            <div className="w-full flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRetakeSingle}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[#111111] border border-[#111111] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Foto Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmSingle}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#26734D] hover:bg-[#1f5c3d] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Foto Ini</span>
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="w-full flex items-center justify-between">
              {/* Switch Camera Button (if multiple devices) */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={isLoading || Boolean(errorMsg)}
                className="p-2.5 rounded-full bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[#111111] border border-[#D8CDB8] transition shadow-sm disabled:opacity-40 cursor-pointer"
                title="Ganti / Balik Kamera"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Shutter Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleTakeShutter}
                  disabled={isLoading || Boolean(errorMsg)}
                  className="w-14 h-14 rounded-full bg-[#D71920] hover:bg-[#b5141a] active:scale-95 text-white flex items-center justify-center shadow-lg border-4 border-white transition disabled:opacity-40 cursor-pointer"
                  title="Jepret Foto"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <span className="text-[10px] font-bold text-[#111111]/70 mt-1 uppercase tracking-wider">
                  Jepret Foto
                </span>
              </div>

              {/* Multi-mode Done Button or Close Button */}
              {allowMultiple ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg bg-[#111111] hover:bg-[#333333] text-[#F3E8D2] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Selesai</span>
                  {sessionCapturedCount > 0 && (
                    <span className="bg-[#D71920] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {sessionCapturedCount}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[#111111] border border-[#D8CDB8] transition shadow-sm cursor-pointer"
                  title="Batal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
