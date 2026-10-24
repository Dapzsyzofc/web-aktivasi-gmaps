'use client';

import { createBrowserClient } from '@supabase/ssr';

export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 604800 detik (7 hari)
export const ONE_DAY_IN_SECONDS = 24 * 60 * 60; // 86400 detik (1 hari)
export const ADMIN_LOGIN_AT_COOKIE = 'ag_admin_login_at';
export const ADMIN_REMEMBER_COOKIE = 'ag_admin_remember';
export const SAVED_EMAIL_STORAGE_KEY = 'ag_admin_saved_email';

function getRememberPreferenceFromCookie(): boolean {
  if (typeof document === 'undefined') return true;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_REMEMBER_COOKIE}=([^;]*)`)
  );
  if (!match) return true;
  return decodeURIComponent(match[1]) !== '0';
}

export function setAdminDeviceSessionCookies(rememberMe: boolean) {
  if (typeof document === 'undefined') return;
  const maxAge = rememberMe ? SEVEN_DAYS_IN_SECONDS : ONE_DAY_IN_SECONDS;
  const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isHttps ? '; Secure' : '';
  const now = String(Date.now());

  document.cookie = `${ADMIN_REMEMBER_COOKIE}=${rememberMe ? '1' : '0'}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `${ADMIN_LOGIN_AT_COOKIE}=${now}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
}

export function clearAdminDeviceSessionCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_REMEMBER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ADMIN_LOGIN_AT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function createClient(rememberOverride?: boolean) {
  const remember =
    typeof rememberOverride === 'boolean'
      ? rememberOverride
      : getRememberPreferenceFromCookie();
  const maxAge = remember ? SEVEN_DAYS_IN_SECONDS : ONE_DAY_IN_SECONDS;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge,
        path: '/',
        sameSite: 'lax',
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      },
    }
  );
}
