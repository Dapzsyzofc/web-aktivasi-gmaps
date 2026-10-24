import { cookies } from 'next/headers';
import {
  createClient,
  SEVEN_DAYS_IN_MS,
  ONE_DAY_IN_MS,
  ADMIN_LOGIN_AT_COOKIE,
  ADMIN_REMEMBER_COOKIE,
} from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export function isDeviceSessionExpired(
  loginAtCookieValue?: string,
  rememberCookieValue?: string,
  lastSignInAt?: string | null
): boolean {
  const maxDurationMs =
    rememberCookieValue === '0' ? ONE_DAY_IN_MS : SEVEN_DAYS_IN_MS;
  const now = Date.now();

  if (loginAtCookieValue) {
    const loginAt = Number(loginAtCookieValue);
    if (!Number.isNaN(loginAt) && loginAt > 0) {
      if (now - loginAt > maxDurationMs) {
        return true;
      }
    }
  }

  if (lastSignInAt) {
    const signInTime = new Date(lastSignInAt).getTime();
    if (!Number.isNaN(signInTime) && signInTime > 0) {
      if (now - signInTime > maxDurationMs) {
        return true;
      }
    }
  }

  return false;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const cookieStore = cookies();
  const loginAtCookie = cookieStore.get(ADMIN_LOGIN_AT_COOKIE)?.value;
  const rememberCookie = cookieStore.get(ADMIN_REMEMBER_COOKIE)?.value;

  if (isDeviceSessionExpired(loginAtCookie, rememberCookie, user.last_sign_in_at)) {
    return null;
  }

  return { user };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized', session: null, profile: null };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Forbidden', session: null, profile: null };
  }

  return { error: null, session, profile };
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
