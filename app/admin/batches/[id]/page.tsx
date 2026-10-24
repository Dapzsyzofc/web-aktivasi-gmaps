'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBatch();
  }, []);

  async function fetchBatch() {
    try {
      const res = await fetch(`/api/admin/batches/${params.id}`);
      if (res.ok) setBatch(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/batches/${params.id}/delete`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/batches');
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus batch');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setDeleting(false);
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      active: 'badge-active',
      inactive: 'badge-inactive',
      disabled: 'badge-disabled',
    };
    const labels: Record<string, string> = {
      active: '✅ Aktif',
      inactive: '⏳ Belum Aktif',
      disabled: '🚫 Nonaktif',
    };
    return <span className={map[status] || 'badge-inactive'}>{labels[status] || status}</span>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-gray-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Batch tidak ditemukan</p>
        <Link href="/admin/batches" className="text-primary-500 text-sm mt-2 inline-block">← Kembali</Link>
      </div>
    );
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const hasActiveCards = (batch.cards || []).some((c: any) => c.status === 'active');

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/batches" className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-block">← Batch Kartu</Link>
          <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {batch.quantity} kartu • {new Date(batch.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/admin/designer?batch=${batch.id}`}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Papan
          </Link>
          <a
            href={`/api/admin/batches/${batch.id}/export.csv`}
            className="btn-secondary"
            download
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </a>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-danger"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      {batch.notes && (
        <div className="card p-4 mb-6">
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Catatan:</span> {batch.notes}</p>
        </div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Daftar Kartu</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Status</th>
                <th>UMKM</th>
                <th>URL Publik</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(batch.cards || []).map((card: any) => (
                <tr key={card.id}>
                  <td className="font-mono text-xs font-medium text-gray-900">{card.inventory_code}</td>
                  <td>{getStatusBadge(card.status)}</td>
                  <td className="text-sm text-gray-600">{card.businesses?.name || '—'}</td>
                  <td>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${appUrl}/m/${card.public_token}`)}
                      className="text-xs text-primary-500 hover:text-primary-600 font-mono truncate max-w-[180px] block"
                      title="Klik untuk menyalin URL"
                    >
                      /m/{card.public_token.slice(0, 12)}...
                    </button>
                  </td>
                  <td className="flex gap-2">
                    <Link href={`/admin/cards/${card.id}`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">
                      Detail
                    </Link>
                    <a
                      href={`/api/admin/cards/${card.id}/qr.svg`}
                      download
                      className="text-gray-400 hover:text-gray-600 text-xs"
                      title="Unduh QR"
                    >
                      QR ↓
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Batch?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Batch <strong>{batch.name}</strong> dan semua kartu di dalamnya ({batch.quantity} kartu) akan dihapus permanen.
              {hasActiveCards && (
                <span className="block text-red-600 mt-2 font-medium">
                  Batch ini masih memiliki kartu aktif. Nonaktifkan semua kartu terlebih dahulu.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting || hasActiveCards}
                className="btn-danger flex-1"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
