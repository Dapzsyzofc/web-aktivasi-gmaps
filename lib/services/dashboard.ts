import { createAdminClient } from '@/lib/supabase/admin';

export async function getDashboardStats() {
  const admin = createAdminClient();

  const [cardsResult, businessResult, batchesResult, auditResult] = await Promise.all([
    admin.from('cards').select('status'),
    admin.from('businesses').select('id', { count: 'exact', head: true }),
    admin.from('card_batches').select('*').order('created_at', { ascending: false }).limit(5),
    admin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  const cards = cardsResult.data || [];
  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.status === 'active').length;
  const inactiveCards = cards.filter(c => c.status === 'inactive').length;
  const disabledCards = cards.filter(c => c.status === 'disabled').length;

  return {
    totalCards,
    activeCards,
    inactiveCards,
    disabledCards,
    totalBusinesses: businessResult.count || 0,
    recentBatches: batchesResult.data || [],
    recentActivity: auditResult.data || [],
  };
}
