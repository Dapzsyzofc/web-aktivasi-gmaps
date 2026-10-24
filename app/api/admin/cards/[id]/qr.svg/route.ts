import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getCardById } from '@/lib/services/cards';
import { generateQRSvg } from '@/lib/services/qr';
import { getPublicUrl } from '@/lib/utils/token';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const card = await getCardById(params.id);
    if (!card) return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 });

    const url = getPublicUrl(card.public_token);
    const svg = await generateQRSvg(url);

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="qr-${card.inventory_code}.svg"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
