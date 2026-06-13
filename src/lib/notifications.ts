import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationParams {
  supabase: SupabaseClient;
  tenantId: string;
  recipientIds: string[];
  actorId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
  entityId?: string;
  excludeActorId?: boolean;
}

/**
 * Create notifications for multiple recipients.
 * By default excludes the actor from receiving their own notification.
 */
export async function createNotifications({
  supabase,
  tenantId,
  recipientIds,
  actorId,
  type,
  title,
  body,
  href,
  entityId,
  excludeActorId = true,
}: CreateNotificationParams) {
  const recipients = excludeActorId
    ? recipientIds.filter((id) => id !== actorId)
    : recipientIds;

  if (recipients.length === 0) return;

  // Sjekk preferanser — filtrer ut de som har slått av denne typen
  const prefColumn = `${type}_enabled`;
  const { data: disabledPrefs } = await supabase
    .from("notification_preferences")
    .select("profile_id")
    .in("profile_id", recipients)
    .eq(prefColumn, false);

  const disabledIds = new Set((disabledPrefs || []).map(p => p.profile_id));
  const filteredRecipients = recipients.filter(id => !disabledIds.has(id));

  if (filteredRecipients.length === 0) return;

  const notifications = filteredRecipients.map((recipientId) => ({
    tenant_id: tenantId,
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    title,
    body: body || null,
    href: href || null,
    entity_id: entityId || null,
  }));

  await supabase.from("notifications").insert(notifications);
}
