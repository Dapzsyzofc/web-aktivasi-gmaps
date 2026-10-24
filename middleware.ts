import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Root: redirect based on auth status
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Already logged in admin visiting login page → go to `next` or dashboard
  if (pathname === '/admin/login' && user) {
    const next = request.nextUrl.searchParams.get('next');
    const target = next && next.startsWith('/admin/') && !next.startsWith('//') ? next : '/admin';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Protect all /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all /api/admin routes
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
