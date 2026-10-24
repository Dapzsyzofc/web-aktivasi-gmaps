'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Batch {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBatches();
  }, [page]);

  async function fetchBatches() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/batches?page=${page}&limit=20`);
      const data = await res.json();
      setBatches(data.batches || []);
      setTotal(data.total || 0);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Kartu</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola batch pembuatan kartu NFC/QR</p>
        </div>
        <Link href="/admin/batches/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Batch
        </Link>
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
        ) : batches.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Belum ada batch kartu.</p>
            <Link href="/admin/batches/new" className="btn-primary btn-sm">Buat Batch Pertama</Link>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama Batch</th>
                    <th>Jumlah</th>
                    <th>Catatan</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => (
                    <tr key={batch.id}>
                      <td className="font-medium text-gray-900">{batch.name}</td>
                      <td>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {batch.quantity} kartu
                        </span>
                      </td>
                      <td className="text-gray-500 max-w-[200px] truncate">{batch.notes || '—'}</td>
                      <td className="text-gray-500 text-xs">{new Date(batch.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <Link href={`/admin/batches/${batch.id}`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">
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
                <p className="text-xs text-gray-500">Total: {total} batch</p>
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
