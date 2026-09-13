# AGENTS.md --- RUN IDI RUN

## 1. Scope

Dokumen ini hanya mengatur **rules teknis, aturan bisnis, keamanan, dan
alur bisnis** aplikasi RUN IDI RUN.

**Jangan mengubah style, desain visual, layout, struktur halaman, warna,
typography, atau page yang sudah tersedia.**

Jika ada kebutuhan perubahan UI, pertahankan design system dan page
existing sebagai sumber kebenaran.

------------------------------------------------------------------------

## 2. Stack & Infrastruktur

Aplikasi menggunakan:

-   Next.js full-stack
-   TypeScript
-   Tailwind CSS
-   MySQL
-   Hostinger Unlimited
-   File storage menggunakan storage/server filesystem Hostinger

Firebase tidak digunakan sebagai backend aplikasi.

------------------------------------------------------------------------

## 3. Prinsip Utama

1.  MySQL adalah sumber data utama (source of truth).
2.  File dokumen disimpan di storage Hostinger, bukan di MySQL.
3.  MySQL hanya menyimpan metadata/path file.
4.  Semua operasi penting harus divalidasi di server.
5.  Jangan mempercayai data dari browser/client.
6.  Authentication dan authorization harus dilakukan server-side.
7.  Jangan pernah menyimpan password plaintext.
8.  Jangan mengekspos credential database atau secret ke client.
9.  Jangan membuat file bukti pembayaran atau surat kuasa menjadi
    public.
10. Jangan mengubah UI/page yang sudah tersedia hanya untuk menyesuaikan
    implementasi backend.

------------------------------------------------------------------------

## 4. Roles

### Admin

Admin dapat:

-   Login.
-   Melihat dashboard.
-   Melihat seluruh peserta.
-   Mencari peserta.
-   Mengelola user/petugas.
-   Melihat status pengambilan.
-   Melihat dokumen peserta.
-   Mengelola atau mengoreksi data pengambilan sesuai aturan (hanya admin).
-   Melakukan import data peserta.
-   Melihat statistik.

### Petugas

Petugas dapat:

-   Login.
-   Mencari peserta.
-   Melihat detail peserta yang diperlukan untuk proses racepack.
-   Melihat bukti pembayaran/surat kuasa jika memiliki hak akses.
-   Melakukan proses pengambilan racepack.
-   Melihat status bahwa peserta sudah/belum mengambil.

Petugas **tidak boleh**:

-   Menghapus peserta.
-   Menghapus user.
-   Mengubah data master peserta secara bebas.
-   Mengubah histori pengambilan secara langsung.
-   Mengakses fungsi administrasi yang hanya diperuntukkan bagi admin.

------------------------------------------------------------------------

## 5. Aturan Data Peserta

Setiap peserta memiliki ID internal yang unik.

**BIB bukan primary key dan bukan ID database.**

BIB dapat:

-   kosong pada sebagian data sumber;
-   memiliki format berbeda;
-   berpotensi duplikat pada data sumber.

Karena itu jangan mengasumsikan BIB selalu unik secara database.

Data peserta minimal dapat mencakup:

-   id
-   nama
-   bib
-   kategori
-   nik
-   no_hp
-   jenis_kelamin
-   tanggal_lahir
-   alamat
-   ukuran_jersey
-   pendaftaran_melalui
-   metadata bukti pembayaran
-   metadata surat kuasa
-   created_at
-   updated_at

Jangan melakukan auto-merge peserta hanya karena nama sama.

------------------------------------------------------------------------

## 6. Aturan Pengambilan Racepack

1.  Satu peserta hanya boleh memiliki satu pengambilan sukses.
2.  Petugas harus login.
3.  Server harus memverifikasi role petugas/admin.
4.  Sebelum mencatat pengambilan, server harus memeriksa status terbaru
    peserta.
5.  Proses pengecekan dan pencatatan harus menggunakan database
    transaction.
6.  Gunakan row locking (`SELECT ... FOR UPDATE`) atau mekanisme
    transaksi setara.
7.  Jika peserta sudah diambil, request berikutnya harus ditolak sebagai
    **sudah diambil**, bukan membuat record kedua.
8.  Waktu pengambilan dicatat dari server/database, bukan dipercaya dari
    browser.
9.  ID petugas yang melakukan pengambilan wajib dicatat.
10. Histori pengambilan tidak boleh diubah oleh petugas biasa.

Contoh transaksi:

``` text
BEGIN TRANSACTION
    ↓
Lock peserta/pengambilan
    ↓
Cek apakah sudah diambil
    ↓
Jika sudah:
    ROLLBACK
    → tampilkan "Racepack sudah diambil"
    ↓
Jika belum:
    INSERT pengambilan
    ↓
COMMIT
```

Jika dua petugas melakukan proses pada peserta yang sama secara
bersamaan, hanya satu transaksi yang boleh berhasil.

------------------------------------------------------------------------

## 7. Aturan File

### Bukti pembayaran

Format:

-   JPG/JPEG
-   PNG
-   WebP
-   PDF

Maksimum ukuran default: **5 MB per file**.

### Surat kuasa

Format:

-   PDF
-   JPG/JPEG
-   PNG

Maksimum ukuran default: **5 MB per file**.

Batas ukuran dan tipe file harus mudah dikonfigurasi.

------------------------------------------------------------------------

## 8. Keamanan File

File bukti pembayaran dan surat kuasa dapat mengandung data pribadi.

Rules:

1.  Jangan menyimpan file di folder public.
2.  Jangan membuat direct public URL.
3.  Nama file asli dari user tidak boleh menjadi nama file penyimpanan
    utama.
4.  Generate nama file internal yang aman.
5.  Validasi extension.
6.  Validasi MIME/content type.
7.  Validasi ukuran file di server.
8.  Jangan hanya mengandalkan validasi JavaScript di browser.
9.  Akses file harus melalui endpoint/server yang memeriksa
    authentication dan authorization.
10. Jangan mengirim credential storage ke browser.
11. Jangan menyimpan binary file sebagai BLOB/Base64 di MySQL.

Contoh struktur:

``` text
/storage
  /peserta
    /{peserta_id}
      bukti-bayar.{ext}
      surat-kuasa.{ext}
```

Metadata file disimpan di MySQL, misalnya:

``` text
bukti_bayar_path
bukti_bayar_original_name
bukti_bayar_size
bukti_bayar_mime
bukti_bayar_uploaded_at

surat_kuasa_path
surat_kuasa_original_name
surat_kuasa_size
surat_kuasa_mime
surat_kuasa_uploaded_at
```

------------------------------------------------------------------------

## 9. Aturan Upload File

Alur:

``` text
Client
  ↓
Authentication check
  ↓
Authorization check
  ↓
Validasi file di server
  ↓
Generate storage filename
  ↓
Simpan file ke Hostinger storage
  ↓
Simpan metadata ke MySQL
  ↓
Response sukses
```

Jika penyimpanan file berhasil tetapi insert/update MySQL gagal, sistem
harus menangani orphan file.

Jika database berhasil mencatat file tetapi file gagal disimpan, sistem
tidak boleh meninggalkan metadata file yang tidak valid.

------------------------------------------------------------------------

## 10. Aturan View/Download File

File tidak boleh diberikan hanya karena user mengetahui path file.

Alur:

``` text
Request file
  ↓
Check session
  ↓
Check role
  ↓
Check akses terhadap peserta/file
  ↓
Read file dari storage
  ↓
Return file
```

Dokumen sensitif tidak boleh berada di:

``` text
/public/uploads/
```

------------------------------------------------------------------------

## 11. Authentication

-   Gunakan session authentication yang aman.
-   Password wajib di-hash menggunakan algoritma password hashing yang
    aman.
-   Password plaintext tidak boleh disimpan.
-   Password tidak boleh dikirim kembali ke client.
-   Session harus memiliki expiry.
-   Logout harus menginvalidasi session.
-   Endpoint sensitif wajib memeriksa session di server.
-   Role harus diverifikasi di server.
-   Role dari client bukan sumber kebenaran.

------------------------------------------------------------------------

## 12. Authorization

Authorization wajib dilakukan pada setiap server action/API yang
sensitif.

Client-side check hanya untuk UX.

Security boundary sebenarnya harus berada di server.

------------------------------------------------------------------------

## 13. Aturan Database

Gunakan transaction untuk operasi yang membutuhkan konsistensi.

Terutama:

-   Pengambilan racepack.
-   Perubahan status pengambilan.
-   Operasi yang mengubah beberapa tabel sekaligus.
-   Operasi yang dapat mengalami race condition.

Gunakan foreign key untuk relasi penting.

Relasi utama:

``` text
users
  │
  └── pengambilan.petugas_id

peserta
  │
  └── pengambilan.peserta_id
```

`pengambilan.peserta_id` harus mereferensikan peserta yang valid.

------------------------------------------------------------------------

## 14. Pencarian Peserta

Jumlah peserta sekitar 1.161, sehingga pencarian harus terasa instan.

Pencarian dapat menggunakan:

-   BIB
-   nama
-   nomor HP
-   field lain yang memang diperlukan

Jangan melakukan query database pada setiap karakter input jika tidak
diperlukan.

Prioritas:

``` text
Load data yang diperlukan
        ↓
Cache di client
        ↓
Pencarian lokal
```

Jika pencarian server diperlukan, gunakan query terparameterisasi dan
index database.

Jangan menggunakan string concatenation untuk SQL.

------------------------------------------------------------------------

## 15. SQL Injection

Semua query database wajib menggunakan:

-   parameterized query;
-   prepared statement;
-   ORM/query builder yang aman.

Jangan membuat query dari concatenation input user.

------------------------------------------------------------------------

## 16. Import Data Peserta

Import hanya dapat dilakukan oleh Admin.

Alur:

``` text
Admin upload/import file
        ↓
Validasi format
        ↓
Validasi kolom
        ↓
Validasi data
        ↓
Preview/error report
        ↓
Admin konfirmasi
        ↓
Transaction
        ↓
Insert/update data
```

Import tidak boleh menghapus data peserta secara otomatis kecuali fitur
tersebut secara eksplisit dibuat dan dikonfirmasi.

Jangan auto-merge berdasarkan nama.

BIB kosong tetap boleh disimpan jika memang demikian pada sumber data.

------------------------------------------------------------------------

## 17. Audit / Histori

Operasi penting sebaiknya memiliki jejak:

-   siapa yang melakukan;
-   kapan dilakukan;
-   peserta terkait;
-   tindakan;
-   hasil tindakan.

Minimal proses pengambilan harus mencatat:

``` text
peserta_id
petugas_id
status
diambil_at
```

Histori pengambilan tidak boleh hilang karena refresh halaman.

------------------------------------------------------------------------

## 18. Statistik

Dashboard statistik harus berasal dari MySQL dan tidak boleh dihitung
dengan membaca file peserta dari storage.

Statistik yang dapat digunakan:

-   total peserta;
-   total sudah diambil;
-   total belum diambil;
-   persentase pengambilan;
-   pengambilan berdasarkan kategori;
-   pengambilan berdasarkan petugas.

Optimalkan query statistik agar tidak melakukan query berulang yang
tidak perlu.

------------------------------------------------------------------------

## 19. Performance Rules

1.  Hindari query database yang tidak diperlukan.
2.  Gunakan index pada field pencarian utama.
3.  Hindari N+1 query.
4.  Jangan load file peserta sebelum diperlukan.
5.  Jangan membaca seluruh file sekaligus.
6.  Gunakan pagination untuk daftar besar jika diperlukan.
7.  Cache data yang aman untuk dicache.
8.  Gunakan transaction hanya pada operasi yang membutuhkan atomicity.
9.  Jangan melakukan realtime polling tanpa kebutuhan.
10. Jangan mengubah page/style existing untuk alasan implementasi
    backend.

Target:

> Pencarian peserta harus terasa instan dan proses pengambilan racepack
> harus cepat, aman, dan konsisten.

------------------------------------------------------------------------

## 20. Error Handling

Jangan mengembalikan kepada client:

-   SQL query;
-   database credential;
-   filesystem path internal;
-   stack trace;
-   secret;
-   informasi sistem internal.

Gunakan pesan aman dan jelas, misalnya:

``` text
Peserta tidak ditemukan.
```

``` text
Racepack peserta ini sudah diambil.
```

``` text
File terlalu besar. Maksimum 5 MB.
```

``` text
Format file tidak didukung.
```

``` text
Anda tidak memiliki akses untuk melakukan tindakan ini.
```

------------------------------------------------------------------------

# 21. Alur Bisnis Utama

## A. Login

``` text
User membuka aplikasi
        ↓
Login
        ↓
Validasi credential
        ↓
Buat session
        ↓
Baca role
        ↓
Masuk ke halaman sesuai hak akses
```

## B. Cari Peserta

``` text
Petugas/Admin login
        ↓
Buka pencarian peserta
        ↓
Masukkan BIB/Nama/No HP
        ↓
Sistem mencari peserta
        ↓
Tampilkan hasil
        ↓
User memilih peserta
        ↓
Tampilkan detail peserta
```

## C. Verifikasi Dokumen

``` text
Buka detail peserta
        ↓
Lihat status bukti pembayaran
        ↓
Jika tersedia:
    lihat bukti pembayaran
        ↓
Jika peserta diwakilkan:
    lihat surat kuasa
        ↓
Lanjut proses racepack
```

## D. Pengambilan Racepack

``` text
Petugas memilih peserta
        ↓
Sistem menampilkan detail
        ↓
Petugas melakukan verifikasi
        ↓
Klik "Ambil Racepack"
        ↓
Server memulai transaction
        ↓
Cek status terbaru
        ↓
Belum diambil?
   ├── Tidak → tampilkan "Sudah diambil"
   │
   └── Ya
        ↓
Catat pengambilan
        ↓
Catat petugas
        ↓
Catat waktu server
        ↓
Commit
        ↓
Tampilkan berhasil
```

## E. Peserta Sudah Diambil

``` text
Cari peserta
    ↓
Detail
    ↓
Status = SUDAH DIAMBIL
    ↓
Tampilkan waktu pengambilan
    ↓
Tampilkan petugas
    ↓
Tidak boleh membuat pengambilan kedua
```

Petugas biasa tidak boleh menghapus atau mengubah histori tersebut.

## F. Peserta Diwakilkan

``` text
Cari peserta
    ↓
Verifikasi identitas/data peserta
    ↓
Periksa surat kuasa
    ↓
Jika surat kuasa valid:
    lanjut pengambilan
    ↓
Catat pengambilan seperti biasa
```

Surat kuasa harus tersedia atau diverifikasi sesuai aturan operasional
event sebelum racepack diberikan.

------------------------------------------------------------------------

# 22. Larangan Perubahan UI

Agent/developer **tidak boleh**:

-   mengganti warna;
-   mengganti font;
-   mengganti layout;
-   mengganti komponen visual;
-   membuat design system baru;
-   mengubah page yang sudah tersedia;
-   menambahkan animasi berlebihan;
-   mengubah style hanya karena backend menggunakan teknologi berbeda.

Style dan page existing adalah **source of truth untuk tampilan
aplikasi**.

Jika implementasi backend membutuhkan perubahan kecil pada page,
pertahankan struktur dan style existing semaksimal mungkin.

------------------------------------------------------------------------

# 23. Prioritas Pengembangan

Urutan prioritas:

1.  Keamanan
2.  Konsistensi data
3.  Correctness alur bisnis
4.  Performance
5.  Reliability
6.  Maintainability
7.  UI existing tetap dipertahankan

Jika ada konflik antara kecepatan implementasi dan keamanan/data
consistency, pilih keamanan dan consistency.

------------------------------------------------------------------------

# 24. Definition of Done

Fitur dianggap selesai apabila:

-   Authorization server-side benar.
-   Input divalidasi.
-   Query aman dari SQL injection.
-   Transaction digunakan bila diperlukan.
-   Tidak ada credential/secret di client.
-   File sensitif tidak public.
-   Error handling aman.
-   Tidak ada duplicate pengambilan.
-   Tidak merusak data existing.
-   Tidak mengubah style/page existing tanpa kebutuhan eksplisit.
-   Fitur berjalan di environment Hostinger.
