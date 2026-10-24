import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createBatch, listBatches } from '@/lib/services/batches';
import { createBatchSchema } from '@/lib/validations/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const result = await listBatches(page, limit);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const batch = await createBatch({
      ...parsed.data,
      createdBy: session.user.id,
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
