import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  Calendar,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButtons } from "@/components/oversikt/ExportButtons";

const statusConfig: Record<string, { label: string; color: string }> = {
  ny: { label: "Ny", color: "bg-blue-500/20 text-blue-400" },
  under_behandling: { label: "Under behandling", color: "bg-amber-500/20 text-amber-400" },
  vedtatt: { label: "Vedtatt", color: "bg-emerald-500/20 text-emerald-400" },
  avvist: { label: "Avvist", color: "bg-red-500/20 text-red-400" },
  utsatt: { label: "Utsatt", color: "bg-zinc-500/20 text-zinc-400" },
  arkivert: { label: "Arkivert", color: "bg-zinc-500/20 text-zinc-500" },
};

const severityConfig: Record<string, { label: string; color: string }> = {
  lav: { label: "Lav", color: "bg-emerald-500/20 text-emerald-400" },
  middels: { label: "Middels", color: "bg-amber-500/20 text-amber-400" },
  hoy: { label: "Høy", color: "bg-red-500/20 text-red-400" },
  kritisk: { label: "Kritisk", color: "bg-red-600/30 text-red-300" },
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  ny: { label: "Ny", color: "bg-blue-500/20 text-blue-400" },
  pagar: { label: "Pågår", color: "bg-amber-500/20 text-amber-400" },
  ferdig: { label: "Ferdig", color: "bg-emerald-500/20 text-emerald-400" },
};

const conditionConfig: Record<string, { label: string; color: string }> = {
  god: { label: "God", color: "text-emerald-400" },
  akseptabel: { label: "Akseptabel", color: "text-amber-400" },
  darlig: { label: "Dårlig", color: "text-red-400" },
  kritisk: { label: "Kritisk", color: "text-red-300" },
};

export default async function OversiktPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, full_name, tenants(name)")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");
  const tenantId = profile.tenant_id;

  const [casesRes, deviationsRes, tasksRes, meetingsRes, maintenanceRes] = await Promise.all([
    supabase.from("board_cases").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("hms_deviations").select("*, hms_areas(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*, profiles!tasks_assigned_to_fkey(full_name)").eq("tenant_id", tenantId).order("due_date"),
    supabase.from("board_meetings").select("*").eq("tenant_id", tenantId).order("date", { ascending: false }).limit(5),
    supabase.from("maintenance_items").select("*").eq("tenant_id", tenantId).order("next_maintenance_at"),
  ]);

  const cases = casesRes.data || [];
  const deviations = deviationsRes.data || [];
  const tasks = tasksRes.data || [];
  const meetings = meetingsRes.data || [];
  const maintenance = maintenanceRes.data || [];

  const activeCases = cases.filter(c => c.status !== "arkivert");
  const openDeviations = deviations.filter(d => d.status !== "resolved");
  const pendingTasks = tasks.filter(t => t.status !== "ferdig");
  const criticalMaintenance = maintenance.filter(m => m.condition === "darlig" || m.condition === "kritisk");

  const tenantName = (profile as any)?.tenants?.name || "Boligselskapet";

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("no-NO", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const exportCases = activeCases.map(c => ({
    title: c.title,
    category: c.category || "—",
    status: (statusConfig[c.status] || statusConfig.ny).label,
    created: fmt(c.created_at),
  }));

  const exportDeviations = openDeviations.map(d => ({
    title: d.title,
    area: (d as any).hms_areas?.name || "—",
    severity: (severityConfig[d.severity] || severityConfig.lav).label,
    status: d.status === "open" ? "Åpen" : "Under arbeid",
    due: fmt(d.due_date),
  }));

  const exportTasks = pendingTasks.map(t => ({
    title: t.title,
    assignee: (t as any).profiles?.full_name || "—",
    status: (taskStatusConfig[t.status] || taskStatusConfig.ny).label,
    due: fmt(t.due_date),
  }));

  const exportMaintenance = maintenance.map(m => ({
    part: m.building_part,
    description: m.description,
    condition: (conditionConfig[m.condition] || conditionConfig.god).label,
    nextDate: fmt(m.next_maintenance_at),
    cost: m.estimated_cost ? `${Number(m.estimated_cost).toLocaleString("no-NO")} kr` : "—",
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Styreoversikt</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Komplett oversikt over saker, HMS, oppgaver og vedlikehold
          </p>
        </div>
        <ExportButtons
          tenantName={tenantName}
          cases={exportCases}
          deviations={exportDeviations}
          tasks={exportTasks}
          maintenance={exportMaintenance}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{activeCases.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Aktive saker</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${openDeviations.length > 0 ? "bg-amber-950/20" : "bg-zinc-900"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${openDeviations.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>{openDeviations.length}</p>
            <p className="text-xs text-zinc-500 mt-1">HMS-avvik</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{pendingTasks.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Åpne oppgaver</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${criticalMaintenance.length > 0 ? "bg-red-950/20" : "bg-zinc-900"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${criticalMaintenance.length > 0 ? "text-red-400" : "text-emerald-400"}`}>{criticalMaintenance.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Vedlikehold kritisk</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-teal-400">{meetings.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Møter totalt</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="saker" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="saker">Saker ({activeCases.length})</TabsTrigger>
          <TabsTrigger value="hms">HMS ({openDeviations.length})</TabsTrigger>
          <TabsTrigger value="oppgaver">Oppgaver ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="vedlikehold">Vedlikehold ({maintenance.length})</TabsTrigger>
          <TabsTrigger value="moter">Møter</TabsTrigger>
        </TabsList>

        {/* Saker Tab */}
        <TabsContent value="saker" className="space-y-2">
          {activeCases.length === 0 ? (
            <EmptyState icon={FileText} text="Ingen aktive saker" />
          ) : (
            activeCases.map((c) => {
              const status = statusConfig[c.status] || statusConfig.ny;
              return (
                <a key={c.id} href={`/saker/${c.id}`} className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium text-zinc-200 truncate">{c.title}</h3>
                        <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {c.category && <span className="bg-zinc-800 px-2 py-0.5 rounded">{c.category}</span>}
                        <span>{new Date(c.created_at).toLocaleDateString("no-NO", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </TabsContent>

        {/* HMS Tab */}
        <TabsContent value="hms" className="space-y-2">
          {openDeviations.length === 0 ? (
            <EmptyState icon={ShieldCheck} text="Ingen åpne HMS-avvik — alt i orden" positive />
          ) : (
            openDeviations.map((dev) => {
              const sev = severityConfig[dev.severity] || severityConfig.lav;
              const daysLeft = dev.due_date
                ? Math.ceil((new Date(dev.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={dev.id} className={`border rounded-xl p-4 flex items-center gap-4 ${
                  dev.severity === "hoy" || dev.severity === "kritisk" ? "bg-red-950/20 border-red-900/30" : "bg-amber-950/20 border-amber-900/30"
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${dev.severity === "hoy" || dev.severity === "kritisk" ? "text-red-400" : "text-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{dev.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(dev as any).hms_areas?.name} · {dev.status === "open" ? "Åpen" : "Under arbeid"}
                      {daysLeft !== null && (
                        <span className={daysLeft < 0 ? " text-red-400" : ""}>
                          {" · "}{daysLeft < 0 ? `${Math.abs(daysLeft)}d over frist` : `${daysLeft}d igjen`}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary" className={sev.color}>{sev.label}</Badge>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Oppgaver Tab */}
        <TabsContent value="oppgaver" className="space-y-2">
          {pendingTasks.length === 0 ? (
            <EmptyState icon={ClipboardList} text="Ingen åpne oppgaver" positive />
          ) : (
            pendingTasks.map((task) => {
              const ts = taskStatusConfig[task.status] || taskStatusConfig.ny;
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${isOverdue ? "border-red-900/50" : "border-zinc-800"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-red-500/20" : "bg-zinc-800"}`}>
                    {isOverdue ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <ClipboardList className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{task.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(task as any).profiles?.full_name && `Ansvarlig: ${(task as any).profiles.full_name}`}
                      {task.due_date && ` · Frist: ${new Date(task.due_date).toLocaleDateString("no-NO", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={ts.color}>{ts.label}</Badge>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Vedlikehold Tab */}
        <TabsContent value="vedlikehold" className="space-y-2">
          {maintenance.length === 0 ? (
            <EmptyState icon={Wrench} text="Ingen vedlikeholdstiltak registrert" />
          ) : (
            maintenance.map((item) => {
              const cond = conditionConfig[item.condition] || conditionConfig.god;
              return (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{item.building_part}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.description}
                      {item.next_maintenance_at && ` · Neste: ${new Date(item.next_maintenance_at).toLocaleDateString("no-NO", { month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${cond.color}`}>{cond.label}</p>
                    {item.estimated_cost && (
                      <p className="text-xs text-zinc-500">{Number(item.estimated_cost).toLocaleString("no-NO")} kr</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Møter Tab */}
        <TabsContent value="moter" className="space-y-2">
          {meetings.length === 0 ? (
            <EmptyState icon={Calendar} text="Ingen møter registrert" />
          ) : (
            meetings.map((m) => {
              const isPast = new Date(m.date) < new Date();
              return (
                <div key={m.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 ${isPast ? "opacity-60" : ""}`}>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{m.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(m.date).toLocaleDateString("no-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {m.time && ` kl. ${m.time.substring(0, 5)}`}
                      {m.location && ` · ${m.location}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={isPast ? "bg-zinc-500/20 text-zinc-500" : "bg-teal-500/20 text-teal-400"}>
                    {isPast ? "Gjennomført" : "Kommende"}
                  </Badge>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, text, positive }: { icon: typeof FileText; text: string; positive?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
      {positive ? (
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
      ) : (
        <Icon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
      )}
      <p className="text-sm text-zinc-400">{text}</p>
    </div>
  );
}
