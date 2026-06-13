import { getAuthContext } from "@/lib/auth";
import { Bell, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PreferencesForm } from "@/components/innstillinger/PreferencesForm";
import Link from "next/link";

const defaultPrefs = {
  post_enabled: true,
  comment_enabled: true,
  reaction_enabled: true,
  event_reminder_enabled: true,
  rsvp_enabled: true,
  group_invite_enabled: true,
  hms_deviation_enabled: true,
  task_assigned_enabled: true,
  meeting_reminder_enabled: true,
};

export default async function InnstillingerPage() {
  const { supabase, profileId, fullName, role, tenantName } = await getAuthContext();

  // Hent eksisterende preferanser (eller bruk defaults)
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  const preferences = prefs
    ? {
        post_enabled: prefs.post_enabled,
        comment_enabled: prefs.comment_enabled,
        reaction_enabled: prefs.reaction_enabled,
        event_reminder_enabled: prefs.event_reminder_enabled,
        rsvp_enabled: prefs.rsvp_enabled,
        group_invite_enabled: prefs.group_invite_enabled,
        hms_deviation_enabled: prefs.hms_deviation_enabled,
        task_assigned_enabled: prefs.task_assigned_enabled,
        meeting_reminder_enabled: prefs.meeting_reminder_enabled,
      }
    : defaultPrefs;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Innstillinger</h1>
          <p className="text-sm text-zinc-500 mt-1">Tilpass varsler og preferanser</p>
        </div>
        <Link
          href="/profil"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition"
        >
          Rediger profil →
        </Link>
      </div>

      {/* Notification Preferences */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-zinc-500" />
            <div>
              <h2 className="font-semibold text-zinc-200">Varslingsinnstillinger</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Velg hvilke varsler du ønsker å motta</p>
            </div>
          </div>
          <PreferencesForm preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
