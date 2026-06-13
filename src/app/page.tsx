import {
  AlertTriangle,
  Clock,
  FileText,
  Users,
  Calendar,
  Banknote,
  ShieldCheck,
  Wrench,
  Sparkles,
  Check,
  X,
  PencilLine,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth";
import { getGreeting, daysUntil, roleLabels } from "@/lib/config";

export default async function Dashboard() {
  const { supabase, tenantId, fullName, role, tenantName } = await getAuthContext();
  const firstName = fullName?.split(" ")[0] || "Bruker";

  // Hent live stats
  const [casesRes, deviationsRes, suggestionsRes, meetingRes, controlsRes, maintenanceRes, docsRes] = await Promise.all([
    supabase.from("board_cases").select("id, status").eq("tenant_id", tenantId!),
    supabase.from("hms_deviations").select("id, status, severity, title, description, due_date").eq("tenant_id", tenantId!).neq("status", "resolved"),
    supabase.from("ai_suggestions").select("*").eq("tenant_id", tenantId!).eq("status", "pending"),
    supabase.from("board_meetings").select("id, title, date").eq("tenant_id", tenantId!).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(1),
    supabase.from("hms_controls").select("id").eq("tenant_id", tenantId!),
    supabase.from("maintenance_items").select("id, next_maintenance_at").eq("tenant_id", tenantId!),
    supabase.from("documents").select("id").eq("tenant_id", tenantId!),
  ]);

  const activeCases = casesRes.data?.filter(c => c.status !== "arkivert") || [];
  const urgentCases = activeCases.filter(c => c.status === "under_behandling");
  const openDeviations = deviationsRes.data || [];
  const aiSuggestions = suggestionsRes.data || [];
  const nextMeeting = meetingRes.data?.[0];
  const totalControls = controlsRes.data?.length || 0;
  const totalDocs = docsRes.data?.length || 0;
  const maintenanceThisYear = maintenanceRes.data?.filter(m => {
    if (!m.next_maintenance_at) return false;
    return new Date(m.next_maintenance_at).getFullYear() === new Date().getFullYear();
  }) || [];

  // Beregn dager til møte
  const daysToMeeting = nextMeeting
    ? Math.ceil((new Date(nextMeeting.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Bygg urgency-items fra live data
  const urgentItems: { id: string; title: string; description: string; severity: "critical" | "warning"; daysLeft: number; href: string }[] = [];

  // HMS-avvik som haster
  openDeviations.forEach(dev => {
    const daysLeft = dev.due_date
      ? Math.ceil((new Date(dev.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;
    urgentItems.push({
      id: dev.id,
      title: dev.title,
      description: dev.description.substring(0, 80) + (dev.description.length > 80 ? "..." : ""),
      severity: dev.severity === "kritisk" || dev.severity === "hoy" ? "critical" : "warning",
      daysLeft,
      href: "/hms",
    });
  });

  const stats = [
    { label: "Aktive saker", value: String(activeCases.length), color: "text-blue-400" },
    { label: daysToMeeting !== null ? "Dager til styrem\u00f8te" : "Ingen planlagt m\u00f8te", value: daysToMeeting !== null ? String(daysToMeeting) : "\u2014", color: "text-teal-400" },
    { label: "HMS-avvik \u00e5pne", value: String(openDeviations.length), color: "text-amber-400" },
    { label: "Felleskostnader betalt", value: "94%", color: "text-emerald-400" },
  ];

  const modules = [
    { label: "Saker", icon: FileText, info: `${activeCases.length} aktive`, status: urgentCases.length > 0 ? `${urgentCases.length} under behandling` : "Alt i orden", statusColor: urgentCases.length > 0 ? "text-amber-400" : "text-emerald-400", href: "/saker", iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
    { label: "Styrem\u00f8te", icon: Users, info: nextMeeting ? new Date(nextMeeting.date).toLocaleDateString("no-NO", { day: "numeric", month: "short" }) : "Ingen planlagt", status: nextMeeting ? nextMeeting.title : "", statusColor: "text-emerald-400", href: "/moter", iconBg: "bg-teal-500/20", iconColor: "text-teal-400" },
    { label: "HMS", icon: ShieldCheck, info: `${totalControls} kontroller`, status: openDeviations.length > 0 ? `${openDeviations.length} avvik` : "Ingen avvik", statusColor: openDeviations.length > 0 ? "text-amber-400" : "text-emerald-400", href: "/hms", iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
    { label: "Vedlikehold", icon: Wrench, info: "10-\u00e5rsplan", status: `${maintenanceThisYear.length} tiltak i \u00e5r`, statusColor: "text-zinc-400", href: "/vedlikehold", iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
    { label: "\u00d8konomi", icon: Banknote, info: "Budsjett 2026", status: "Godkjent", statusColor: "text-emerald-400", href: "/okonomi", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
    { label: "Dokumenter", icon: Calendar, info: `${totalDocs} filer`, status: "", statusColor: "text-zinc-500", href: "/dokumenter", iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
  ];
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {tenantName} · {roleLabels[role] || role}
        </p>
      </div>

      {/* Urgent Section */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          Krever handling
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {urgentItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`rounded-xl p-4 transition group ${
                item.severity === "critical"
                  ? "bg-red-950/50 border border-red-900/50 hover:bg-red-950/70"
                  : "bg-amber-950/50 border border-amber-900/50 hover:bg-amber-950/70"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.severity === "critical" ? "bg-red-500/20" : "bg-amber-500/20"
                  }`}
                >
                  {item.severity === "critical" ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    item.severity === "critical"
                      ? "text-red-400 bg-red-500/20"
                      : "text-amber-400 bg-amber-500/20"
                  }`}
                >
                  {item.daysLeft > 0 ? `${item.daysLeft} dager` : `${Math.abs(item.daysLeft)}d over frist`}
                </span>
              </div>
              <h3 className="font-medium text-white group-hover:text-zinc-200 transition">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-zinc-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* AI Suggestions */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Sparkles className="w-4 h-4 inline-block mr-1.5 text-violet-400" />
          AI-forslag
        </h2>
        <div className="space-y-3">
          {aiSuggestions.map((s) => (
            <div
              key={s.id}
              className="bg-violet-950/30 border border-violet-900/30 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 leading-relaxed">{s.text}</p>
                  <p className="text-xs text-zinc-500 mt-2">Basert på: {s.source}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs">
                      <Check className="w-3 h-3 mr-1" /> Aksepter
                    </Button>
                    <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-200 h-8 text-xs">
                      <PencilLine className="w-3 h-3 mr-1" /> Rediger
                    </Button>
                    <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-zinc-300 h-8 text-xs">
                      <X className="w-3 h-3 mr-1" /> Avvis
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Module Grid */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          Moduler
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <a
              key={mod.label}
              href={mod.href}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-800/50 transition group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${mod.iconBg} flex items-center justify-center`}>
                  <mod.icon className={`w-5 h-5 ${mod.iconColor}`} />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition" />
              </div>
              <h3 className="font-semibold text-white mb-1">{mod.label}</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-400">{mod.info}</span>
                <span className={mod.statusColor}>{mod.status}</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
