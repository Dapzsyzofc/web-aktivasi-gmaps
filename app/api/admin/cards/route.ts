import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { listCards } from '@/lib/services/cards';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || undefined;
  const batchId = searchParams.get('batch_id') || undefined;
  const search = searchParams.get('search') || undefined;

  try {
    const result = await listCards({ page, limit, status, batchId, search });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
