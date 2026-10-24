'use client';

import { useState, useEffect } from 'react';
import {
  createClient,
  setAdminDeviceSessionCookies,
  clearAdminDeviceSessionCookies,
  SAVED_EMAIL_STORAGE_KEY,
} from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_STORAGE_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === '1') {
        setExpiredNotice(true);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setExpiredNotice(false);
    setLoading(true);

    try {
      setAdminDeviceSessionCookies(rememberMe);
      const supabase = createClient(rememberMe);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        clearAdminDeviceSessionCookies();
        setError('Email atau password salah');
        return;
      }

      setAdminDeviceSessionCookies(rememberMe);

      try {
        if (rememberMe) {
          localStorage.setItem(SAVED_EMAIL_STORAGE_KEY, email.trim());
        } else {
          localStorage.removeItem(SAVED_EMAIL_STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }

      const next = new URLSearchParams(window.location.search).get('next');
      const target =
        next && next.startsWith('/admin/') && !next.startsWith('//')
          ? next
          : '/admin';
      router.push(target);
      router.refresh();
    } catch {
      clearAdminDeviceSessionCookies();
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* Google Maps Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Aktivasi GMaps" width={56} height={56} className="rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Aktivasi GMaps</h1>
          <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">redirect by Dapzsyz</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk ke Dashboard</h2>
          <p className="text-sm text-gray-500 mb-6">Gunakan akun admin untuk melanjutkan</p>

          {expiredNotice && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800" role="status">
              Sesi 7 hari pada perangkat ini telah berakhir. Silakan masuk kembali untuk verifikasi keamanan.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@contoh.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="remember-device"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="remember-device" className="text-xs text-gray-600 leading-snug cursor-pointer select-none">
                <span className="font-medium text-gray-800 block">Ingat perangkat ini (7 hari)</span>
                Simpan login di perangkat ini agar bisa langsung scan &amp; aktivasi kartu tanpa login ulang selama 7 hari.
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Aktivasi GMaps adalah layanan pihak ketiga dan tidak berafiliasi dengan Google.
          <br />Google Maps adalah merek dagang Google.
        </p>
      </div>
    </div>
  );
}
