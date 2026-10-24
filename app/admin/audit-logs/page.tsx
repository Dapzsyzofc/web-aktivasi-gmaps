'use client';

import { useState, useEffect } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, entityType]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (entityType) params.set('entity_type', entityType);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 30);

  const actionLabels: Record<string, string> = {
    batch_created: 'Batch dibuat',
    card_activated: 'Kartu diaktifkan',
    card_disabled: 'Kartu dinonaktifkan',
    card_enabled: 'Kartu diaktifkan kembali',
    card_linked: 'Kartu dihubungkan',
    business_created: 'UMKM dibuat',
    business_updated: 'UMKM diperbarui',
    maps_url_changed: 'URL Maps diubah',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Riwayat semua perubahan pada sistem</p>
      </div>

      <div className="card mb-4 p-4">
        <select
          value={entityType}
          onChange={e => { setEntityType(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Semua Tipe</option>
          <option value="batch">Batch</option>
          <option value="card">Kartu</option>
          <option value="business">UMKM</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Memuat log...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">Belum ada audit log.</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Aksi</th>
                    <th>Tipe</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="text-sm font-medium text-gray-900">
                        {actionLabels[log.action] || log.action}
                      </td>
                      <td>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{log.entity_type}</span>
                      </td>
                      <td className="text-xs text-gray-500 max-w-[300px] truncate">
                        {log.metadata && Object.keys(log.metadata).length > 0
                          ? JSON.stringify(log.metadata)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Total: {total} log</p>
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
