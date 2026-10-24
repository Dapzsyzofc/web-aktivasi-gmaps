import { createAdminClient } from '@/lib/supabase/admin';
import { generatePublicToken, generateInventoryCode, generateBatchPrefix } from '@/lib/utils/token';
import { createAuditLog } from './audit';

interface CreateBatchParams {
  name: string;
  quantity: number;
  notes?: string | null;
  createdBy: string;
}

export async function createBatch(params: CreateBatchParams) {
  const admin = createAdminClient();
  const { name, quantity, notes, createdBy } = params;

  const { data: batch, error: batchError } = await admin
    .from('card_batches')
    .insert({ name, quantity, notes, created_by: createdBy })
    .select()
    .single();

  if (batchError || !batch) {
    throw new Error(`Failed to create batch: ${batchError?.message}`);
  }

  const batchPrefix = generateBatchPrefix();
  const cards = [];

  const existingTokens = new Set<string>();

  for (let i = 1; i <= quantity; i++) {
    let token: string;
    do {
      token = generatePublicToken();
    } while (existingTokens.has(token));
    existingTokens.add(token);

    cards.push({
      batch_id: batch.id,
      inventory_code: generateInventoryCode(batchPrefix, i),
      public_token: token,
      status: 'inactive' as const,
    });
  }

  const { error: cardsError } = await admin.from('cards').insert(cards);

  if (cardsError) {
    await admin.from('card_batches').delete().eq('id', batch.id);
    throw new Error(`Failed to create cards: ${cardsError.message}`);
  }

  await createAuditLog({
    actorId: createdBy,
    entityType: 'batch',
    entityId: batch.id,
    action: 'batch_created',
    metadata: { name, quantity, batch_prefix: batchPrefix },
  });

  return batch;
}

export async function listBatches(page = 1, limit = 20) {
  const admin = createAdminClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await admin
    .from('card_batches')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { batches: data || [], total: count || 0 };
}

export async function getBatchById(id: string) {
  const admin = createAdminClient();

  const { data: batch, error } = await admin
    .from('card_batches')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !batch) return null;

  const { data: cards } = await admin
    .from('cards')
    .select('*, businesses(name, google_maps_url)')
    .eq('batch_id', id)
    .order('inventory_code', { ascending: true });

  return { ...batch, cards: cards || [] };
}
