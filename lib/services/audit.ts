import { createAdminClient } from '@/lib/supabase/admin';

type AuditAction =
  | 'batch_created'
  | 'card_activated'
  | 'card_disabled'
  | 'card_enabled'
  | 'card_linked'
  | 'business_created'
  | 'business_updated'
  | 'maps_url_changed';

interface AuditEntry {
  actorId: string;
  entityType: 'batch' | 'card' | 'business';
  entityId: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(entry: AuditEntry) {
  const admin = createAdminClient();

  const sanitizedMetadata = { ...entry.metadata };
  delete sanitizedMetadata['password'];
  delete sanitizedMetadata['token'];
  delete sanitizedMetadata['secret'];
  delete sanitizedMetadata['key'];

  const { error } = await admin.from('audit_logs').insert({
    actor_id: entry.actorId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    metadata: sanitizedMetadata || {},
  });

  if (error) {
    console.error('Failed to write audit log:', error.message);
  }
}
