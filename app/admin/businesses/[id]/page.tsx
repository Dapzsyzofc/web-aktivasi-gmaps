'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', google_maps_url: '', contact_name: '', contact_phone: '', internal_notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusiness();
  }, []);

  async function fetchBusiness() {
    try {
      const res = await fetch(`/api/admin/businesses/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
        setForm({
          name: data.name || '',
          google_maps_url: data.google_maps_url || '',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          internal_notes: data.internal_notes || '',
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/businesses/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          google_maps_url: form.google_maps_url || null,
          contact_name: form.contact_name || null,
          contact_phone: form.contact_phone || null,
          internal_notes: form.internal_notes || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
        setEditing(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
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

  if (!business) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">UMKM tidak ditemukan</p>
        <Link href="/admin/businesses" className="text-primary-500 text-sm mt-2 inline-block">← Kembali</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/admin/businesses" className="text-xs text-gray-400 hover:text-gray-600 mb-2 inline-block">← Semua UMKM</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        {!editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">
              Edit
            </button>
            <button onClick={() => setConfirmDelete(true)} className="btn-danger btn-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>
          </div>
        )}
      </div>

      <div className="card p-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="label">Nama Usaha *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">URL Google Maps</label>
              <input type="url" value={form.google_maps_url} onChange={e => setForm({ ...form, google_maps_url: e.target.value })} className="input" placeholder="https://maps.google.com/..." />
            </div>
            <div>
              <label className="label">Nama Kontak</label>
              <input type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Nomor Telepon</label>
              <input type="tel" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Catatan Internal</label>
              <textarea value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })} className="input min-h-[80px] resize-y" />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary flex-1">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary" disabled={saving}>Batal</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nama Usaha</p>
              <p className="text-sm text-gray-900 mt-1">{business.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">URL Google Maps</p>
              {business.google_maps_url ? (
                <a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:underline mt-1 block break-all">
                  {business.google_maps_url}
                </a>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Belum diset</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kontak</p>
              <p className="text-sm text-gray-700 mt-1">{business.contact_name || '—'}</p>
              {business.contact_phone && <p className="text-xs text-gray-500">{business.contact_phone}</p>}
            </div>
            {business.internal_notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Catatan</p>
                <p className="text-sm text-gray-600 mt-1">{business.internal_notes}</p>
              </div>
            )}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Dibuat: {new Date(business.created_at).toLocaleString('id-ID')} • Terakhir diperbarui: {new Date(business.updated_at).toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">Hapus UMKM?</h3>
            <p className="text-sm text-gray-500 mb-4">
              UMKM <strong>{business.name}</strong> akan dihapus permanen. Kartu yang terhubung (non-aktif) akan dilepas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch(`/api/admin/businesses/${params.id}/delete`, { method: 'DELETE' });
                    if (res.ok) {
                      router.push('/admin/businesses');
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Gagal menghapus');
                    }
                  } catch {
                    alert('Terjadi kesalahan');
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
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
