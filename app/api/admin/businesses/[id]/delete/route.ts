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

    const { data: business } = await admin
      .from('businesses')
      .select('name')
      .eq('id', params.id)
      .single();

    if (!business) return NextResponse.json({ error: 'UMKM tidak ditemukan' }, { status: 404 });

    const { data: linkedCards } = await admin
      .from('cards')
      .select('id')
      .eq('business_id', params.id)
      .eq('status', 'active')
      .limit(1);

    if (linkedCards && linkedCards.length > 0) {
      return NextResponse.json({
        error: 'UMKM masih memiliki kartu aktif. Nonaktifkan kartu terlebih dahulu.'
      }, { status: 400 });
    }

    await admin
      .from('cards')
      .update({ business_id: null })
      .eq('business_id', params.id);

    const { error: deleteError } = await admin
      .from('businesses')
      .delete()
      .eq('id', params.id);

    if (deleteError) throw new Error(deleteError.message);

    await createAuditLog({
      actorId: session.user.id,
      entityType: 'business',
      entityId: params.id,
      action: 'business_updated',
      metadata: { action: 'deleted', name: business.name },
    });

    return NextResponse.json({ message: 'UMKM berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
