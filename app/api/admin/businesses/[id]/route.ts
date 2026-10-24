import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getBusinessById, updateBusiness } from '@/lib/services/businesses';
import { updateBusinessSchema } from '@/lib/validations/schemas';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const business = await getBusinessById(params.id);
    if (!business) return NextResponse.json({ error: 'UMKM tidak ditemukan' }, { status: 404 });
    return NextResponse.json(business);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = updateBusinessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const business = await updateBusiness(params.id, parsed.data, session.user.id);
    return NextResponse.json(business);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
