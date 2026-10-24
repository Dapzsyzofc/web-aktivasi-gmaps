import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAuditLog } from './audit';

interface CreateBusinessParams {
  name: string;
  google_maps_url?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  internal_notes?: string | null;
  createdBy: string;
}

export async function createBusiness(params: CreateBusinessParams) {
  const admin = createAdminClient();
  const { createdBy, ...data } = params;

  const { data: business, error } = await admin
    .from('businesses')
    .insert({ ...data, created_by: createdBy })
    .select()
    .single();

  if (error || !business) throw new Error(`Gagal membuat UMKM: ${error?.message}`);

  await createAuditLog({
    actorId: createdBy,
    entityType: 'business',
    entityId: business.id,
    action: 'business_created',
    metadata: { name: data.name },
  });

  return business;
}

export async function updateBusiness(id: string, data: Partial<CreateBusinessParams>, actorId: string) {
  const admin = createAdminClient();

  const oldData = await admin.from('businesses').select('google_maps_url').eq('id', id).single();

  const { createdBy: _createdBy, ...updateData } = data; // eslint-disable-line no-unused-vars
  const { data: business, error } = await admin
    .from('businesses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !business) throw new Error(`Gagal memperbarui UMKM: ${error?.message}`);

  try {
    revalidatePath('/m/[token]', 'page');
  } catch {
    // Ignore revalidate errors outside request context
  }

  if (data.google_maps_url && data.google_maps_url !== oldData.data?.google_maps_url) {
    await createAuditLog({
      actorId,
      entityType: 'business',
      entityId: id,
      action: 'maps_url_changed',
      metadata: {
        old_url: oldData.data?.google_maps_url,
        new_url: data.google_maps_url,
      },
    });
  } else {
    await createAuditLog({
      actorId,
      entityType: 'business',
      entityId: id,
      action: 'business_updated',
      metadata: { name: business.name },
    });
  }

  return business;
}

export async function listBusinesses(page = 1, limit = 20, search?: string) {
  const admin = createAdminClient();
  const offset = (page - 1) * limit;

  let query = admin
    .from('businesses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { businesses: data || [], total: count || 0 };
}

export async function getBusinessById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}
