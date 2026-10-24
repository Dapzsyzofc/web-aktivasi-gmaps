import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 604800 detik (7 hari)
const SEVEN_DAYS_IN_MS = SEVEN_DAYS_IN_SECONDS * 1000;
const ONE_DAY_IN_SECONDS = 24 * 60 * 60; // 86400 detik (1 hari)
const ONE_DAY_IN_MS = ONE_DAY_IN_SECONDS * 1000;
const ADMIN_LOGIN_AT_COOKIE = 'ag_admin_login_at';
const ADMIN_REMEMBER_COOKIE = 'ag_admin_remember';

function withSupabaseCookies(
  targetResponse: NextResponse,
  supabaseResponse: NextResponse
): NextResponse {
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    targetResponse.cookies.set(cookie);
  });
  return targetResponse;
}

function checkSessionExpired(
  request: NextRequest,
  lastSignInAt?: string | null
): boolean {
  const loginAtRaw = request.cookies.get(ADMIN_LOGIN_AT_COOKIE)?.value;
  const rememberRaw = request.cookies.get(ADMIN_REMEMBER_COOKIE)?.value;
  const maxDurationMs =
    rememberRaw === '0' ? ONE_DAY_IN_MS : SEVEN_DAYS_IN_MS;
  const now = Date.now();

  if (loginAtRaw) {
    const loginAt = Number(loginAtRaw);
    if (!Number.isNaN(loginAt) && loginAt > 0 && now - loginAt > maxDurationMs) {
      return true;
    }
  }

  if (lastSignInAt) {
    const signInTime = new Date(lastSignInAt).getTime();
    if (!Number.isNaN(signInTime) && signInTime > 0 && now - signInTime > maxDurationMs) {
      return true;
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const rememberRaw = request.cookies.get(ADMIN_REMEMBER_COOKIE)?.value;
  const maxAge =
    rememberRaw === '0' ? ONE_DAY_IN_SECONDS : SEVEN_DAYS_IN_SECONDS;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge,
        path: '/',
        sameSite: 'lax',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: options?.maxAge !== undefined ? options.maxAge : maxAge,
              path: options?.path || '/',
              sameSite: (options?.sameSite as any) || 'lax',
            });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  let activeUser = user;

  // Enforce 7-day re-login verification
  if (activeUser && checkSessionExpired(request, activeUser.last_sign_in_at)) {
    await supabase.auth.signOut();
    activeUser = null;
    request.cookies.delete(ADMIN_LOGIN_AT_COOKIE);
    request.cookies.delete(ADMIN_REMEMBER_COOKIE);
    supabaseResponse.cookies.delete(ADMIN_LOGIN_AT_COOKIE);
    supabaseResponse.cookies.delete(ADMIN_REMEMBER_COOKIE);

    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('expired', '1');
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      }
      return withSupabaseCookies(NextResponse.redirect(loginUrl), supabaseResponse);
    }

    if (pathname.startsWith('/api/admin')) {
      return withSupabaseCookies(
        NextResponse.json(
          { error: 'Sesi 7 hari telah berakhir. Silakan login kembali.' },
          { status: 401 }
        ),
        supabaseResponse
      );
    }
  } else if (activeUser && !request.cookies.get(ADMIN_LOGIN_AT_COOKIE)?.value) {
    // Backfill login timestamp cookie if missing on an active session
    const initialTimestamp = activeUser.last_sign_in_at
      ? String(new Date(activeUser.last_sign_in_at).getTime())
      : String(Date.now());
    supabaseResponse.cookies.set(ADMIN_LOGIN_AT_COOKIE, initialTimestamp, {
      maxAge,
      path: '/',
      sameSite: 'lax',
    });
  }

  // Public scan route /m/[token]: middleware only refreshes session cookies so route handler sees active admin
  if (pathname.startsWith('/m/')) {
    return supabaseResponse;
  }

  // Root: redirect based on auth status
  if (pathname === '/') {
    if (activeUser) {
      return withSupabaseCookies(
        NextResponse.redirect(new URL('/admin', request.url)),
        supabaseResponse
      );
    }
    return withSupabaseCookies(
      NextResponse.redirect(new URL('/admin/login', request.url)),
      supabaseResponse
    );
  }

  // Already logged in admin visiting login page → go to `next` or dashboard
  if (pathname === '/admin/login' && activeUser) {
    const next = request.nextUrl.searchParams.get('next');
    const target =
      next && next.startsWith('/admin/') && !next.startsWith('//')
        ? next
        : '/admin';
    return withSupabaseCookies(
      NextResponse.redirect(new URL(target, request.url)),
      supabaseResponse
    );
  }

  // Protect all /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!activeUser) {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      }
      return withSupabaseCookies(
        NextResponse.redirect(loginUrl),
        supabaseResponse
      );
    }
  }

  // Protect all /api/admin routes
  if (pathname.startsWith('/api/admin')) {
    if (!activeUser) {
      return withSupabaseCookies(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        supabaseResponse
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/m/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
