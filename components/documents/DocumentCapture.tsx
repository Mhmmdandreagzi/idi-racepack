"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
  Plus,
} from "lucide-react";

import { useToast } from "@/context/ToastContext";
import { PesertaDokumen } from "@/types/peserta";
import { getPesertaDocuments } from "@/lib/services/documentService";
import CameraModal from "@/components/documents/CameraModal";

interface DocumentCaptureProps {
  label: string;
  category: "bukti_bayar" | "surat_kuasa";
  pesertaId?: string;
  existingPath?: string | null;
  existingName?: string | null;
  // Single file mode (default)
  selectedFile?: File | null;
  onFileChange?: (file: File | null) => void;
  // Multiple files mode (for Surat Kuasa)
  allowMultiple?: boolean;
  selectedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function DocumentCapture({
  label,
  category,
  pesertaId,
  existingPath,
  existingName,
  selectedFile = null,
  onFileChange,
  allowMultiple = false,
  selectedFiles = [],
  onFilesChange,
  required = false,
  disabled = false,
  helperText,
}: DocumentCaptureProps) {
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-app live camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Single file preview
  const [singlePreviewUrl, setSinglePreviewUrl] = useState<string | null>(null);

  // Multiple files previews: map of fileName+size -> objectUrl
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // Existing documents fetched from API if in multi-file mode
  const [existingDocs, setExistingDocs] = useState<PesertaDokumen[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Load existing documents when pesertaId and existingPath are present
  useEffect(() => {
    if (!pesertaId || !existingPath) {
      setExistingDocs([]);
      return;
    }

    let isMounted = true;
    setIsLoadingExisting(true);
    getPesertaDocuments(pesertaId, category)
      .then((docs) => {
        if (isMounted) {
          setExistingDocs(docs);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingExisting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pesertaId, existingPath, category]);

  // Handle single file preview
  useEffect(() => {
    if (allowMultiple) return;
    if (!selectedFile) {
      setSinglePreviewUrl(null);
      return;
    }

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setSinglePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setSinglePreviewUrl(null);
    }
  }, [selectedFile, allowMultiple]);

  // Handle multiple files preview
  useEffect(() => {
    if (!allowMultiple) return;
    const newPreviews: Record<string, string> = {};

    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        newPreviews[key] = URL.createObjectURL(file);
      }
    });

    setPreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles, allowMultiple]);

  // Format size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Add files to single or multiple state
  const handleIncomingFiles = (incomingList: FileList | null) => {
    if (!incomingList || incomingList.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < incomingList.length; i++) {
      const f = incomingList[i];
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(`File "${f.name}" terlalu besar. Maksimum 5 MB.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    if (allowMultiple) {
      const currentList = selectedFiles || [];
      // Filter out duplicate names with exact same size
      const newUnique = validFiles.filter(
        (nf) => !currentList.some((cf) => cf.name === nf.name && cf.size === nf.size)
      );

      if (newUnique.length > 0) {
        const updated = [...currentList, ...newUnique];
        onFilesChange?.(updated);
        toast.info(`${newUnique.length} foto/berkas ditambahkan (${updated.length} total).`);
      } else {
        toast.warning("File tersebut sudah ada dalam daftar.");
      }
    } else {
      // Single file mode
      const chosen = validFiles[0];
      onFileChange?.(chosen);
      toast.info(`File "${chosen.name}" siap dilampirkan.`);
    }

    // Reset input elements so change event triggers again for identical file re-capture
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveSingle = () => {
    onFileChange?.(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveMultiItem = (indexToRemove: number) => {
    if (!allowMultiple) return;
    const updated = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    onFilesChange?.(updated);
  };

  // Called when a photo is snapped inside CameraModal
  const handleCameraCapture = (file: File) => {
    if (allowMultiple) {
      const currentList = selectedFiles || [];
      const updated = [...currentList, file];
      onFilesChange?.(updated);
    } else {
      onFileChange?.(file);
      toast.info(`Foto "${file.name}" berhasil diambil.`);
    }
  };

  const handleCameraClick = () => {
    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      setIsCameraOpen(true);
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const totalUploadedCount = (existingDocs.length > 0 ? existingDocs.length : existingPath ? 1 : 0);

  return (
    <div className="p-3.5 rounded-xl bg-[#F3E8D2] border border-[#D8CDB8] space-y-2.5">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleIncomingFiles(e.target.files)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple={allowMultiple}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleIncomingFiles(e.target.files)}
      />

      {/* Header Label & Badges */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#111111] flex items-center gap-1.5 uppercase tracking-wide">
          <FileText className="w-3.5 h-3.5 text-[#D71920]" />
          <span>{label}</span>
          {required && <span className="text-[#D71920] font-bold">*</span>}
          {allowMultiple && (
            <span className="text-[10px] font-bold text-[#D71920] bg-[#D71920]/10 px-1.5 py-0.5 rounded border border-[#D71920]/20 normal-case tracking-normal">
              Bisa banyak foto
            </span>
          )}
        </label>

        {existingPath && !selectedFile && selectedFiles.length === 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#26734D] bg-[#26734D]/10 px-2 py-0.5 rounded border border-[#26734D]/30">
            <CheckCircle2 className="w-3 h-3" />
            {totalUploadedCount > 1
              ? `${totalUploadedCount} Berkas Tersedia`
              : "Tersedia di Sistem"}
          </span>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-[#111111]/70 leading-relaxed font-medium">
          {helperText}
        </p>
      )}

      {/* MULTIPLE FILES MODE */}
      {allowMultiple ? (
        <div className="space-y-2">
          {/* List of Newly Selected Files / Photos */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/60">
                Foto / Berkas Baru Siap Diunggah ({selectedFiles.length}):
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                {selectedFiles.map((file, idx) => {
                  const previewKey = `${file.name}_${file.size}_${file.lastModified}`;
                  const imgUrl = previews[previewKey];

                  return (
                    <div
                      key={previewKey || idx}
                      className="p-2 rounded-lg bg-[#FAF5EA] border border-[#26734D] flex items-center justify-between gap-2 transition hover:bg-[#F3E8D2]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-10 h-10 object-cover rounded border border-[#D8CDB8] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#111111] text-[#D4B84C] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#26734D] bg-[#26734D]/10 px-1.5 py-0.2 rounded">
                              Foto #{idx + 1}
                            </span>
                            <span className="text-[10px] text-[#111111]/50 font-mono">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#111111] truncate mt-0.5">
                            {file.name}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMultiItem(idx)}
                        disabled={disabled}
                        className="p-1 text-[#D71920] hover:bg-[#E6D8BE] rounded-md transition"
                        title="Hapus foto ini"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Existing Saved Documents (if already stored in DB) */}
          {existingPath && pesertaId && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/60">
                Berkas Surat Kuasa Tersimpan:
              </span>

              {existingDocs.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {existingDocs.map((doc, dIdx) => (
                    <div
                      key={doc.id || dIdx}
                      className="p-2 rounded-lg bg-[#FAF5EA] border border-[#D8CDB8] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded bg-[#26734D]/15 text-[#26734D] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-[#26734D]">
                            Lampiran #{dIdx + 1}
                          </span>
                          <p className="text-xs font-bold text-[#111111] truncate">
                            {doc.original_name}
                          </p>
                        </div>
                      </div>

                      <a
                        href={doc.file_path ? `/api/documents/${pesertaId}/${category}?docId=${doc.id}` : `/api/documents/${pesertaId}/${category}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[11px] font-bold text-[#26734D] border border-[#26734D]/30 inline-flex items-center gap-1 transition shrink-0"
                      >
                        <span>Lihat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-[#FAF5EA] border border-[#D8CDB8] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#26734D]/15 text-[#26734D] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111111] truncate">
                        {existingName || "Dokumen Terlampir"}
                      </p>
                      <a
                        href={`/api/documents/${pesertaId}/${category}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#26734D] hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <span>Lihat Dokumen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons for Adding Photos/Files */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={disabled}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer ${
                selectedFiles.length > 0
                  ? "bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[#D71920] border-2 border-[#D71920]"
                  : "bg-[#D71920] hover:bg-[#b5141a] text-white"
              }`}
            >
              {selectedFiles.length > 0 ? (
                <Plus className="w-3.5 h-3.5" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span>
                {selectedFiles.length > 0
                  ? "+ Tambah Foto (Kamera)"
                  : "Ambil Foto Kamera"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleFileClick}
              disabled={disabled}
              className="flex-1 py-2 px-3 rounded-lg bg-[#FAF5EA] hover:bg-[#E6D8BE] active:bg-[#d8cbb0] text-[#111111] border-2 border-[#111111] text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {selectedFiles.length > 0 ? (
                <Plus className="w-3.5 h-3.5" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {selectedFiles.length > 0
                  ? "+ Tambah Berkas / File"
                  : "Pilih File / Galeri"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* SINGLE FILE MODE (For Bukti Pembayaran) */
        <div>
          {selectedFile ? (
            <div className="p-2.5 rounded-lg bg-[#FAF5EA] border-2 border-[#26734D] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {singlePreviewUrl ? (
                  <img
                    src={singlePreviewUrl}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-md border border-[#D8CDB8] shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-[#111111] text-[#D4B84C] flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#26734D] uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    File Siap Diunggah
                  </span>
                  <p className="text-xs font-bold text-[#111111] truncate">
                    {selectedFile.name}
                  </p>
                  <span className="text-[11px] text-[#111111]/60 font-mono">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveSingle}
                disabled={disabled}
                className="p-1.5 text-[#D71920] hover:bg-[#E6D8BE] rounded-lg transition"
                title="Hapus / Ganti File"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : existingPath && pesertaId ? (
            <div className="p-2.5 rounded-lg bg-[#FAF5EA] border border-[#D8CDB8] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded bg-[#26734D]/15 text-[#26734D] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate">
                    {existingName || "Dokumen Terlampir"}
                  </p>
                  <a
                    href={`/api/documents/${pesertaId}/${category}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#26734D] hover:underline font-bold inline-flex items-center gap-1 mt-0.5"
                  >
                    <span>Lihat Dokumen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={disabled}
                  className="px-2.5 py-1.5 rounded-md bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[11px] font-bold text-[#111111] border border-[#111111] flex items-center gap-1 transition"
                  title="Ambil foto ulang"
                >
                  <Camera className="w-3.5 h-3.5 text-[#D71920]" />
                  <span>Foto Ulang</span>
                </button>
                <button
                  type="button"
                  onClick={handleFileClick}
                  disabled={disabled}
                  className="px-2.5 py-1.5 rounded-md bg-[#FAF5EA] hover:bg-[#E6D8BE] text-[11px] font-bold text-[#111111] border border-[#D8CDB8] flex items-center gap-1 transition"
                  title="Ganti file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={disabled}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#D71920] hover:bg-[#b5141a] active:bg-[#961015] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Ambil Foto Kamera</span>
              </button>

              <button
                type="button"
                onClick={handleFileClick}
                disabled={disabled}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#FAF5EA] hover:bg-[#E6D8BE] active:bg-[#d8cbb0] text-[#111111] border-2 border-[#111111] text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#111111]" />
                <span>Pilih File / Galeri</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* In-app live WebRTC camera modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        allowMultiple={allowMultiple}
        title={`Kamera ${label}`}
      />
    </div>
  );
}
