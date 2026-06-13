"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const { supabase, profileId } = await getAuthContext();
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("recipient_id", profileId);
  revalidatePath("/varsler");
}

export async function markAllNotificationsRead() {
  const { supabase, profileId } = await getAuthContext();
  await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", profileId).eq("is_read", false);
  revalidatePath("/varsler");
}
