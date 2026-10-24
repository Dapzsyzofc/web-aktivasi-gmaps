import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { activateCard } from '@/lib/services/cards';
import { activateCardSchema } from '@/lib/validations/schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = activateCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await activateCard(params.id, parsed.data.business_id, session.user.id);
    return NextResponse.json({ message: 'Kartu berhasil diaktifkan' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
