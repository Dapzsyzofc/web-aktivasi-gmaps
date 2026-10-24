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

    const { data: batch } = await admin
      .from('card_batches')
      .select('name')
      .eq('id', params.id)
      .single();

    if (!batch) return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });

    const { count } = await admin
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', params.id)
      .eq('status', 'active');

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus batch karena masih ada ${count} kartu aktif. Nonaktifkan semua kartu terlebih dahulu.` },
        { status: 400 }
      );
    }

    const { error: cardsErr } = await admin
      .from('cards')
      .delete()
      .eq('batch_id', params.id);

    if (cardsErr) throw new Error(cardsErr.message);

    const { error: batchErr } = await admin
      .from('card_batches')
      .delete()
      .eq('id', params.id);

    if (batchErr) throw new Error(batchErr.message);

    await createAuditLog({
      actorId: session.user.id,
      entityType: 'batch',
      entityId: params.id,
      action: 'batch_created',
      metadata: { action: 'deleted', name: batch.name },
    });

    return NextResponse.json({ message: 'Batch berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
