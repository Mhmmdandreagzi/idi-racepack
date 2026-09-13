-- Schema Database RUN IDI RUN (MySQL)
-- Sumber Data Utama (Source of Truth) sesuai AGENTS.md

CREATE DATABASE IF NOT EXISTS `idi_racepack` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `idi_racepack`;

-- 1. Tabel Users (Admin & Petugas)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama` VARCHAR(191) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'petugas',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Peserta (Memuat seluruh kolom dari file Excel Normalisasi Data IDI)
CREATE TABLE IF NOT EXISTS `peserta` (
  `id` VARCHAR(64) NOT NULL,
  
  -- Kolom dari Excel 'Normalisasi Data IDI.xlsx'
  `no_urut` INT DEFAULT NULL,                       -- Kolom 'No.'
  `nama` VARCHAR(191) NOT NULL,                     -- Kolom 'NAMA'
  `nama_search` VARCHAR(191) NOT NULL,              -- Normalisasi nama untuk pencarian instan
  `jenis_kelamin` VARCHAR(10) DEFAULT '-',          -- Kolom 'Jenis Kelamin'
  `kategori` VARCHAR(64) NOT NULL,                  -- Kolom 'Kategori'
  `nik` VARCHAR(32) DEFAULT NULL,                   -- Kolom 'NIK'
  `alamat` TEXT DEFAULT NULL,                       -- Kolom 'Alamat'
  `no_telp_1` VARCHAR(32) DEFAULT NULL,             -- Kolom 'No Telp 1'
  `no_telp_2` VARCHAR(32) DEFAULT NULL,             -- Kolom 'No Telp 2'
  `no_hp` VARCHAR(32) DEFAULT NULL,                 -- Alias no_telp_1 untuk kompatibilitas sistem
  `ukuran_jersey` VARCHAR(16) NOT NULL DEFAULT 'L', -- Kolom 'Size Jersey'
  `bib` VARCHAR(64) NOT NULL DEFAULT '',            -- Kolom 'No BIB'
  `no_bib` VARCHAR(64) NOT NULL DEFAULT '',         -- Kolom 'No BIB'
  `nama_bib` VARCHAR(191) DEFAULT NULL,             -- Kolom 'Nama BIB'
  `pendaftaran_melalui` VARCHAR(64) NOT NULL DEFAULT 'UMUM', -- Kolom 'Daftar Melalui'
  `daftar_melalui` VARCHAR(64) NOT NULL DEFAULT 'UMUM',      -- Kolom 'Daftar Melalui'
  `email` VARCHAR(191) DEFAULT NULL,                -- Kolom 'Email'
  `kode_1` VARCHAR(128) DEFAULT NULL,               -- Kolom 'KODE 1'
  `kode_2` VARCHAR(128) DEFAULT NULL,               -- Kolom 'KODE 2'
  
  -- Field Tambahan Sistem
  `tanggal_lahir` VARCHAR(32) DEFAULT NULL,
  
  -- Status Pengambilan Racepack
  `status_pengambilan` TINYINT(1) NOT NULL DEFAULT 0,
  `waktu_pengambilan` DATETIME DEFAULT NULL,
  `petugas_id` VARCHAR(64) DEFAULT NULL,
  `petugas_nama` VARCHAR(191) DEFAULT NULL,
  
  -- Metadata Pengambilan Kolektif / Diwakilkan
  `is_kolektif` TINYINT(1) NOT NULL DEFAULT 0,
  `diambil_oleh` VARCHAR(191) DEFAULT NULL,
  `nik_pengambil` VARCHAR(32) DEFAULT NULL,
  `no_hp_pengambil` VARCHAR(32) DEFAULT NULL,
  `alamat_pengambil` TEXT DEFAULT NULL,
  `catatan` TEXT DEFAULT NULL,
  
  -- Metadata Dokumen Bukti Pembayaran
  `bukti_bayar_path` VARCHAR(255) DEFAULT NULL,
  `bukti_bayar_original_name` VARCHAR(255) DEFAULT NULL,
  `bukti_bayar_size` INT DEFAULT NULL,
  `bukti_bayar_mime` VARCHAR(64) DEFAULT NULL,
  `bukti_bayar_uploaded_at` DATETIME DEFAULT NULL,
  
  -- Metadata Dokumen Surat Kuasa
  `surat_kuasa_path` VARCHAR(255) DEFAULT NULL,
  `surat_kuasa_original_name` VARCHAR(255) DEFAULT NULL,
  `surat_kuasa_size` INT DEFAULT NULL,
  `surat_kuasa_mime` VARCHAR(64) DEFAULT NULL,
  `surat_kuasa_uploaded_at` DATETIME DEFAULT NULL,
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_peserta_bib` (`bib`),
  KEY `idx_peserta_nama_search` (`nama_search`),
  KEY `idx_peserta_nik` (`nik`),
  KEY `idx_peserta_no_hp` (`no_hp`),
  KEY `idx_peserta_no_telp_1` (`no_telp_1`),
  KEY `idx_peserta_email` (`email`),
  KEY `idx_peserta_kode_1` (`kode_1`),
  KEY `idx_peserta_status` (`status_pengambilan`),
  KEY `idx_peserta_kategori` (`kategori`),
  KEY `idx_peserta_sumber` (`pendaftaran_melalui`),
  CONSTRAINT `fk_peserta_petugas` FOREIGN KEY (`petugas_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Pengambilan (Audit & Histori Serah Terima)
CREATE TABLE IF NOT EXISTS `pengambilan` (
  `id` VARCHAR(64) NOT NULL,
  `peserta_id` VARCHAR(64) DEFAULT NULL, -- NULL jika aksi reset massal / log sistem
  `petugas_id` VARCHAR(64) NOT NULL,
  `petugas_nama` VARCHAR(191) NOT NULL,
  `petugas_email` VARCHAR(191) NOT NULL,
  `waktu_pengambilan` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(32) NOT NULL DEFAULT 'BERHASIL',
  `is_kolektif` TINYINT(1) NOT NULL DEFAULT 0,
  `diambil_oleh` VARCHAR(191) DEFAULT NULL,
  `nik_pengambil` VARCHAR(32) DEFAULT NULL,
  `no_hp_pengambil` VARCHAR(32) DEFAULT NULL,
  `alamat_pengambil` TEXT DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pengambilan_peserta` (`peserta_id`),
  KEY `idx_pengambilan_petugas` (`petugas_id`),
  KEY `idx_pengambilan_waktu` (`waktu_pengambilan`),
  CONSTRAINT `fk_pengambilan_peserta` FOREIGN KEY (`peserta_id`) REFERENCES `peserta` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pengambilan_petugas` FOREIGN KEY (`petugas_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Dokumen Peserta (Mendukung Banyak Foto / Dokumen dalam 1 Pengambilan)
CREATE TABLE IF NOT EXISTS `peserta_dokumen` (
  `id` VARCHAR(64) NOT NULL,
  `peserta_id` VARCHAR(64) NOT NULL,
  `category` VARCHAR(32) NOT NULL, -- 'surat_kuasa' | 'bukti_bayar'
  `file_path` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(64) NOT NULL DEFAULT 'application/octet-stream',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dokumen_peserta` (`peserta_id`),
  KEY `idx_dokumen_category` (`category`),
  CONSTRAINT `fk_dokumen_peserta` FOREIGN KEY (`peserta_id`) REFERENCES `peserta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
