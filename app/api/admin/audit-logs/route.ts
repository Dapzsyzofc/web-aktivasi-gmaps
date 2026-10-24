import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const entityType = searchParams.get('entity_type') || undefined;
  const offset = (page - 1) * limit;

  try {
    const admin = createAdminClient();
    let query = admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) query = query.eq('entity_type', entityType);

    const { data, error: dbError, count } = await query;
    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({ logs: data || [], total: count || 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
