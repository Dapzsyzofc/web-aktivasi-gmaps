import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAuditLog } from './audit';

export async function getCardById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('cards')
    .select('*, card_batches(name), businesses(name, google_maps_url, contact_name, contact_phone)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getCardByToken(token: string) {
  const admin = createAdminClient();
  const cleanToken = decodeURIComponent(token).trim();

  const { data, error } = await admin
    .from('cards')
    .select('id, status, public_token, business_id, businesses(id, name, google_maps_url)')
    .eq('public_token', cleanToken)
    .maybeSingle();

  if (error || !data) return null;

  let business = Array.isArray(data.businesses) ? data.businesses[0] : (data.businesses as any);

  if (!business?.google_maps_url && data.business_id) {
    const { data: bizData } = await admin
      .from('businesses')
      .select('id, name, google_maps_url')
      .eq('id', data.business_id)
      .maybeSingle();
    if (bizData) {
      business = bizData;
    }
  }

  return {
    ...data,
    businesses: business || null,
  };
}

export async function listCards(params: {
  page?: number;
  limit?: number;
  status?: string;
  batchId?: string;
  search?: string;
}) {
  const admin = createAdminClient();
  const { page = 1, limit = 20, status, batchId, search } = params;
  const offset = (page - 1) * limit;

  let query = admin
    .from('cards')
    .select('*, card_batches(name), businesses(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (batchId) query = query.eq('batch_id', batchId);
  if (search) {
    query = query.or(`inventory_code.ilike.%${search}%,public_token.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { cards: data || [], total: count || 0 };
}

export async function activateCard(cardId: string, businessId: string, actorId: string) {
  const admin = createAdminClient();

  const { data: business } = await admin
    .from('businesses')
    .select('google_maps_url')
    .eq('id', businessId)
    .single();

  if (!business?.google_maps_url) {
    throw new Error('UMKM harus memiliki URL Google Maps sebelum aktivasi');
  }

  const { data: updatedCard, error } = await admin
    .from('cards')
    .update({
      status: 'active',
      business_id: businessId,
      activated_at: new Date().toISOString(),
      disabled_at: null,
    })
    .eq('id', cardId)
    .select('id, public_token, status')
    .single();

  if (error || !updatedCard) {
    throw new Error(`Gagal mengaktifkan kartu: ${error?.message || 'Kartu tidak ditemukan'}`);
  }

  try {
    revalidatePath(`/m/${updatedCard.public_token}`);
    revalidatePath('/m/[token]', 'page');
  } catch {
    // Ignore revalidate errors outside request context
  }

  await createAuditLog({
    actorId,
    entityType: 'card',
    entityId: cardId,
    action: 'card_activated',
    metadata: { business_id: businessId },
  });
}

export async function disableCard(cardId: string, actorId: string) {
  const admin = createAdminClient();

  const { data: updatedCard, error } = await admin
    .from('cards')
    .update({
      status: 'disabled',
      disabled_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .eq('status', 'active')
    .select('id, public_token, status')
    .single();

  if (error || !updatedCard) {
    throw new Error(`Gagal menonaktifkan kartu: ${error?.message || 'Kartu tidak ditemukan'}`);
  }

  try {
    revalidatePath(`/m/${updatedCard.public_token}`);
    revalidatePath('/m/[token]', 'page');
  } catch {
    // Ignore revalidate errors outside request context
  }

  await createAuditLog({
    actorId,
    entityType: 'card',
    entityId: cardId,
    action: 'card_disabled',
  });
}

export async function enableCard(cardId: string, actorId: string) {
  const admin = createAdminClient();

  const { data: card } = await admin
    .from('cards')
    .select('business_id, businesses(google_maps_url)')
    .eq('id', cardId)
    .single();

  const business = Array.isArray(card?.businesses) ? card.businesses[0] : (card as any)?.businesses;

  if (!card?.business_id || !business?.google_maps_url) {
    throw new Error('Kartu harus terhubung ke UMKM dengan URL Maps yang valid');
  }

  const { data: updatedCard, error } = await admin
    .from('cards')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      disabled_at: null,
    })
    .eq('id', cardId)
    .eq('status', 'disabled')
    .select('id, public_token, status')
    .single();

  if (error || !updatedCard) {
    throw new Error(`Gagal mengaktifkan kembali kartu: ${error?.message || 'Kartu tidak ditemukan'}`);
  }

  try {
    revalidatePath(`/m/${updatedCard.public_token}`);
    revalidatePath('/m/[token]', 'page');
  } catch {
    // Ignore revalidate errors outside request context
  }

  await createAuditLog({
    actorId,
    entityType: 'card',
    entityId: cardId,
    action: 'card_enabled',
  });
}
