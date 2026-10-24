import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createBusiness, listBusinesses } from '@/lib/services/businesses';
import { createBusinessSchema } from '@/lib/validations/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || undefined;

  try {
    const result = await listBusinesses(page, limit, search);
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
    const parsed = createBusinessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const business = await createBusiness({
      ...parsed.data,
      createdBy: session.user.id,
    });

    return NextResponse.json(business, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
