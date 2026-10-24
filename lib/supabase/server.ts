import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 604800 detik (7 hari)
export const SEVEN_DAYS_IN_MS = SEVEN_DAYS_IN_SECONDS * 1000;
export const ONE_DAY_IN_SECONDS = 24 * 60 * 60; // 86400 detik (1 hari)
export const ONE_DAY_IN_MS = ONE_DAY_IN_SECONDS * 1000;
export const ADMIN_LOGIN_AT_COOKIE = 'ag_admin_login_at';
export const ADMIN_REMEMBER_COOKIE = 'ag_admin_remember';

export async function createClient() {
  const cookieStore = cookies();
  const rememberCookie = cookieStore.get(ADMIN_REMEMBER_COOKIE)?.value;
  const maxAge =
    rememberCookie === '0' ? ONE_DAY_IN_SECONDS : SEVEN_DAYS_IN_SECONDS;

  return createServerClient(
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
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: options?.maxAge !== undefined ? options.maxAge : maxAge,
                path: options?.path || '/',
                sameSite: (options?.sameSite as any) || 'lax',
              })
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
