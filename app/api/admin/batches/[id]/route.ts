import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getBatchById } from '@/lib/services/batches';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const batch = await getBatchById(params.id);
    if (!batch) return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });
    return NextResponse.json(batch);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
