'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBatchPage() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const presets = [1, 10, 20, 50, 100];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity, notes: notes || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal membuat batch');
      }

      const batch = await res.json();
      router.push(`/admin/batches/${batch.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Batch Baru</h1>
        <p className="text-sm text-gray-500 mt-1">Buat batch kartu NFC/QR dengan token unik</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="batch-name" className="label">Nama Batch *</label>
            <input
              id="batch-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="misal: Batch Oktober 2024"
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="batch-quantity" className="label">Jumlah Kartu *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presets.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    quantity === n
                      ? 'bg-primary-50 border-primary-300 text-primary-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              id="batch-quantity"
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              className="input"
              min={1}
              max={1000}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">Minimal 1, maksimal 1.000 kartu per batch</p>
          </div>

          <div>
            <label htmlFor="batch-notes" className="label">Catatan (opsional)</label>
            <textarea
              id="batch-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Catatan internal tentang batch ini..."
              maxLength={500}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !name || quantity < 1} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Membuat {quantity} kartu...
                </span>
              ) : `Buat ${quantity} Kartu`}
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
