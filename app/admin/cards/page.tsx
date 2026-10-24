'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchCards();
  }, [page, status, search]);

  async function fetchCards() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/cards?${params}`);
      const data = await res.json();
      setCards(data.cards || []);
      setTotal(data.total || 0);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function getStatusBadge(s: string) {
    const map: Record<string, string> = { active: 'badge-active', inactive: 'badge-inactive', disabled: 'badge-disabled' };
    const labels: Record<string, string> = { active: '✅ Aktif', inactive: '⏳ Belum Aktif', disabled: '🚫 Nonaktif' };
    return <span className={map[s] || 'badge-inactive'}>{labels[s] || s}</span>;
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Semua Kartu</h1>
        <p className="text-sm text-gray-500 mt-1">Cari dan kelola semua kartu NFC/QR</p>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="input"
              placeholder="Cari kode inventaris atau token..."
            />
            <button type="submit" className="btn-secondary whitespace-nowrap">Cari</button>
          </form>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="">Semua Status</option>
            <option value="inactive">Belum Aktif</option>
            <option value="active">Aktif</option>
            <option value="disabled">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Memuat data...
          </div>
        ) : cards.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">Tidak ada kartu ditemukan.</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Status</th>
                    <th>Batch</th>
                    <th>UMKM</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr key={card.id}>
                      <td className="font-mono text-xs font-medium text-gray-900">{card.inventory_code}</td>
                      <td>{getStatusBadge(card.status)}</td>
                      <td className="text-sm text-gray-500">{card.card_batches?.name || '—'}</td>
                      <td className="text-sm text-gray-600">{card.businesses?.name || '—'}</td>
                      <td className="text-xs text-gray-400">{new Date(card.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <Link href={`/admin/cards/${card.id}`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Total: {total} kartu</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost btn-sm">← Prev</button>
                  <span className="text-xs text-gray-500 py-1.5">Hal {page}/{totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost btn-sm">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
