export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Kebijakan Privasi</h1>

          <div className="prose prose-sm text-gray-600 space-y-4">
            <p>
              <strong>Aktivasi GMaps</strong> menghormati privasi pengguna. Kebijakan ini menjelaskan data yang kami kumpulkan dan bagaimana kami menggunakannya.
            </p>

            <h2 className="text-lg font-semibold text-gray-900 mt-6">Data yang Dikumpulkan</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Data bisnis UMKM (nama usaha, URL Google Maps, kontak) yang dimasukkan oleh admin.</li>
              <li>Data kartu (kode inventaris, status, token publik).</li>
              <li>Log aktivitas admin untuk keperluan audit.</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-6">Penggunaan Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mengelola kartu NFC/QR dan redirect ke Google Maps.</li>
              <li>Menyediakan layanan aktivasi kartu untuk UMKM.</li>
              <li>Audit trail untuk keamanan dan operasional.</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mt-6">Penyimpanan Data</h2>
            <p>Data disimpan di server Supabase dan dilindungi dengan enkripsi serta kontrol akses.</p>

            <h2 className="text-lg font-semibold text-gray-900 mt-6">Kontak</h2>
            <p>Untuk pertanyaan terkait privasi, hubungi administrator platform.</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400">
            <p>Aktivasi GMaps adalah layanan pihak ketiga dan tidak berafiliasi dengan Google. Google Maps adalah merek dagang Google.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
