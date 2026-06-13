"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreferences } from "@/app/innstillinger/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Save } from "lucide-react";

interface Preferences {
  post_enabled: boolean;
  comment_enabled: boolean;
  reaction_enabled: boolean;
  event_reminder_enabled: boolean;
  rsvp_enabled: boolean;
  group_invite_enabled: boolean;
  hms_deviation_enabled: boolean;
  task_assigned_enabled: boolean;
  meeting_reminder_enabled: boolean;
}

const prefConfig = [
  { key: "post_enabled", label: "Nye innlegg og oppslag", description: "Når noen publiserer et innlegg eller styret legger ut et oppslag", category: "Fellesskap" },
  { key: "comment_enabled", label: "Kommentarer", description: "Når noen kommenterer på dine innlegg", category: "Fellesskap" },
  { key: "reaction_enabled", label: "Reaksjoner", description: "Når noen liker dine innlegg", category: "Fellesskap" },
  { key: "event_reminder_enabled", label: "Arrangementspåminnelser", description: "Påminnelse før arrangementer du har meldt deg på", category: "Arrangementer" },
  { key: "rsvp_enabled", label: "Påmeldinger", description: "Når noen melder seg på dine arrangementer", category: "Arrangementer" },
  { key: "group_invite_enabled", label: "Gruppeinvitasjoner", description: "Når du blir invitert til en gruppe", category: "Grupper" },
  { key: "hms_deviation_enabled", label: "HMS-avvik", description: "Når nye HMS-avvik registreres eller tildeles deg", category: "Styrearbeid" },
  { key: "task_assigned_enabled", label: "Oppgaver", description: "Når du blir tildelt en oppgave", category: "Styrearbeid" },
  { key: "meeting_reminder_enabled", label: "Møtepåminnelser", description: "Påminnelse før styremøter", category: "Styrearbeid" },
] as const;

export function PreferencesForm({ preferences }: { preferences: Preferences }) {
  const [prefs, setPrefs] = useState(preferences);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleToggle(key: string) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key as keyof Preferences] }));
    setSaved(false);
  }

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateNotificationPreferences(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  // Grupper innstillinger etter kategori
  const categories = [...new Set(prefConfig.map(p => p.category))];

  return (
    <form action={handleSubmit} className="space-y-8">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">{category}</h3>
          <div className="space-y-1">
            {prefConfig.filter(p => p.category === category).map(pref => (
              <label
                key={pref.key}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <div>
                  <p className="text-sm text-zinc-200">{pref.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{pref.description}</p>
                </div>
                <input type="hidden" name={pref.key} value="off" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[pref.key as keyof Preferences]}
                  onClick={() => handleToggle(pref.key)}
                  className={`relative w-10 h-5.5 rounded-full transition flex-shrink-0 ml-4 ${
                    prefs[pref.key as keyof Preferences] ? "bg-violet-600" : "bg-zinc-700"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    prefs[pref.key as keyof Preferences] ? "translate-x-[18px]" : "translate-x-0"
                  }`} />
                  {prefs[pref.key as keyof Preferences] && (
                    <input type="hidden" name={pref.key} value="on" />
                  )}
                </button>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Lagrer..." : "Lagre innstillinger"}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Lagret
          </span>
        )}
      </div>
    </form>
  );
}
