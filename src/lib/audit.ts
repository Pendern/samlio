/**
 * Insert an audit log entry. Fire-and-forget — never throws.
 */
export async function logAudit(
  supabase: any,
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Record<string, unknown> | null,
) {
  try {
    await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata: metadata || null,
    });
  } catch {
    // Silent — audit logging should never break the main flow
  }
}
