'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBusinessPage() {
  const [name, setName] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          google_maps_url: mapsUrl || null,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          internal_notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal membuat UMKM');
      }

      const business = await res.json();
      router.push(`/admin/businesses/${business.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tambah UMKM</h1>
        <p className="text-sm text-gray-500 mt-1">Daftarkan data bisnis UMKM baru</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="biz-name" className="label">Nama Usaha *</label>
            <input
              id="biz-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="misal: Warung Makan Sederhana"
              required
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="biz-maps" className="label">URL Google Maps</label>
            <input
              id="biz-maps"
              type="url"
              value={mapsUrl}
              onChange={e => setMapsUrl(e.target.value)}
              className="input"
              placeholder="https://maps.google.com/..."
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">Salin dari Google Maps. Wajib untuk aktivasi kartu.</p>
          </div>

          <div>
            <label htmlFor="biz-contact" className="label">Nama Kontak</label>
            <input
              id="biz-contact"
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="input"
              placeholder="Nama pemilik/PIC"
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="biz-phone" className="label">Nomor Telepon</label>
            <input
              id="biz-phone"
              type="tel"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              className="input"
              placeholder="08xxxxxxxxxx"
              maxLength={20}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="biz-notes" className="label">Catatan Internal</label>
            <textarea
              id="biz-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Catatan internal admin..."
              maxLength={1000}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? 'Menyimpan...' : 'Simpan UMKM'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={loading}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
