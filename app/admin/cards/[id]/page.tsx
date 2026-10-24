'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [showActivate, setShowActivate] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    fetchCard();
    fetchBusinesses();
  }, []);

  async function fetchCard() {
    try {
      const res = await fetch(`/api/admin/cards/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCard(data);
        generateQR(data.public_token);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function fetchBusinesses() {
    try {
      const res = await fetch('/api/admin/businesses?limit=100');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch {}
  }

  async function generateQR(token: string) {
    const url = `${window.location.origin}/m/${token}`;
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 4, width: 300 });
      setQrDataUrl(dataUrl);
    } catch {}
  }

  async function handleActivate() {
    if (!selectedBusiness) return;
    setActionLoading('activate');
    try {
      const res = await fetch(`/api/admin/cards/${params.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: selectedBusiness }),
      });
      if (res.ok) {
        setShowActivate(false);
        fetchCard();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengaktifkan');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading('');
    }
  }

  async function handleDisable() {
    setActionLoading('disable');
    try {
      const res = await fetch(`/api/admin/cards/${params.id}/disable`, { method: 'POST' });
      if (res.ok) {
        setConfirmDisable(false);
        fetchCard();
      }
    } catch {} finally {
      setActionLoading('');
    }
  }

  async function handleEnable() {
    setActionLoading('enable');
    try {
      const res = await fetch(`/api/admin/cards/${params.id}/enable`, { method: 'POST' });
      if (res.ok) fetchCard();
    } catch {} finally {
      setActionLoading('');
    }
  }

  async function handleDelete() {
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/admin/cards/${params.id}/delete`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/cards');
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus kartu');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading('');
    }
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

  if (!card) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Kartu tidak ditemukan</p>
        <Link href="/admin/cards" className="text-primary-500 text-sm mt-2 inline-block">← Kembali</Link>
      </div>
    );
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = `${appUrl}/m/${card.public_token}`;
  const statusLabels: Record<string, string> = { active: '✅ Aktif', inactive: '⏳ Belum Aktif', disabled: '🚫 Nonaktif' };
  const statusClass: Record<string, string> = { active: 'badge-active', inactive: 'badge-inactive', disabled: 'badge-disabled' };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/cards" className="text-xs text-gray-400 hover:text-gray-600 mb-2 inline-block">← Semua Kartu</Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{card.inventory_code}</h1>
          <span className={statusClass[card.status] || 'badge-inactive'}>{statusLabels[card.status] || card.status}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="card p-6 flex flex-col items-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mb-4" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400 text-sm">QR Code</div>
          )}
          <p className="text-xs text-gray-500 mb-3 text-center break-all font-mono">{publicUrl}</p>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(publicUrl)} className="btn-secondary btn-sm">
              Salin URL
            </button>
            <a href={`/api/admin/cards/${card.id}/qr.svg`} download className="btn-secondary btn-sm">
              Unduh QR
            </a>
            <Link href={`/admin/designer?card=${card.id}`} className="btn-primary btn-sm">
              Cetak Papan
            </Link>
          </div>
        </div>

        {/* Card Info */}
        <div className="card p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch</p>
            <p className="text-sm text-gray-900 mt-1">{card.card_batches?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">UMKM</p>
            <p className="text-sm text-gray-900 mt-1">
              {card.businesses?.name || <span className="text-gray-400">Belum terhubung</span>}
            </p>
            {card.businesses?.google_maps_url && (
              <a href={card.businesses.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline">
                Buka di Google Maps ↗
              </a>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kontak</p>
            <p className="text-sm text-gray-700 mt-1">{card.businesses?.contact_name || '—'}</p>
            {card.businesses?.contact_phone && (
              <p className="text-xs text-gray-500">{card.businesses.contact_phone}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-500 uppercase tracking-wide">Dibuat</p>
              <p className="text-gray-700 mt-1">{new Date(card.created_at).toLocaleDateString('id-ID')}</p>
            </div>
            {card.activated_at && (
              <div>
                <p className="font-medium text-gray-500 uppercase tracking-wide">Diaktifkan</p>
                <p className="text-gray-700 mt-1">{new Date(card.activated_at).toLocaleDateString('id-ID')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">Aksi</h2>
        <div className="flex flex-wrap gap-3">
          {(card.status === 'inactive' || card.status === 'disabled') && (
            <button onClick={() => setShowActivate(true)} className="btn-primary" disabled={!!actionLoading}>
              Hubungkan ke UMKM & Aktifkan
            </button>
          )}
          {card.status === 'active' && (
            <button onClick={() => setConfirmDisable(true)} className="btn-danger" disabled={!!actionLoading}>
              Nonaktifkan Kartu
            </button>
          )}
          {card.status === 'disabled' && card.business_id && (
            <button onClick={handleEnable} className="btn-secondary" disabled={!!actionLoading}>
              {actionLoading === 'enable' ? 'Memproses...' : 'Aktifkan Kembali'}
            </button>
          )}
          {card.status !== 'active' && (
            <button onClick={() => setConfirmDelete(true)} className="btn-danger" disabled={!!actionLoading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Kartu
            </button>
          )}
        </div>
      </div>

      {/* Activate Modal */}
      {showActivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowActivate(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-4">Hubungkan ke UMKM</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="select-business" className="label">Pilih UMKM *</label>
                <select
                  id="select-business"
                  value={selectedBusiness}
                  onChange={e => setSelectedBusiness(e.target.value)}
                  className="input"
                >
                  <option value="">— Pilih UMKM —</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id} disabled={!b.google_maps_url}>
                      {b.name} {!b.google_maps_url ? '(belum ada URL Maps)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  UMKM harus memiliki URL Google Maps.{' '}
                  <Link href="/admin/businesses/new" className="text-primary-500 hover:underline">Buat UMKM baru</Link>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleActivate}
                  disabled={!selectedBusiness || actionLoading === 'activate'}
                  className="btn-primary flex-1"
                >
                  {actionLoading === 'activate' ? 'Memproses...' : 'Aktifkan'}
                </button>
                <button onClick={() => setShowActivate(false)} className="btn-secondary">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable Confirm */}
      {confirmDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setConfirmDisable(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">Nonaktifkan Kartu?</h3>
            <p className="text-sm text-gray-500 mb-4">Kartu ini tidak akan redirect ke Google Maps lagi setelah dinonaktifkan.</p>
            <div className="flex gap-3">
              <button onClick={handleDisable} disabled={actionLoading === 'disable'} className="btn-danger flex-1">
                {actionLoading === 'disable' ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
              <button onClick={() => setConfirmDisable(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Kartu?</h3>
            <p className="text-sm text-gray-500 mb-4">Kartu ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={actionLoading === 'delete'} className="btn-danger flex-1">
                {actionLoading === 'delete' ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
