import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getCardByToken } from '@/lib/services/cards';
import { requireAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function isAdmin() {
  try {
    const { error } = await requireAdmin();
    return !error;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  noStore();

  try {
    const rawToken = decodeURIComponent(params.token).trim();
    const card = await getCardByToken(rawToken);

    if (!card) {
      return new NextResponse(renderHTML('not_found'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE_HEADERS },
      });
    }

    if (card.status === 'active') {
      const business = Array.isArray(card.businesses)
        ? card.businesses[0]
        : (card.businesses as any);
      const mapsUrl = business?.google_maps_url?.trim();

      if (mapsUrl) {
        return NextResponse.redirect(mapsUrl, {
          status: 302,
          headers: NO_STORE_HEADERS,
        });
      }
    }

    const activatePath = `/admin/activate/${encodeURIComponent(rawToken)}`;

    if (await isAdmin()) {
      return NextResponse.redirect(new URL(activatePath, request.url), {
        status: 302,
        headers: NO_STORE_HEADERS,
      });
    }

    if (card.status === 'disabled') {
      return new NextResponse(renderHTML('disabled'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE_HEADERS },
      });
    }

    // inactive
    const loginHref = `/admin/login?next=${encodeURIComponent(activatePath)}`;
    return new NextResponse(renderHTML('inactive', loginHref), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE_HEADERS },
    });
  } catch {
    return new NextResponse(renderHTML('error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE_HEADERS },
    });
  }
}

function renderHTML(status: 'inactive' | 'disabled' | 'not_found' | 'error', adminHref?: string): string {
  const config: Record<string, { title: string; message: string; sub: string; icon: string }> = {
    inactive: {
      title: 'Kartu Belum Diaktifkan',
      message: 'Kartu ini belum diaktifkan.',
      sub: 'Silakan hubungi penjual kartu untuk melakukan aktivasi.',
      icon: '⏳',
    },
    disabled: {
      title: 'Kartu Tidak Tersedia',
      message: 'Kartu ini sudah dinonaktifkan.',
      sub: 'Hubungi penjual untuk informasi lebih lanjut.',
      icon: '🚫',
    },
    not_found: {
      title: 'Kartu Tidak Ditemukan',
      message: 'Kartu yang Anda cari tidak ditemukan.',
      sub: 'Pastikan QR code atau link yang Anda gunakan benar.',
      icon: '❓',
    },
    error: {
      title: 'Terjadi Kesalahan',
      message: 'Maaf, terjadi kesalahan pada server.',
      sub: 'Silakan coba lagi beberapa saat.',
      icon: '⚠️',
    },
  };

  const c = config[status];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${c.title} — Aktivasi GMaps</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,sans-serif;background:#FAFAFA;color:#212121;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border:1px solid #E0E0E0;border-radius:16px;padding:40px 32px;max-width:400px;width:100%;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:20px;font-weight:600;color:#212121;margin-bottom:8px}
    p{font-size:14px;color:#616161;line-height:1.6}
    .sub{margin-top:8px;font-size:13px;color:#9E9E9E}
    .admin{display:inline-block;margin-top:24px;font-size:12px;color:#1A73E8;text-decoration:none;padding:8px 12px;border-radius:8px}
    .admin:hover,.admin:focus-visible{background:#E8F0FE}
    .brand{margin-top:32px;font-size:12px;color:#BDBDBD}
    .brand span{display:block;font-size:9px;margin-top:2px}
    .footer{margin-top:24px;font-size:10px;color:#BDBDBD;text-align:center;max-width:400px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${c.icon}</div>
    <h1>${c.title}</h1>
    <p>${c.message}</p>
    <p class="sub">${c.sub}</p>
    ${adminHref ? `<a class="admin" href="${adminHref}">Admin? Masuk untuk mengaktifkan</a>` : ''}
    <div class="brand">Aktivasi GMaps<span>redirect by Dapzsyz</span></div>
  </div>
  <div class="footer">Aktivasi GMaps adalah layanan pihak ketiga dan tidak berafiliasi dengan Google. Google Maps adalah merek dagang Google.</div>
</body>
</html>`;
}
