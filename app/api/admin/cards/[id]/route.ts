import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getCardById } from '@/lib/services/cards';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const card = await getCardById(params.id);
    if (!card) return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 });
    return NextResponse.json(card, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
