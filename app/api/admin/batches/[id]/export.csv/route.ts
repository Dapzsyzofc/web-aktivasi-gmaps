import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCSV } from '@/lib/utils/csv';
import { getPublicUrl } from '@/lib/utils/token';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data: batch } = await admin.from('card_batches').select('name').eq('id', params.id).single();
    if (!batch) return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });

    const { data: cards } = await admin
      .from('cards')
      .select('inventory_code, public_token, status, created_at')
      .eq('batch_id', params.id)
      .order('inventory_code', { ascending: true });

    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'Tidak ada kartu dalam batch' }, { status: 404 });
    }

    const headers = ['batch_name', 'inventory_code', 'public_url', 'status', 'created_at'];
    const rows = cards.map(card => ({
      batch_name: batch.name,
      inventory_code: card.inventory_code,
      public_url: getPublicUrl(card.public_token),
      status: card.status,
      created_at: card.created_at,
    }));

    const csv = generateCSV(headers, rows);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="batch-${batch.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
