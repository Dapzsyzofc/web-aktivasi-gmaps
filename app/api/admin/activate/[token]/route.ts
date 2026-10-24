import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { activateCard } from '@/lib/services/cards';
import { createBusiness } from '@/lib/services/businesses';
import { createBusinessSchema, googleMapsUrlSchema } from '@/lib/validations/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function findCard(token: string) {
  const admin = createAdminClient();
  const cleanToken = decodeURIComponent(token).trim();
  const { data } = await admin
    .from('cards')
    .select('id, inventory_code, status, public_token, business_id, activated_at, card_batches(name), businesses(id, name, google_maps_url)')
    .eq('public_token', cleanToken)
    .maybeSingle();
  return data;
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const card = await findCard(params.token);
  if (!card) return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 });
  return NextResponse.json(card, { headers: { 'Cache-Control': 'no-store' } });
}

const existingSchema = z.object({ business_id: z.string().uuid('ID UMKM tidak valid') });
const newBusinessSchema = createBusinessSchema.extend({ google_maps_url: googleMapsUrlSchema });

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  try {
    const card = await findCard(params.token);
    if (!card) return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 });
    if (card.status === 'active') {
      return NextResponse.json({ error: 'Kartu ini sudah aktif' }, { status: 400 });
    }

    const body = await request.json();
    let businessId: string;

    if (body?.new_business) {
      const parsed = newBusinessSchema.safeParse(body.new_business);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
      }
      const nb = parsed.data;
      const business = await createBusiness({
        name: nb.name,
        google_maps_url: nb.google_maps_url,
        contact_name: nb.contact_name || null,
        contact_phone: nb.contact_phone || null,
        internal_notes: nb.internal_notes || null,
        createdBy: session.user.id,
      });
      businessId = business.id;
    } else {
      const parsed = existingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Pilih UMKM terlebih dahulu' }, { status: 400 });
      }
      businessId = parsed.data.business_id;
    }

    await activateCard(card.id, businessId, session.user.id);
    const updated = await findCard(params.token);
    return NextResponse.json(updated, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
