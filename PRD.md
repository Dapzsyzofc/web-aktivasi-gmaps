# PRD — Aktivasi GMaps: Platform Kartu NFC + QR Google Maps untuk UMKM

**Versi:** 0.2 (MVP/testing — revisi nama dan desain)\
**Status:** Draft untuk AI coding agent\
**Target deployment:** Vercel\
**Database & Auth:** Supabase\
**Bahasa UI:** Bahasa Indonesia\
**Tujuan dokumen:** Menjadi spesifikasi produk dan implementasi untuk
membangun MVP yang bisa diuji sebelum produksi massal.

------------------------------------------------------------------------

## 1. Ringkasan Produk

Platform ini membantu admin menjual kartu akrilik premium untuk UMKM.
Setiap kartu memiliki:

-   Satu QR code unik yang dicetak pada kartu.
-   Satu chip NFC yang ditulis dengan URL yang sama persis dengan QR
    code.
-   Satu identitas kartu di database.
-   Status `inactive`, `active`, atau `disabled`.

QR dan NFC **tidak menyimpan URL Google Maps langsung**. Keduanya
menyimpan URL redirect milik platform, misalnya:

`https://DOMAIN-MILIK-ADMIN.id/m/7kQ3xP9aR2vB`

Server memeriksa status kartu: - `inactive`: tampilkan halaman bahwa
kartu belum diaktifkan. - `active`: redirect ke URL Google Maps UMKM
yang terhubung. - `disabled`: tampilkan halaman bahwa kartu
dinonaktifkan. - kode tidak dikenal: tampilkan halaman kartu tidak
ditemukan.

Dengan pendekatan ini, URL pada QR dan NFC tidak perlu diubah saat
pelanggan mengaktifkan kartu atau saat tautan Maps diperbarui.

## 2. Tujuan MVP

1.  Admin bisa login dengan aman.
2.  Admin dapat membuat batch kartu sebanyak 1, 10, 20, 100, atau jumlah
    kustom.
3.  Sistem menghasilkan kode kartu acak yang unik, URL redirect, dan QR
    code untuk setiap kartu.
4.  Admin dapat mengunduh data batch CSV dan QR code SVG/PNG yang siap
    untuk proses cetak.
5.  Admin dapat mengelola status kartu dan menghubungkan kartu ke data
    UMKM.
6.  Pengunjung yang memindai QR atau menyentuhkan HP ke NFC diarahkan
    sesuai status kartu.
7.  Sistem dapat diuji tanpa payment gateway: admin mengaktifkan kartu
    secara manual.
8.  Struktur kode memungkinkan pembayaran QRIS/webhook ditambahkan
    setelah MVP teruji.

## 3. Bukan Tujuan MVP

-   Tidak mengedit atau membuat Google Business Profile milik pelanggan.
-   Tidak menjamin sebuah UMKM telah diverifikasi oleh Google.
-   Tidak membuat rating/review palsu, tidak memberi imbalan untuk
    review positif, dan tidak mengarahkan hanya pelanggan puas ke
    ulasan.
-   Tidak memerlukan aplikasi mobile native.
-   Tidak memerlukan mesin NFC writer otomatis untuk MVP.
-   Tidak mengaktifkan kartu hanya karena seseorang mengetahui URL
    publiknya.
-   Tidak menyimpan data kartu pembayaran.

## 4. Pengguna dan Peran

### 4.1 Admin

Pemilik platform. Bisa membuat batch, melihat semua kartu dan bisnis,
menghubungkan kartu dengan UMKM, mengaktifkan/menonaktifkan kartu, dan
melihat log aktivitas.

### 4.2 Pelanggan/UMKM

Pada MVP, admin memasukkan data UMKM dan mengaktifkan kartu untuk
pelanggan. Portal mandiri pelanggan boleh dibuat pada fase berikutnya.
Jangan membuat pendaftaran publik yang dapat mengklaim kartu tanpa
verifikasi.

### 4.3 Pengunjung

Orang yang memindai QR atau menyentuhkan ponsel ke kartu. Tidak perlu
login. Pengunjung hanya melihat halaman status atau dialihkan ke Maps.

## 5. Teknologi yang Direkomendasikan

Gunakan **satu aplikasi full-stack Next.js App Router di Vercel**. Ini
adalah pilihan paling sederhana untuk MVP karena halaman UI, backend
HTTP, dan redirect dapat berada di satu repository dan deployment.

-   **Framework/backend:** Next.js App Router + TypeScript.
-   **Hosting:** Vercel.
-   **Database:** Supabase PostgreSQL.
-   **Autentikasi admin:** Supabase Auth, email/password, akun admin
    dibuat secara terkontrol.
-   **Integrasi Supabase server-side:** `@supabase/ssr` untuk sesi
    berbasis cookie pada Next.js; `@supabase/supabase-js` untuk operasi
    server yang diperlukan.
-   **Validasi input:** Zod.
-   **Form:** React Hook Form (opsional) + Zod.
-   **UI:** Tailwind CSS dan shadcn/ui (atau komponen accessible yang
    setara).
-   **Pembuatan QR:** library `qrcode` atau library QR TypeScript yang
    mendukung SVG/PNG. QR harus mengodekan URL redirect kartu.
-   **Ekspor:** CSV bawaan; QR SVG/PNG per kartu; ZIP batch jika
    implementasi ZIP dibutuhkan.
-   **Testing:** Vitest untuk unit/integration test; Playwright untuk
    alur end-to-end jika tersedia.
-   **Pembayaran:** tidak termasuk MVP. Siapkan interface layanan
    pembayaran agar provider QRIS dapat ditambahkan kelak.

Jangan membuat backend Express terpisah untuk MVP kecuali ada kebutuhan
teknis yang benar-benar terbukti. Next.js Route Handlers berjalan di
deployment Vercel dan cukup untuk endpoint admin serta redirect. Gunakan
runtime Node.js bila library tertentu membutuhkannya.

Referensi resmi: - Next.js App Router: https://nextjs.org/docs/app -
Deployment Next.js:
https://nextjs.org/docs/app/getting-started/deploying - Supabase +
Next.js:
https://supabase.com/docs/guides/getting-started/quickstarts/nextjs -
Supabase SSR auth: https://supabase.com/docs/guides/auth/server-side

## 6. Alur Utama Produk

### 6.1 Admin membuat batch

1.  Admin login.
2.  Buka menu **Kartu → Buat Batch**.
3.  Masukkan nama batch, jumlah kartu, dan catatan opsional.
4.  Server membuat setiap kartu dengan token acak kriptografis yang
    tidak berurutan dan sulit ditebak.
5.  Server menyimpan kartu ke database.
6.  Server menghasilkan URL seperti
    `https://domain.id/m/{public_token}`.
7.  QR code dihasilkan dari URL tersebut.
8.  Admin melihat daftar kartu, mengunduh CSV, dan mengunduh QR code
    siap cetak.

Token publik harus cukup acak (misalnya minimal 128 bit entropi) dan
tidak boleh berasal dari ID berurutan. Jangan memakai `A001`, `A002`
sebagai token publik. Nomor inventaris internal boleh ada secara
terpisah.

### 6.2 Produksi kartu fisik

1.  Admin mengekspor daftar URL untuk batch.
2.  QR code dicetak di kartu.
3.  Operator menulis URL yang sama ke chip NFC pada kartu yang sesuai.
4.  Operator melakukan quality check: scan QR dan tap NFC.
5.  Catat hasil pemeriksaan produksi di dashboard atau spreadsheet.
6.  Kartu tetap `inactive` sampai aktivasi yang sah dilakukan.

### 6.3 Aktivasi kartu oleh admin

1.  Admin membuka kartu.
2.  Admin memilih **Hubungkan ke UMKM**.
3.  Admin mengisi nama usaha, URL Google Maps, dan kontak opsional.
4.  Server memvalidasi URL Maps, menyimpan relasi kartu--UMKM, lalu
    mengaktifkan kartu dalam satu transaksi atau operasi yang aman.
5.  Halaman publik kartu mulai redirect ke URL Maps.
6.  Semua perubahan status dan tujuan dicatat di audit log.

Untuk MVP, aktivasi dilakukan manual oleh admin. Jangan membuat aktivasi
publik hanya berdasarkan kode yang tercetak atau URL yang dapat ditebak.

### 6.4 Pengunjung membuka kartu

1.  Pengunjung scan QR atau tap NFC.
2.  Browser membuka `/m/{public_token}`.
3.  Server mengambil kartu berdasarkan token.
4.  Jika aktif dan memiliki URL Maps yang valid, server mengirim
    redirect HTTP ke URL Maps.
5.  Jika belum aktif, tampilkan halaman informatif "Kartu belum
    diaktifkan".
6.  Jika dinonaktifkan, tampilkan halaman informatif "Kartu tidak
    tersedia".
7.  Jika token tidak ditemukan, tampilkan 404 yang ramah.

Gunakan redirect sementara (`302` atau `307`), bukan redirect permanen
(`301`), agar perubahan tujuan tidak tertahan cache browser/perantara.
Jangan cache hasil redirect publik.

## 7. Persyaratan Fungsional

### FR-01 --- Autentikasi admin

-   Admin dapat login dan logout.
-   Dashboard dan semua endpoint admin wajib memverifikasi sesi di
    server.
-   Tidak ada halaman atau API admin yang hanya dilindungi oleh
    pemeriksaan UI di browser.
-   Untuk MVP, akun admin dibuat lewat Supabase Dashboard atau proses
    seed yang aman.
-   Jangan menyediakan endpoint pendaftaran admin publik.

### FR-02 --- Dashboard

Tampilkan ringkasan: - Total kartu. - Kartu inactive. - Kartu active. -
Kartu disabled. - Total UMKM terdaftar. - Batch terbaru. - Aktivitas
terakhir.

### FR-03 --- Batch kartu

-   Admin dapat membuat batch dengan jumlah 1--1.000 kartu (batas dapat
    dikonfigurasi).
-   Nama batch wajib diisi.
-   Setiap kartu mempunyai token unik.
-   Pembuatan batch harus aman dari duplikasi; jika terjadi kegagalan,
    jangan meninggalkan batch setengah jadi tanpa status yang jelas.
-   Tampilkan kemajuan atau hasil setelah proses selesai.
-   Batasi jumlah batch untuk mencegah penyalahgunaan resource.
-   QR harus dapat dibuat ulang dari URL tersimpan; tidak perlu
    menyimpan gambar QR ke database.

### FR-04 --- Daftar dan detail kartu

-   Tabel dengan pencarian berdasarkan nama batch, status, kode
    inventaris internal, nama UMKM, atau tanggal.
-   Filter status dan batch.
-   Halaman detail kartu menampilkan status, URL publik, batch, data
    UMKM, tanggal dibuat/diaktifkan, dan riwayat aktivitas.
-   Admin dapat menyalin URL dan mengunduh QR.

### FR-05 --- UMKM

Data minimal: - Nama usaha (wajib). - URL Google Maps (wajib untuk
aktivasi). - Nama kontak (opsional). - Nomor telepon (opsional). -
Catatan internal admin (opsional). - Waktu dibuat dan diperbarui.

Jangan meminta kata sandi akun Google pelanggan. Validasi URL tujuan dan
hanya izinkan URL HTTPS pada domain Google Maps yang dikenal atau URL
Maps resmi yang digunakan pelanggan. Jika link pendek `maps.app.goo.gl`
digunakan, verifikasi/normalisasi harus dilakukan dengan hati-hati;
jangan melakukan fetch URL sembarang dari server karena risiko SSRF.
Untuk MVP, admin dapat menempelkan dan memeriksa link secara manual.

### FR-06 --- Aktivasi dan perubahan tujuan

-   Admin dapat mengaktifkan kartu dengan menghubungkan kartu ke UMKM.
-   Admin dapat menonaktifkan dan mengaktifkan kembali kartu.
-   Admin dapat memperbarui URL Maps tanpa mencetak ulang QR atau
    menulis ulang NFC.
-   Perubahan tujuan harus tercatat di audit log.
-   Jika kartu dinonaktifkan, URL tidak boleh tetap mengarahkan ke Maps
    karena cache.
-   Hindari dua kartu aktif tertaut ke UMKM yang salah akibat race
    condition; gunakan operasi database yang aman.

### FR-07 --- Halaman publik redirect

Route: `/m/[token]` - Tidak memerlukan login. - Token tidak ditemukan →
404. - `inactive` → halaman status belum aktif dengan instruksi
menghubungi penjual/admin. - `disabled` → halaman status
dinonaktifkan. - `active` + URL valid → HTTP redirect ke Maps. - Tidak
membocorkan data internal, kontak admin pribadi, UUID internal, atau
audit log. - Jangan menambahkan parameter redirect bebas dari query
string. - Gunakan `Cache-Control: no-store` untuk respons
status/redirect yang dinamis.

### FR-08 --- Ekspor untuk produksi

-   Ekspor CSV dengan kolom: `batch_name`, `inventory_code`,
    `public_url`, `status`, `created_at`.
-   Jangan mengekspor service-role key, data autentikasi, atau informasi
    rahasia.
-   Unduh QR sebagai SVG atau PNG dengan margin/quiet zone yang cukup
    dan tingkat koreksi error yang wajar.
-   Jika ZIP tersedia, gunakan nama file berdasarkan kode inventaris,
    bukan token rahasia tambahan.
-   CSV dan file QR hanya dapat diunduh admin terautentikasi.
-   Jangan membuat satu gambar QR yang sama untuk semua kartu.

### FR-09 --- Audit log

Catat: - Batch dibuat. - Kartu diaktifkan/dinonaktifkan. - Kartu
dihubungkan atau dipindahkan ke UMKM. - URL Maps diubah. - Pengguna
admin yang melakukan perubahan. - Waktu perubahan dan metadata yang
aman.

Jangan menyimpan rahasia atau token sesi ke log.

### FR-10 --- Pembayaran (fase berikutnya, bukan MVP)

Arsitektur harus memungkinkan: - Order aktivasi. - Pembuatan
invoice/QRIS melalui payment provider. - Webhook server-to-server. -
Verifikasi signature webhook dan status pembayaran lewat API provider. -
Aktivasi hanya setelah pembayaran terkonfirmasi dari server. -
Idempotensi webhook agar satu transaksi tidak mengaktifkan dua kali atau
menimbulkan duplikasi. - Rekonsiliasi dan log pembayaran.

Jangan menganggap redirect browser setelah pembayaran sebagai bukti
pembayaran.

## 8. Skema Database Supabase

Gunakan UUID sebagai primary key internal. Token publik harus terpisah
dan acak.

### 8.1 `profiles`

-   `id uuid primary key references auth.users(id) on delete cascade`
-   `role text not null check (role in ('admin'))`
-   `created_at timestamptz not null default now()`

MVP hanya mengizinkan role admin. Jika portal pelanggan ditambahkan
nanti, desain role dan kebijakan RLS harus diperluas dengan benar.

### 8.2 `card_batches`

-   `id uuid primary key default gen_random_uuid()`
-   `name text not null`
-   `quantity integer not null check (quantity > 0)`
-   `notes text null`
-   `created_by uuid references auth.users(id)`
-   `created_at timestamptz not null default now()`

### 8.3 `businesses`

-   `id uuid primary key default gen_random_uuid()`
-   `name text not null`
-   `google_maps_url text null`
-   `contact_name text null`
-   `contact_phone text null`
-   `internal_notes text null`
-   `created_by uuid references auth.users(id)`
-   `created_at timestamptz not null default now()`
-   `updated_at timestamptz not null default now()`

### 8.4 `cards`

-   `id uuid primary key default gen_random_uuid()`
-   `batch_id uuid not null references card_batches(id)`
-   `inventory_code text not null unique` --- kode internal yang mudah
    dibaca, bukan rahasia.
-   `public_token text not null unique` --- token acak kriptografis yang
    digunakan pada URL.
-   `status text not null default 'inactive' check (status in ('inactive','active','disabled'))`
-   `business_id uuid null references businesses(id)`
-   `created_at timestamptz not null default now()`
-   `activated_at timestamptz null`
-   `disabled_at timestamptz null`
-   `updated_at timestamptz not null default now()`

Tambahkan index untuk `batch_id`, `status`, `business_id`, dan unique
index pada `public_token` serta `inventory_code`.

### 8.5 `audit_logs`

-   `id bigint generated always as identity primary key`
-   `actor_id uuid null references auth.users(id)`
-   `entity_type text not null`
-   `entity_id uuid null`
-   `action text not null`
-   `metadata jsonb not null default '{}'::jsonb`
-   `created_at timestamptz not null default now()`

Batasi isi metadata agar tidak berisi kredensial atau data sensitif yang
tidak diperlukan.

### 8.6 Aturan relasi dan validasi

-   Kartu aktif wajib mempunyai `business_id` dan bisnis tersebut harus
    memiliki `google_maps_url` yang valid.
-   Terapkan validasi ini di server; idealnya tambahkan
    constraint/trigger database jika cocok.
-   Operasi menghubungkan bisnis, memperbarui status, dan menulis audit
    log harus konsisten.
-   Pertimbangkan transaksi melalui PostgreSQL function/RPC untuk
    perubahan multi-tabel yang harus atomik.

## 9. Keamanan dan RLS

Keamanan adalah persyaratan inti, bukan pekerjaan tambahan.

-   Aktifkan Row Level Security pada semua tabel aplikasi.
-   Secara default, tolak akses anon/authenticated langsung ke tabel
    admin, batch, kartu, bisnis, dan audit log.
-   Akses admin dilakukan lewat server setelah memverifikasi sesi dan
    role.
-   Gunakan Supabase publishable key hanya sesuai desain akses
    publik/RLS.
-   `SUPABASE_SERVICE_ROLE_KEY` atau secret key harus berada di
    environment server saja; jangan pernah memakai awalan
    `NEXT_PUBLIC_`, memasukkannya ke bundle browser, log, repository,
    atau file yang diekspor.
-   Jangan percaya role yang dikirim dari browser. Ambil identitas/sesi
    dan role dari sumber tepercaya di server/database.
-   Validasi semua input dengan Zod di server.
-   Gunakan rate limiting untuk route publik `/m/[token]` dan endpoint
    yang dapat disalahgunakan. Jika memakai layanan rate limit
    eksternal, jadikan dependensi opsional dan dokumentasikan setup.
-   Tambahkan proteksi brute force dan batas jumlah batch.
-   Terapkan CSRF/session protection yang sesuai untuk tindakan admin.
-   Jangan menerima URL tujuan redirect arbitrary dari query string.
-   Validasi URL Google Maps saat menyimpan; jangan melakukan fetch
    sembarang URL dari server untuk memeriksa link.
-   Gunakan security headers yang sesuai.
-   Error publik tidak boleh mengungkap query SQL, stack trace, token
    rahasia, atau data internal.
-   Jangan menyimpan data pembayaran sensitif.
-   Sediakan `.env.example` berisi nama variabel tanpa nilai rahasia.

Variabel environment yang diperkirakan: - `NEXT_PUBLIC_SUPABASE_URL` -
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - `SUPABASE_SERVICE_ROLE_KEY`
(server-only, jika benar-benar diperlukan) - `NEXT_PUBLIC_APP_URL`

Pilih nama key Supabase yang tersedia pada project; jangan menaruh
secret di variabel `NEXT_PUBLIC_*`.

## 10. Halaman dan Navigasi

### Publik

-   `/` --- landing page produk.
-   `/m/[token]` --- endpoint/halaman kartu.
-   `/aktivasi/[inventoryCode]` --- informasi kartu belum aktif atau
    instruksi menghubungi penjual; tidak boleh mengaktifkan kartu
    sendiri tanpa otorisasi.
-   `/404` --- halaman tidak ditemukan.
-   `/privacy` --- kebijakan privasi dasar.

### Admin

-   `/admin/login`
-   `/admin`
-   `/admin/batches`
-   `/admin/batches/new`
-   `/admin/batches/[id]`
-   `/admin/cards`
-   `/admin/cards/[id]`
-   `/admin/businesses`
-   `/admin/businesses/new`
-   `/admin/businesses/[id]`
-   `/admin/audit-logs`
-   `/admin/settings` (konfigurasi non-rahasia yang aman)

Semua route `/admin/*` harus diproteksi server-side.

## 11. Desain UI/UX

-   Bahasa Indonesia, mobile-first, responsif.
-   Tampilan bersih, premium, mudah dipakai di ponsel dan desktop.
-   Dashboard menampilkan status dengan teks dan ikon, bukan warna saja.
-   Form memiliki validasi, loading state, error state, dan success
    state.
-   Konfirmasi sebelum menonaktifkan kartu atau mengubah tujuan Maps.
-   Copy URL dan unduh QR mudah ditemukan.
-   Halaman publik kartu harus ringan dan cepat.
-   Halaman inactive harus menyebut bahwa kartu belum diaktivasi, tanpa
    menampilkan tombol admin yang berbahaya.
-   Jangan memakai logo Google seolah-olah platform ini merupakan produk
    resmi Google. Beri keterangan layanan pihak ketiga bila diperlukan.

## 12. API/Route Handlers yang Dibutuhkan

Nama dapat disesuaikan dengan gaya Next.js, tetapi semua operasi admin
harus dilindungi sesi/role di server.

-   `POST /api/admin/batches` --- membuat batch dan kartu.
-   `GET /api/admin/batches` --- daftar batch.
-   `GET /api/admin/batches/[id]` --- detail batch.
-   `GET /api/admin/cards` --- pencarian/daftar kartu.
-   `GET /api/admin/cards/[id]` --- detail kartu.
-   `POST /api/admin/cards/[id]/activate` --- hubungkan ke bisnis dan
    aktifkan.
-   `POST /api/admin/cards/[id]/disable` --- nonaktifkan kartu.
-   `POST /api/admin/cards/[id]/enable` --- aktifkan kembali jika valid.
-   `PATCH /api/admin/businesses/[id]` --- edit data bisnis/Maps URL.
-   `POST /api/admin/businesses` --- buat bisnis.
-   `GET /api/admin/batches/[id]/export.csv` --- ekspor data produksi.
-   `GET /api/admin/cards/[id]/qr.svg` --- QR satu kartu.
-   `GET /m/[token]` --- pemeriksaan status dan redirect publik.

Route handlers bukan daftar yang wajib dibuat terpisah jika Server
Actions lebih cocok. Pilih pola konsisten; jangan duplikasi business
logic antara API dan Server Actions.

## 13. Persyaratan QR dan NFC

-   QR dan NFC untuk satu kartu harus berisi URL yang identik.
-   URL wajib menggunakan HTTPS pada domain produksi.
-   Setiap kartu memiliki token publik berbeda.
-   QR tidak boleh berisi langsung URL Maps final.
-   QR code harus dapat dipindai dari cetakan fisik; gunakan ukuran,
    kontras, dan quiet zone yang cukup.
-   Jangan membuat QR terlalu kecil atau meletakkan logo di atas pola
    tanpa pengujian.
-   Untuk NFC, tulis URL sebagai record NDEF URI.
-   Jangan mengunci tag read-only selama tahap uji.
-   Setelah ditulis, verifikasi URL dengan membaca kembali chip.
-   Penguncian NFC bersifat opsional dan permanen pada banyak tag; hanya
    lakukan setelah QA dan setelah keputusan bisnis dibuat.
-   UID chip bukan rahasia dan bukan satu-satunya faktor autentikasi.
-   Catat hasil QA produksi per kartu jika fitur ini dimasukkan dalam
    MVP.

## 14. Acceptance Criteria

MVP dianggap siap diuji jika semua hal berikut lulus:

1.  Admin yang belum login tidak dapat membuka dashboard atau memanggil
    endpoint admin.
2.  Admin dapat membuat batch 20 kartu dan sistem menghasilkan 20 token
    berbeda.
3.  Semua token memiliki URL dan QR yang unik.
4.  CSV ekspor berisi URL yang cocok dengan QR masing-masing.
5.  QR kartu dan URL yang ditulis ke NFC untuk kartu yang sama identik.
6.  Kartu `inactive` menampilkan halaman belum aktif.
7.  Kartu `active` dengan URL Maps valid mengirim redirect ke tujuan
    tersebut.
8.  Kartu `disabled` tidak mengirim redirect ke Maps.
9.  Kartu dengan token tak dikenal menampilkan 404.
10. Admin dapat mengubah URL Maps dan perubahan berlaku tanpa menulis
    ulang NFC atau mencetak QR ulang.
11. Semua perubahan penting dicatat dalam audit log.
12. RLS mencegah pengguna anon mengakses data bisnis/kartu/admin secara
    langsung.
13. Secret key tidak ada di bundle browser atau repository.
14. `npm run lint`, `npm run typecheck` (jika disediakan), `npm test`,
    dan `npm run build` berhasil.
15. Ada petunjuk setup lokal, migrasi database, environment variables,
    pembuatan admin, dan deployment.

## 15. Testing

### Unit/integration

-   Token unik saat membuat batch.
-   Penanganan kegagalan insert batch.
-   Validasi URL Maps.
-   Transisi status kartu yang valid dan tidak valid.
-   Redirect berdasarkan status.
-   Otorisasi admin.
-   RLS.
-   Ekspor CSV dan QR.

### End-to-end

1.  Admin login.
2.  Buat batch 3 kartu.
3.  Ekspor QR.
4.  Scan URL kartu pertama → halaman belum aktif.
5.  Buat data UMKM dan aktivasi kartu pertama.
6.  Buka URL kartu pertama → redirect Maps.
7.  Nonaktifkan kartu pertama → tidak lagi redirect.
8.  Buka URL kartu kedua → masih belum aktif.
9.  Logout, lalu coba akses route admin → ditolak.

### Pengujian fisik

-   Scan QR dari ponsel Android dan iPhone.
-   Tap NFC pada beberapa model ponsel yang tersedia.
-   Uji setelah chip ditempel di balik akrilik.
-   Uji di kondisi cahaya normal.
-   Pastikan QR tetap terbaca setelah dicetak dan dilaminasi.

## 16. Deployment Vercel dan Supabase

1.  Buat project Supabase.
2.  Buat migrasi SQL dalam folder `supabase/migrations/`.
3.  Aktifkan RLS dan kebijakan default-deny.
4.  Konfigurasi Supabase Auth untuk admin.
5.  Buat project Next.js dengan TypeScript dan App Router.
6.  Tambahkan environment variables di `.env.local` untuk pengembangan.
7.  Jalankan migrasi, test, lint, typecheck, dan build.
8.  Push repository ke GitHub.
9.  Import repository ke Vercel.
10. Masukkan environment variables di Vercel untuk environment yang
    sesuai.
11. Deploy preview terlebih dahulu.
12. Uji login, batch, QR, redirect, aktivasi, RLS, dan status kartu.
13. Tambahkan domain produksi dan pastikan HTTPS aktif.
14. Perbarui `NEXT_PUBLIC_APP_URL` sesuai domain produksi lalu redeploy.
15. Jangan menggunakan data nyata pelanggan sebelum uji keamanan dan
    backup selesai.

## 17. Struktur Repository yang Disarankan

``` text
app/
  (public)/
    page.tsx
    m/[token]/route.ts
    aktivasi/[inventoryCode]/page.tsx
    privacy/page.tsx
  admin/
    login/page.tsx
    page.tsx
    batches/page.tsx
    batches/new/page.tsx
    batches/[id]/page.tsx
    cards/page.tsx
    cards/[id]/page.tsx
    businesses/page.tsx
    businesses/new/page.tsx
    businesses/[id]/page.tsx
    audit-logs/page.tsx
  api/
    admin/
      batches/route.ts
      cards/route.ts
      businesses/route.ts
lib/
  auth/
  supabase/
    client.ts
    server.ts
    admin.ts
  validations/
  services/
    cards.ts
    batches.ts
    businesses.ts
    qr.ts
    audit.ts
  utils/
components/
  ui/
  admin/
  forms/
supabase/
  migrations/
tests/
  unit/
  e2e/
.env.example
README.md
PRD.md
```

Struktur di atas merupakan panduan, bukan syarat mutlak. Ikuti konvensi
Next.js yang berlaku pada versi yang dipilih. Jika route redirect
menggunakan Route Handler, pastikan route dinamis tidak di-cache.

## 18. Instruksi untuk AI Coding Agent

Implementasikan berdasarkan PRD ini dengan urutan:

1.  Periksa repository yang ada terlebih dahulu. Jangan menghapus atau
    menimpa pekerjaan yang sudah ada tanpa alasan.
2.  Tulis rencana singkat dan daftar file yang akan dibuat.
3.  Buat kerangka Next.js App Router + TypeScript.
4.  Buat migrasi SQL, index, constraint, RLS, dan kebijakan keamanan.
5.  Implementasikan Supabase server/client utilities dan autentikasi
    admin.
6.  Implementasikan batch generation dengan token acak yang aman.
7.  Implementasikan QR generation, CSV export, serta halaman detail
    kartu.
8.  Implementasikan pengelolaan UMKM dan aktivasi manual.
9.  Implementasikan redirect publik dengan status yang benar.
10. Tambahkan audit log dan validasi input.
11. Buat tests dan jalankan lint, typecheck, tests, serta production
    build.
12. Perbaiki error yang ditemukan; jangan sekadar mengabaikannya.
13. Buat README dengan setup Supabase, migrasi, admin bootstrap,
    environment variables, menjalankan lokal, dan deploy ke Vercel.
14. Jika kredensial atau akses Supabase/Vercel belum tersedia, buat kode
    dan migrasi terlebih dahulu, lalu jelaskan tindakan manual yang
    masih harus dilakukan. Jangan mengarang bahwa deployment sudah
    berhasil.
15. Jangan mengimplementasikan pembayaran QRIS sebelum MVP dasar lulus
    acceptance criteria.

**Definisi selesai:** MVP dapat dijalankan lokal, deploy ke Vercel,
terhubung ke Supabase, membuat batch kartu unik, menghasilkan QR code,
mengelola aktivasi, dan mengarahkan QR/NFC berdasarkan status kartu.

---

## 19. Revisi Brand dan Design System — Aktivasi GMaps

Bagian ini merupakan revisi wajib terhadap nama produk, logo, dan desain antarmuka. Jika terdapat perbedaan dengan arahan visual sebelumnya, bagian ini yang menjadi acuan.

### 19.1 Nama website
- Nama produk/website: **Aktivasi GMaps**.
- Gunakan nama tersebut secara konsisten pada landing page, dashboard admin, metadata browser, README, halaman status kartu, dan pesan UI.
- Judul browser yang disarankan: `Aktivasi GMaps — Aktivasi Kartu Google Maps UMKM`.
- Jangan tampilkan nama placeholder sebagai nama produk di UI produksi.

### 19.2 Logo Google Maps dan merek
- Arah visual yang diminta adalah minimalis dan simpel, terinspirasi prinsip desain produk Google.
- Jika memakai logo Google Maps resmi, gunakan aset dari sumber resmi Google dan patuhi pedoman merek yang berlaku. Jangan mengubah warna, bentuk, proporsi, memotong, atau menggambar ulang logo resmi.
- Jangan memberi kesan bahwa Aktivasi GMaps adalah produk resmi, dimiliki, didukung, atau dioperasikan oleh Google.
- Tampilkan disclaimer pada footer atau halaman Tentang: **“Aktivasi GMaps adalah layanan pihak ketiga dan tidak berafiliasi dengan Google. Google Maps adalah merek dagang Google.”**
- Jika izin atau pedoman penggunaan logo belum dipastikan, gunakan ikon pin lokasi generik sementara. Buat komponen logo terpisah agar aset dapat diganti dengan mudah.
- Jangan meniru antarmuka Google secara persis. Pertahankan identitas visual independen Aktivasi GMaps.

### 19.3 Arahan desain
- Gaya minimalis, bersih, sederhana, banyak ruang kosong, latar putih, border abu-abu muda, dan bayangan sangat halus.
- Gunakan tipografi sans-serif yang mudah dibaca, seperti Inter atau font setara yang lisensinya sesuai. Gunakan Google Sans hanya jika tersedia dan penggunaannya diizinkan.
- Palet dasar: putih, abu-abu muda, abu-abu gelap, dengan biru sebagai warna aksi utama. Status kartu harus disertai label teks dan tidak mengandalkan warna saja.
- Hindari neon, gradient berlebihan, efek glassmorphism berat, animasi dekoratif, serta dashboard yang terlalu ramai.
- Terapkan desain mobile-first, responsif, aksesibel, kontras teks memadai, label form jelas, dan navigasi keyboard.
- Komponen tombol, input, tabel, badge status, modal konfirmasi, empty state, loading state, dan error state harus konsisten.

### 19.4 Penerapan di halaman
- **Root URL `/`:** tidak memiliki landing page; ikuti bagian Revisi Navigasi Awal. Pengguna anonim diarahkan ke login admin, sedangkan admin yang sudah login diarahkan ke dashboard.
- **Dashboard admin:** sidebar sederhana di desktop, navigasi ringkas di ponsel, ringkasan total kartu, status kartu, batch terbaru, dan aktivitas terakhir.
- **Daftar kartu:** tabel bersih dengan pencarian, filter status, tombol salin URL, dan unduh QR.
- **Detail kartu:** identitas kartu, QR code yang cukup besar, URL publik, status, data UMKM, serta tombol aktivasi/nonaktifkan yang jelas.
- **Halaman kartu belum aktif:** ikon kartu atau pin lokasi, pesan “Kartu belum diaktifkan”, dan arahan untuk menghubungi penjual.
- **Halaman kartu nonaktif/tidak ditemukan:** pesan sederhana tanpa detail teknis internal.
- **Footer:** Aktivasi GMaps, tautan privasi, dan disclaimer pihak ketiga.

### 19.5 Kriteria penerimaan brand
- Nama Aktivasi GMaps tampil konsisten di semua halaman dan metadata.
- Desain responsif dan mengikuti prinsip minimalis yang dijelaskan di atas.
- Logo resmi Google Maps hanya digunakan dari sumber resmi dan sesuai pedoman; jika belum dipastikan, gunakan ikon generik.
- Disclaimer non-afiliasi dengan Google tampil pada footer atau halaman Tentang.
- Branding tidak mengubah alur inti QR/NFC, token unik, aktivasi, dan redirect dinamis.

---

## 20. Revisi Navigasi Awal — Tanpa Landing Page

Bagian ini menggantikan ketentuan landing page pada bagian lain PRD.

### 20.1 Perilaku saat membuka website
- **Jangan membuat landing page publik.**
- Saat pengguna membuka root URL `/`:
  - Jika belum login, langsung arahkan ke `/admin/login`.
  - Jika sudah login sebagai admin yang valid, langsung arahkan ke `/admin` (dashboard utama).
- Jangan tampilkan halaman promosi, hero section, harga, CTA pemasaran, atau landing page.
- Halaman publik yang dibutuhkan untuk fungsi produk tetap tersedia, khususnya `/m/[token]` untuk QR/NFC redirect, serta halaman privasi dan error bila diperlukan.

### 20.2 Login admin
- Halaman `/admin/login` menjadi halaman awal bagi pengguna yang belum terautentikasi.
- Desain login sederhana, minimalis, dan responsif mengikuti design system Aktivasi GMaps.
- Tampilkan nama layanan dan logo/ikon yang sesuai pedoman merek, kolom email dan password, tombol login, indikator loading, dan pesan error yang aman.
- Jangan menyediakan pendaftaran admin publik.
- Jangan menyediakan opsi “buat akun admin” yang dapat dipakai siapa saja.
- Setelah login berhasil, arahkan admin ke `/admin`.
- Jika admin membuka `/admin/login` saat sudah login, arahkan ke `/admin`.
- Jika sesi tidak valid atau role bukan admin, tolak akses ke dashboard dan semua endpoint admin.

### 20.3 Dashboard utama
- `/admin` adalah halaman utama setelah admin berhasil login.
- Tampilkan ringkasan jumlah total kartu, kartu belum aktif, kartu aktif, kartu dinonaktifkan, jumlah UMKM, batch terbaru, dan aktivitas terbaru.
- Sediakan navigasi langsung ke Batch Kartu, Semua Kartu, UMKM, Audit Log, dan Pengaturan.
- Dashboard harus menjadi halaman operasional, bukan halaman pemasaran.
- Pada desktop gunakan sidebar sederhana; pada perangkat mobile gunakan navigasi ringkas yang mudah diakses.

### 20.4 Acceptance criteria revisi navigasi
1. Pengguna anonim yang membuka `/` diarahkan ke `/admin/login`.
2. Admin yang sudah login dan membuka `/` diarahkan ke `/admin`.
3. Admin yang sudah login dan membuka `/admin/login` diarahkan ke `/admin`.
4. Login berhasil mengarahkan admin ke `/admin`.
5. Tidak ada landing page atau halaman promosi pada root URL.
6. QR/NFC redirect di `/m/[token]` tetap dapat digunakan tanpa login.
7. Semua route admin dan API admin tetap dilindungi autentikasi dan otorisasi server-side.

