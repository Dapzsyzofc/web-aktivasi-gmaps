'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, [page, search]);

  async function fetchBusinesses() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotal(data.total || 0);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UMKM</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data bisnis UMKM</p>
        </div>
        <Link href="/admin/businesses/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah UMKM
        </Link>
      </div>

      <div className="card mb-4 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input"
            placeholder="Cari nama usaha atau kontak..."
          />
          <button type="submit" className="btn-secondary whitespace-nowrap">Cari</button>
        </form>
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
        ) : businesses.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Belum ada data UMKM.</p>
            <Link href="/admin/businesses/new" className="btn-primary btn-sm">Tambah UMKM Pertama</Link>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama Usaha</th>
                    <th>Kontak</th>
                    <th>Google Maps</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map(biz => (
                    <tr key={biz.id}>
                      <td className="font-medium text-gray-900">{biz.name}</td>
                      <td className="text-sm text-gray-500">{biz.contact_name || '—'}</td>
                      <td>
                        {biz.google_maps_url ? (
                          <span className="badge-active">URL Set</span>
                        ) : (
                          <span className="badge-inactive">Belum Set</span>
                        )}
                      </td>
                      <td className="text-xs text-gray-400">{new Date(biz.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <Link href={`/admin/businesses/${biz.id}`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">
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
                <p className="text-xs text-gray-500">Total: {total} UMKM</p>
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
