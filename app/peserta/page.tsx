"use client";

import React, { useState } from "react";
import { usePesertaSearch } from "@/hooks/usePesertaSearch";
import { Peserta } from "@/types/peserta";
import SearchBar from "@/components/search/SearchBar";
import FilterChips from "@/components/search/FilterChips";
import PesertaCard from "@/components/peserta/PesertaCard";
import PesertaDetailModal from "@/components/peserta/PesertaDetailModal";
import PickupSuccessModal from "@/components/pengambilan/PickupSuccessModal";
import CollectivePickupModal from "@/components/pengambilan/CollectivePickupModal";
import CollectiveSuccessModal from "@/components/pengambilan/CollectiveSuccessModal";
import { CollectivePickupResult } from "@/lib/services/pickupService";
import AuthGuard from "@/components/auth/AuthGuard";
import { PackageCheck, SearchX, RefreshCw, Search, Users } from "lucide-react";

function PesertaContent() {
  const {
    filteredPeserta,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    hasSearched,
    isLoading,
    error,
    executeSearch,
    updateLocalPeserta,
    categories,
    sources,
  } = usePesertaSearch();

  // Selected participant for modal
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  // Just confirmed participant for success modal
  const [successPeserta, setSuccessPeserta] = useState<Peserta | null>(null);

  // Collective proxy pickup modal states
  const [isCollectiveModalOpen, setIsCollectiveModalOpen] = useState(false);
  const [collectiveSuccessData, setCollectiveSuccessData] = useState<CollectivePickupResult | null>(null);

  // Pagination limit for ultra fast DOM rendering on mobile devices
  const [displayLimit, setDisplayLimit] = useState(30);

  const handlePickupSuccess = (updated: Peserta) => {
    updateLocalPeserta(updated.id, updated);
    setSelectedPeserta(null);
    if (updated.status_pengambilan) {
      setSuccessPeserta(updated);
    }
  };

  const handleCollectiveSuccess = (result: CollectivePickupResult) => {
    // Update local state for all participants in the collective pickup
    result.updatedPeserta.forEach((p) => {
      updateLocalPeserta(p.id, p);
    });
    setIsCollectiveModalOpen(false);
    setCollectiveSuccessData(result);
  };

  const handleTriggerSearch = () => {
    if (!searchQuery.trim()) return;
    setDisplayLimit(30);
    executeSearch();
  };

  const displayedList = filteredPeserta.slice(0, displayLimit);
  const hasMore = filteredPeserta.length > displayLimit;

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Search Bar & Instant Stats Header */}
      <section className="bg-[#FAF5EA] border-2 border-[#111111] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8CDB8] pb-3 gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#111111] text-[#D4B84C] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#111111] leading-none">
                MEJA PENGAMBILAN RACEPACK
              </h1>
              <span className="text-[11px] font-bold text-[#26734D] italic mt-0.5 block">
                RUN IDI RUN 5K • Langkah Sehat Untuk Negeri
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsCollectiveModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#111111] hover:bg-[#D71920] px-3.5 py-1.5 sm:py-2 rounded-lg border-2 border-[#111111] transition shadow-sm"
              title="Buka form serah terima racepack kolektif (diwakilkan)"
            >
              <Users className="w-4 h-4 text-[#D4B84C]" />
              <span>Pengambilan Kolektif (Diwakilkan)</span>
            </button>

            {hasSearched && (
              <button
                onClick={handleTriggerSearch}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-bold text-[#111111] bg-[#E6D8BE] hover:bg-[#D8CDB8] px-3 py-1.5 sm:py-2 rounded-lg border border-[#D8CDB8] transition disabled:opacity-50"
                title="Perbarui hasil pencarian dari Cloud Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#D71920]" : ""}`} />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input with Cari Button */}
        <SearchBar
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          onSearch={handleTriggerSearch}
          filteredCount={filteredPeserta.length}
          isLoading={isLoading}
          hasSearched={hasSearched}
        />

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
          }}
          categories={categories}
          sources={sources}
        />
      </section>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FAF5EA] border-2 border-[#D71920] text-[#D71920] text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button
            onClick={handleTriggerSearch}
            className="underline text-xs font-bold uppercase hover:text-[#111111]"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Participant List / Initial Prompt State */}
      <section className="space-y-2.5">
        {!hasSearched ? (
          <div className="py-12 sm:py-16 text-center space-y-3 bg-[#FAF5EA] rounded-2xl border-2 border-dashed border-[#D8CDB8] p-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E6D8BE] flex items-center justify-center text-[#111111] shadow-sm">
              <Search className="w-7 h-7 text-[#D71920]" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl text-[#111111]">
              PENCARIAN PESERTA RACEPACK
            </h3>
            <p className="text-xs sm:text-sm text-[#111111]/70 max-w-md mx-auto font-medium leading-relaxed">
              Masukkan nama peserta, nomor BIB, NIK, atau nomor HP di kolom pencarian dan tentukan filter yang diinginkan, kemudian klik tombol <strong className="text-[#D71920] font-bold">Cari Peserta</strong>.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#111111]/70">
              <span className="bg-[#E6D8BE] px-3 py-1 rounded-lg font-bold border border-[#D8CDB8]">
                💡 Tekan Enter atau klik &ldquo;Cari Peserta&rdquo;
              </span>
              <span className="bg-[#E6D8BE] px-3 py-1 rounded-lg font-bold border border-[#D8CDB8]">
                ⚡ Pure Cloud Firestore on-demand
              </span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center space-y-3 bg-[#FAF5EA] rounded-2xl border border-[#D8CDB8]">
            <RefreshCw className="w-8 h-8 text-[#D71920] animate-spin mx-auto" />
            <p className="font-display text-2xl text-[#111111]">
              MENGAMBIL DATA DARI FIRESTORE...
            </p>
            <p className="text-xs text-[#111111]/70">
              Memproses kueri peserta ke server Cloud Firestore
            </p>
          </div>
        ) : filteredPeserta.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#FAF5EA] rounded-2xl border border-[#D8CDB8] p-6">
            <SearchX className="w-12 h-12 text-[#111111]/30 mx-auto" />
            <h3 className="font-display text-2xl text-[#111111]">PESERTA TIDAK DITEMUKAN</h3>
            <p className="text-xs text-[#111111]/70 max-w-sm mx-auto font-medium">
              Tidak ada peserta berstatus <strong>Belum Diambil</strong> yang cocok dengan kata kunci &quot;{searchQuery}&quot; atau filter yang dipilih di Cloud Firestore.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2.5">
              {displayedList.map((peserta) => (
                <PesertaCard
                  key={peserta.id}
                  peserta={peserta}
                  onSelect={(p) => setSelectedPeserta(p)}
                />
              ))}
            </div>

            {/* Load more pagination */}
            {hasMore && (
              <div className="text-center pt-2 pb-6">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 30)}
                  className="px-6 py-2.5 rounded-lg bg-[#FAF5EA] hover:bg-[#E6D8BE] text-xs font-bold text-[#111111] border-2 border-[#111111] transition"
                >
                  Tampilkan lebih banyak ({filteredPeserta.length - displayLimit} data lagi)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Participant Detail & Pickup Modal */}
      {selectedPeserta && (
        <PesertaDetailModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
          onPickupSuccess={handlePickupSuccess}
        />
      )}

      {/* Pickup Success Modal */}
      {successPeserta && (
        <PickupSuccessModal
          peserta={successPeserta}
          onClose={() => setSuccessPeserta(null)}
        />
      )}

      {/* Collective Pickup Modal */}
      {isCollectiveModalOpen && (
        <CollectivePickupModal
          onClose={() => setIsCollectiveModalOpen(false)}
          onSuccess={handleCollectiveSuccess}
        />
      )}

      {/* Collective Pickup Success Receipt Modal */}
      {collectiveSuccessData && (
        <CollectiveSuccessModal
          data={collectiveSuccessData}
          onClose={() => setCollectiveSuccessData(null)}
        />
      )}
    </main>
  );
}

export default function PesertaPage() {
  return (
    <AuthGuard>
      <PesertaContent />
    </AuthGuard>
  );
}
