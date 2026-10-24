import { getDashboardStats } from '@/lib/services/dashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function CardIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function InactiveIcon() {
  return (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DisabledIcon() {
  return (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}

export default async function AdminDashboard() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch {
    stats = {
      totalCards: 0, activeCards: 0, inactiveCards: 0, disabledCards: 0,
      totalBusinesses: 0, recentBatches: [], recentActivity: [],
    };
  }

  const statCards = [
    { label: 'Total Kartu', value: stats.totalCards, icon: <CardIcon />, color: 'text-gray-900' },
    { label: 'Aktif', value: stats.activeCards, icon: <ActiveIcon />, color: 'text-green-600' },
    { label: 'Belum Aktif', value: stats.inactiveCards, icon: <InactiveIcon />, color: 'text-amber-500' },
    { label: 'Nonaktif', value: stats.disabledCards, icon: <DisabledIcon />, color: 'text-red-500' },
    { label: 'Total UMKM', value: stats.totalBusinesses, icon: <StoreIcon />, color: 'text-primary-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan aktivitas platform Aktivasi GMaps</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(stat => (
          <div key={stat.label} className="card p-4 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/admin/batches/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Batch Baru
        </Link>
        <Link href="/admin/businesses/new" className="btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah UMKM
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Batch Terbaru</h2>
            <Link href="/admin/batches" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
              Lihat semua →
            </Link>
          </div>
          {stats.recentBatches.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Belum ada batch. Buat batch pertama Anda.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentBatches.map((batch: any) => (
                <Link
                  key={batch.id}
                  href={`/admin/batches/${batch.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{batch.name}</p>
                    <p className="text-xs text-gray-400">{new Date(batch.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{batch.quantity} kartu</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Aktivitas Terbaru</h2>
            <Link href="/admin/audit-logs" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
              Lihat semua →
            </Link>
          </div>
          {stats.recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Belum ada aktivitas tercatat.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentActivity.map((log: any) => (
                <div key={log.id} className="px-5 py-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                    {' — '}
                    <span className="text-gray-500">{log.entity_type}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
