'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Mode = 'new' | 'existing';

export default function ActivatePage() {
  const params = useParams();
  const token = String(params.token);

  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [mode, setMode] = useState<Mode>('new');
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [form, setForm] = useState({ name: '', google_maps_url: '', contact_name: '', contact_phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [justActivated, setJustActivated] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/activate/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async res => {
        if (res.status === 404) setNotFound(true);
        else if (res.ok) setCard(await res.json());
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/admin/businesses?limit=100', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => data && setBusinesses((data.businesses || []).filter((b: any) => b.google_maps_url)))
      .catch(() => {});
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body =
        mode === 'existing'
          ? { business_id: selectedBusiness }
          : {
              new_business: {
                name: form.name.trim(),
                google_maps_url: form.google_maps_url.trim(),
                contact_name: form.contact_name.trim() || null,
                contact_phone: form.contact_phone.trim() || null,
              },
            };
      const res = await fetch(`/api/admin/activate/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal mengaktifkan');
        return;
      }
      setCard(data);
      setJustActivated(true);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-gray-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-xl font-semibold text-gray-900">Kartu tidak ditemukan</h1>
        <p className="text-sm text-gray-500 mt-2">QR/NFC ini tidak terdaftar di sistem.</p>
        <Link href="/admin/cards" className="btn-secondary mt-6 inline-flex">Ke Semua Kartu</Link>
      </div>
    );
  }

  const isActive = card.status === 'active';
  const business = Array.isArray(card.businesses) ? card.businesses[0] : card.businesses;

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktivasi Papan</p>
        <h1 className="text-2xl font-bold text-gray-900 font-mono mt-1">{card.inventory_code}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {card.card_batches?.name ? `Batch ${card.card_batches.name}` : 'Tanpa batch'}
        </p>
      </div>

      {isActive ? (
        <div className="card p-6 space-y-4">
          <div className={`rounded-lg px-4 py-3 text-sm ${justActivated ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
            {justActivated
              ? 'Berhasil! Papan ini sekarang mengarah ke Google Maps UMKM di bawah.'
              : 'Papan ini sudah aktif.'}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">UMKM</p>
            <p className="text-base font-medium text-gray-900 mt-1">{business?.name}</p>
            {business?.google_maps_url && (
              <p className="text-xs text-gray-500 mt-1 break-all">{business.google_maps_url}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {business?.google_maps_url && (
              <a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                Tes buka Google Maps
              </a>
            )}
            <Link href={`/admin/cards/${card.id}`} className="btn-secondary w-full">Detail Kartu</Link>
          </div>
          <p className="text-xs text-gray-400">
            Untuk mengganti UMKM, nonaktifkan kartu dulu di halaman detail, lalu scan ulang papan ini.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {card.status === 'disabled' && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Kartu ini sebelumnya dinonaktifkan. Mengaktifkan akan menghubungkannya ke UMKM yang Anda pilih.
            </div>
          )}

          <div role="tablist" aria-label="Pilih sumber UMKM" className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
            {([['new', 'UMKM Baru'], ['existing', 'UMKM Terdaftar']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => { setMode(value); setError(''); }}
                className={`py-2.5 text-sm rounded-md transition-colors ${mode === value ? 'bg-white text-gray-900 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'new' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="biz-name" className="label">Nama Usaha *</label>
                <input id="biz-name" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={200} />
              </div>
              <div>
                <label htmlFor="biz-maps" className="label">Link Google Maps *</label>
                <input
                  id="biz-maps"
                  type="url"
                  inputMode="url"
                  className="input"
                  placeholder="https://maps.app.goo.gl/xxxx"
                  value={form.google_maps_url}
                  onChange={e => setForm({ ...form, google_maps_url: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Buka Google Maps → lokasi usaha → Bagikan → Salin link.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="biz-contact" className="label">Nama Kontak</label>
                  <input id="biz-contact" className="input" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} maxLength={100} />
                </div>
                <div>
                  <label htmlFor="biz-phone" className="label">No. HP</label>
                  <input id="biz-phone" type="tel" inputMode="tel" className="input" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} maxLength={20} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="biz-select" className="label">Pilih UMKM *</label>
              <select id="biz-select" className="input" value={selectedBusiness} onChange={e => setSelectedBusiness(e.target.value)} required>
                <option value="">— Pilih UMKM —</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {businesses.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Belum ada UMKM dengan link Google Maps. Gunakan tab UMKM Baru.</p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Mengaktifkan...' : 'Aktifkan Papan'}
          </button>
        </form>
      )}
    </div>
  );
}
