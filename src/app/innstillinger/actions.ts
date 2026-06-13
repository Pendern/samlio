"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const PREF_FIELDS = [
  "post_enabled", "comment_enabled", "reaction_enabled",
  "event_reminder_enabled", "rsvp_enabled", "group_invite_enabled",
  "hms_deviation_enabled", "task_assigned_enabled", "meeting_reminder_enabled",
] as const;

export async function updateNotificationPreferences(formData: FormData) {
  const { supabase, profileId } = await getAuthContext();

  const prefs: Record<string, boolean> = {};
  for (const field of PREF_FIELDS) {
    prefs[field] = formData.get(field) === "on";
  }

  // Upsert — oppretter rad hvis den ikke finnes
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("profile_id", profileId)
    .single();

  if (existing) {
    await supabase
      .from("notification_preferences")
      .update(prefs)
      .eq("profile_id", profileId);
  } else {
    await supabase
      .from("notification_preferences")
      .insert({ profile_id: profileId, ...prefs });
  }

  revalidatePath("/innstillinger");
  return { success: true };
}
