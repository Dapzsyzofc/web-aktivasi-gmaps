import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 mb-6">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <Link href="/" className="btn-primary">
          Kembali ke Beranda
        </Link>
        <div className="mt-8 text-xs text-gray-400">
          <p>Aktivasi GMaps</p>
          <p className="text-[9px] mt-0.5">redirect by Dapzsyz</p>
        </div>
      </div>
    </div>
  );
}
