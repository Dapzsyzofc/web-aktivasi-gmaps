# Aktivasi GMaps

Platform aktivasi kartu NFC & QR Code untuk redirect ke Google Maps bisnis UMKM.

> **redirect by Dapzsyz**

## Stack Teknologi

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS
- **QR Code:** library `qrcode`
- **Validasi:** Zod
- **Hosting:** Vercel

## Setup Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd aktivasi-gmaps
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Jalankan SQL migration di Supabase SQL Editor:
   - Copy isi file `supabase/migrations/001_initial_schema.sql`
   - Paste dan jalankan di SQL Editor Supabase

### 3. Buat Admin

Di Supabase Dashboard:
1. Buka **Authentication → Users → Add User**
2. Masukkan email dan password admin
3. Setelah user dibuat, jalankan SQL berikut di SQL Editor:

```sql
INSERT INTO profiles (id, role)
VALUES ('<USER_UUID_DARI_AUTH>', 'admin');
```

### 4. Environment Variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi dengan kredensial Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` — URL project Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (RAHASIA, jangan expose)
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` untuk lokal

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) → akan redirect ke halaman login admin.

## Alur Penggunaan

1. **Login** dengan akun admin
2. **Buat Batch** kartu (misal 20 kartu)
3. **Ekspor CSV** untuk data produksi
4. **Download QR** untuk cetak pada kartu fisik
5. **Tambah UMKM** dengan nama dan URL Google Maps
6. **Aktivasi kartu** — hubungkan kartu ke UMKM
7. **Scan QR** → redirect ke Google Maps UMKM

## Deploy ke Vercel

1. Push repository ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Tambahkan environment variables di Vercel Dashboard
4. Deploy

## Keamanan

- RLS aktif di semua tabel (default-deny)
- Semua route admin dilindungi middleware + server-side auth
- Service role key hanya di server, tidak pernah di browser
- Token kartu dibuat dengan `crypto.randomBytes` (128-bit)
- URL Maps divalidasi terhadap domain Google yang dikenal

## Disclaimer

Aktivasi GMaps adalah layanan pihak ketiga dan tidak berafiliasi dengan Google.
Google Maps adalah merek dagang Google.
