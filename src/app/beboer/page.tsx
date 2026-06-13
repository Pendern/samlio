import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Home,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  ny: "Ny",
  under_behandling: "Under behandling",
  vedtatt: "Vedtatt",
  avvist: "Avvist",
  utsatt: "Utsatt",
};

const severityLabels: Record<string, { label: string; color: string }> = {
  lav: { label: "Lav", color: "bg-emerald-500/20 text-emerald-400" },
  middels: { label: "Middels", color: "bg-amber-500/20 text-amber-400" },
  hoy: { label: "Høy", color: "bg-red-500/20 text-red-400" },
  kritisk: { label: "Kritisk", color: "bg-red-600/30 text-red-300" },
};

export default async function BeboerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, tenants(*)")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const tenantId = profile.tenant_id;
  const tenant = (profile as any).tenants;
  const firstName = profile.full_name?.split(" ")[0] || "Beboer";

  // Hent beboerens boenhet
  const { data: unitOwnership } = await supabase
    .from("unit_owners")
    .select("*, units(*)")
    .eq("profile_id", profile.id)
    .single();

  const unit = (unitOwnership as any)?.units;

  // Hent aktive saker (synlige for beboere)
  const { data: cases } = await supabase
    .from("board_cases")
    .select("id, title, category, status, created_at")
    .eq("tenant_id", tenantId)
    .neq("status", "arkivert")
    .order("created_at", { ascending: false })
    .limit(5);

  // Hent åpne HMS-avvik
  const { data: deviations } = await supabase
    .from("hms_deviations")
    .select("id, title, severity, status, due_date, hms_areas(name)")
    .eq("tenant_id", tenantId)
    .neq("status", "resolved")
    .order("created_at", { ascending: false });

  // Hent neste møte
  const { data: meetings } = await supabase
    .from("board_meetings")
    .select("id, title, date, time, location")
    .eq("tenant_id", tenantId)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date")
    .limit(1);

  // Hent styremedlemmer
  const { data: boardMembers } = await supabase
    .from("profiles")
    .select("full_name, role, phone, email")
    .eq("tenant_id", tenantId)
    .in("role", ["styreleder", "styremedlem", "varamedlem"]);

  const nextMeeting = meetings?.[0];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          Hei, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {tenant?.name || "Ditt sameie"} · Beboeroversikt
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Unit Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Home className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-semibold text-zinc-200">Min bolig</h3>
            </div>
            {unit ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Enhet</span>
                  <span className="text-zinc-200">{unit.unit_number}</span>
                </div>
                {unit.unit_type && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Type</span>
                    <span className="text-zinc-200">{unit.unit_type}</span>
                  </div>
                )}
                {unit.size_sqm && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Størrelse</span>
                    <span className="text-zinc-200">{unit.size_sqm} m²</span>
                  </div>
                )}
                {unit.floor && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Etasje</span>
                    <span className="text-zinc-200">{unit.floor}. etg</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Ingen boenhet registrert</p>
            )}
          </CardContent>
        </Card>

        {/* Next Meeting */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="font-semibold text-zinc-200">Neste møte</h3>
            </div>
            {nextMeeting ? (
              <div className="space-y-1.5 text-sm">
                <p className="text-zinc-200 font-medium">{nextMeeting.title}</p>
                <p className="text-zinc-400">
                  {new Date(nextMeeting.date).toLocaleDateString("no-NO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  {nextMeeting.time && ` kl. ${nextMeeting.time.substring(0, 5)}`}
                </p>
                {nextMeeting.location && (
                  <p className="text-zinc-500">{nextMeeting.location}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Ingen planlagte møter</p>
            )}
          </CardContent>
        </Card>

        {/* Building Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-violet-400" />
              </div>
              <h3 className="font-semibold text-zinc-200">Bygget</h3>
            </div>
            <div className="space-y-1.5 text-sm">
              {tenant?.address && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Adresse</span>
                  <span className="text-zinc-200">{tenant.address}</span>
                </div>
              )}
              {tenant?.year_built && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Byggeår</span>
                  <span className="text-zinc-200">{tenant.year_built}</span>
                </div>
              )}
              {tenant?.num_units && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Enheter</span>
                  <span className="text-zinc-200">{tenant.num_units}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Cases */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <FileText className="w-4 h-4 inline-block mr-1.5" />
          Aktive styresaker
        </h2>
        <div className="space-y-2">
          {cases && cases.length > 0 ? (
            cases.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{c.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.category && (
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{c.category}</span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString("no-NO", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className={
                  c.status === "under_behandling" ? "bg-amber-500/20 text-amber-400" :
                  c.status === "vedtatt" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-blue-500/20 text-blue-400"
                }>
                  {statusLabels[c.status] || c.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen aktive saker akkurat nå</p>
            </div>
          )}
        </div>
      </section>

      {/* HMS Deviations */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <ShieldCheck className="w-4 h-4 inline-block mr-1.5" />
          HMS-status
        </h2>
        {deviations && deviations.length > 0 ? (
          <div className="space-y-2">
            {deviations.map((dev) => {
              const sev = severityLabels[dev.severity] || severityLabels.lav;
              const daysLeft = dev.due_date
                ? Math.ceil((new Date(dev.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={dev.id}
                  className={`border rounded-xl p-4 flex items-center gap-4 ${
                    dev.severity === "hoy" || dev.severity === "kritisk"
                      ? "bg-red-950/20 border-red-900/30"
                      : "bg-amber-950/20 border-amber-900/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    dev.severity === "hoy" || dev.severity === "kritisk" ? "bg-red-500/20" : "bg-amber-500/20"
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      dev.severity === "hoy" || dev.severity === "kritisk" ? "text-red-400" : "text-amber-400"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{dev.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(dev as any).hms_areas?.name}
                      {daysLeft !== null && (
                        <span className={daysLeft < 0 ? " text-red-400" : ""}>
                          {" · "}{daysLeft < 0 ? `${Math.abs(daysLeft)}d over frist` : `Frist om ${daysLeft}d`}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary" className={sev.color}>
                    {sev.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Ingen åpne HMS-avvik — alt i orden</p>
          </div>
        )}
      </section>

      {/* Board Members */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Users className="w-4 h-4 inline-block mr-1.5" />
          Styret
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {boardMembers?.map((member, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-400 flex-shrink-0">
                {member.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200">{member.full_name}</p>
                <p className="text-xs text-zinc-500">
                  {member.role === "styreleder" ? "Styreleder" :
                   member.role === "styremedlem" ? "Styremedlem" : "Varamedlem"}
                  {member.phone && ` · ${member.phone}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
