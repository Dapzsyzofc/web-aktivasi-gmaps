import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAuditLog } from '@/lib/services/audit';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const admin = createAdminClient();

    const { data: card } = await admin
      .from('cards')
      .select('inventory_code, status')
      .eq('id', params.id)
      .single();

    if (!card) return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 });

    if (card.status === 'active') {
      return NextResponse.json({ error: 'Nonaktifkan kartu terlebih dahulu sebelum menghapus' }, { status: 400 });
    }

    const { error: deleteError } = await admin
      .from('cards')
      .delete()
      .eq('id', params.id);

    if (deleteError) throw new Error(deleteError.message);

    await createAuditLog({
      actorId: session.user.id,
      entityType: 'card',
      entityId: params.id,
      action: 'card_disabled',
      metadata: { action: 'deleted', inventory_code: card.inventory_code },
    });

    return NextResponse.json({ message: 'Kartu berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
