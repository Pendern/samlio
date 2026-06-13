import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Clock, Users, FileText, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ProtocolEditor } from "@/components/moter/ProtocolEditor";

const typeLabels: Record<string, string> = {
  styremote: "Styremøte",
  arsmote: "Årsmøte",
  ekstraordinart: "Ekstraordinært",
};

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("tenant_id").eq("user_id", user.id).single();

  const { data: meeting } = await supabase
    .from("board_meetings")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", profile!.tenant_id)
    .single();

  if (!meeting) redirect("/moter");

  // Hent oppmøte med profilnavn
  const { data: attendance } = await supabase
    .from("meeting_attendance")
    .select("*, profiles(full_name, role)")
    .eq("meeting_id", id);

  // Hent saker knyttet til møtet
  const { data: cases } = await supabase
    .from("board_cases")
    .select("id, title, status")
    .eq("meeting_id", id);

  const isPast = new Date(meeting.date) < new Date();
  const attendees = attendance || [];
  const confirmed = attendees.filter(a => a.status === "confirmed").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Link href="/moter" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition">
        <ArrowLeft className="w-4 h-4" />
        Tilbake til møter
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-zinc-100">{meeting.title}</h1>
          <Badge variant="secondary" className={isPast ? "bg-zinc-500/20 text-zinc-400" : "bg-teal-500/20 text-teal-400"}>
            {typeLabels[meeting.meeting_type] || meeting.meeting_type}
          </Badge>
        </div>
        <div className="flex items-center gap-5 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(meeting.date).toLocaleDateString("no-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          {meeting.time && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {meeting.time.substring(0, 5)}
            </span>
          )}
          {meeting.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {meeting.location}
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Protocol */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-zinc-500" />
                <h2 className="font-semibold text-zinc-200">Protokoll</h2>
              </div>
              <ProtocolEditor
                meetingId={meeting.id}
                initialProtocol={meeting.ai_protocol_draft || ""}
                meetingTitle={meeting.title}
                meetingDate={meeting.date}
                attendees={attendees.filter(a => a.status === "confirmed").map(a => (a as any).profiles?.full_name || "Ukjent")}
              />
            </CardContent>
          </Card>

          {/* Linked Cases */}
          {cases && cases.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h2 className="font-semibold text-zinc-200 mb-4">Tilknyttede saker</h2>
                <div className="space-y-2">
                  {cases.map(c => (
                    <a key={c.id} href={`/saker/${c.id}`} className="block bg-zinc-800/50 rounded-lg p-3 hover:bg-zinc-800 transition text-sm">
                      <span className="text-zinc-200">{c.title}</span>
                      <span className="text-zinc-500 ml-2">· {c.status}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendees */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  Deltakere
                </h2>
                <span className="text-xs text-zinc-500">{confirmed}/{attendees.length}</span>
              </div>
              <div className="space-y-2">
                {attendees.map((a, i) => {
                  const name = (a as any).profiles?.full_name || "Ukjent";
                  const role = (a as any).profiles?.role;
                  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{name}</p>
                        <p className="text-xs text-zinc-500">{role === "styreleder" ? "Styreleder" : role === "styremedlem" ? "Styremedlem" : "Varamedlem"}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        a.status === "confirmed" ? "bg-emerald-500" :
                        a.status === "declined" ? "bg-red-500" : "bg-zinc-600"
                      }`} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
