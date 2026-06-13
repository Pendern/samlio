import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Clock, Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NyttMoteDialog } from "@/components/moter/NyttMoteDialog";

const typeLabels: Record<string, string> = {
  styremote: "Styremøte",
  arsmote: "Årsmøte",
  ekstraordinart: "Ekstraordinært",
};

export default async function MoterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("tenant_id").eq("user_id", user.id).single();

  const { data: meetings } = await supabase
    .from("board_meetings")
    .select("*, meeting_attendance(profile_id, status)")
    .eq("tenant_id", profile!.tenant_id)
    .order("date", { ascending: false });

  const now = new Date().toISOString().split("T")[0];
  const upcoming = meetings?.filter(m => m.date >= now) || [];
  const past = meetings?.filter(m => m.date < now) || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Møter</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {upcoming.length} kommende · {past.length} gjennomført
          </p>
        </div>
        <NyttMoteDialog />
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Kommende</h2>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen planlagte møter</p>
            </div>
          ) : (
            upcoming.map((m) => <MeetingCard key={m.id} meeting={m} />)
          )}
        </div>
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Gjennomført</h2>
          <div className="space-y-3">
            {past.map((m) => <MeetingCard key={m.id} meeting={m} isPast />)}
          </div>
        </section>
      )}
    </div>
  );
}

function MeetingCard({ meeting: m, isPast }: { meeting: any; isPast?: boolean }) {
  const confirmed = m.meeting_attendance?.filter((a: any) => a.status === "confirmed").length || 0;
  const total = m.meeting_attendance?.length || 0;
  const hasProtocol = !!m.ai_protocol_draft || !!m.signed_protocol_url;

  return (
    <a
      href={`/moter/${m.id}`}
      className={`block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition group ${isPast ? "opacity-70 hover:opacity-100" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-zinc-100 group-hover:text-white truncate">{m.title}</h3>
            <Badge variant="secondary" className={isPast ? "bg-zinc-500/20 text-zinc-400" : "bg-teal-500/20 text-teal-400"}>
              {typeLabels[m.meeting_type] || m.meeting_type}
            </Badge>
            {hasProtocol && (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">Protokoll</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(m.date).toLocaleDateString("no-NO", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            {m.time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {m.time.substring(0, 5)}
              </span>
            )}
            {m.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {m.location}
              </span>
            )}
            {total > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {confirmed}/{total} bekreftet
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition flex-shrink-0" />
      </div>
    </a>
  );
}
