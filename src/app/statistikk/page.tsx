import { getAuthContext } from "@/lib/auth";
import { severityConfig, taskStatusConfig, conditionConfig, formatDate, daysUntil } from "@/lib/config";
import {
  ShieldCheck, ClipboardList, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Clock, Wrench, BarChart3, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatistikkExportButton } from "@/components/statistikk/StatistikkExport";

export default async function StatistikkPage() {
  const { supabase, tenantId, tenantName } = await getAuthContext();

  const [deviationsRes, tasksRes, controlsRes, maintenanceRes, casesRes] = await Promise.all([
    supabase.from("hms_deviations").select("id, severity, status, created_at, resolved_at, due_date, hms_areas(name)").eq("tenant_id", tenantId),
    supabase.from("tasks").select("id, status, due_date, created_at, profiles!tasks_assigned_to_fkey(full_name)").eq("tenant_id", tenantId),
    supabase.from("hms_controls").select("id, next_due_date, last_completed_at, title").eq("tenant_id", tenantId),
    supabase.from("maintenance_items").select("id, condition, estimated_cost").eq("tenant_id", tenantId),
    supabase.from("board_cases").select("id, status, created_at").eq("tenant_id", tenantId),
  ]);

  const deviations = deviationsRes.data || [];
  const tasks = tasksRes.data || [];
  const controls = controlsRes.data || [];
  const maintenance = maintenanceRes.data || [];
  const cases = casesRes.data || [];

  // ── HMS-statistikk ─────────────────────────────────────────
  const openDeviations = deviations.filter(d => d.status !== "resolved");
  const resolvedDeviations = deviations.filter(d => d.status === "resolved");
  const overdueDeviations = openDeviations.filter(d => d.due_date && new Date(d.due_date) < new Date());
  const overdueControls = controls.filter(c => new Date(c.next_due_date) < new Date());

  // Per alvorlighetsgrad
  const bySeverity = ["kritisk", "hoy", "middels", "lav"].map(sev => ({
    severity: sev,
    config: severityConfig[sev],
    open: openDeviations.filter(d => d.severity === sev).length,
    total: deviations.filter(d => d.severity === sev).length,
  }));

  // Per område
  const areaMap: Record<string, { name: string; open: number; resolved: number }> = {};
  deviations.forEach(d => {
    const name = (d as any).hms_areas?.name || "Ukjent";
    if (!areaMap[name]) areaMap[name] = { name, open: 0, resolved: 0 };
    if (d.status === "resolved") areaMap[name].resolved++;
    else areaMap[name].open++;
  });
  const byArea = Object.values(areaMap).sort((a, b) => (b.open + b.resolved) - (a.open + a.resolved));

  // Løsningstid (gjennomsnitt dager fra opprettet til løst)
  const resolvedWithTime = resolvedDeviations.filter(d => d.resolved_at);
  const avgResolutionDays = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((sum, d) => sum + (new Date(d.resolved_at!).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24), 0) / resolvedWithTime.length)
    : null;

  // ── Oppgavestatistikk ──────────────────────────────────────
  const tasksByStatus = {
    ny: tasks.filter(t => t.status === "ny").length,
    pagar: tasks.filter(t => t.status === "pagar").length,
    ferdig: tasks.filter(t => t.status === "ferdig").length,
  };
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((tasksByStatus.ferdig / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(t => t.status !== "ferdig" && t.due_date && new Date(t.due_date) < new Date());

  // Per person
  const personMap: Record<string, { name: string; total: number; done: number; overdue: number }> = {};
  tasks.forEach(t => {
    const name = (t as any).profiles?.full_name || "Ikke tildelt";
    if (!personMap[name]) personMap[name] = { name, total: 0, done: 0, overdue: 0 };
    personMap[name].total++;
    if (t.status === "ferdig") personMap[name].done++;
    if (t.status !== "ferdig" && t.due_date && new Date(t.due_date) < new Date()) personMap[name].overdue++;
  });
  const byPerson = Object.values(personMap).sort((a, b) => b.total - a.total);

  // ── Vedlikehold ────────────────────────────────────────────
  const totalCost = maintenance.reduce((sum, m) => sum + (Number(m.estimated_cost) || 0), 0);
  const criticalCount = maintenance.filter(m => m.condition === "darlig" || m.condition === "kritisk").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Statistikk</h1>
          <p className="text-sm text-zinc-500 mt-1">HMS-avvik, oppgaver og vedlikehold i tall</p>
        </div>
        <StatistikkExportButton data={{
          tenantName,
          kpis: [
            { label: "Åpne avvik", value: String(openDeviations.length) },
            { label: "Løste avvik", value: String(resolvedDeviations.length) },
            { label: "Forfalt kontroll", value: String(overdueControls.length) },
            { label: "Oppgaver fullført", value: `${completionRate}%` },
            { label: "Oppgaver forfalt", value: String(overdueTasks.length) },
            { label: "Snitt løsningstid", value: avgResolutionDays !== null ? `${avgResolutionDays}d` : "—" },
          ],
          bySeverity: bySeverity.map(s => ({ label: s.config.label, open: s.open, total: s.total })),
          byArea,
          tasksByStatus,
          completionRate,
          byPerson,
          overdue: [
            ...overdueDeviations.map(d => ({ type: "HMS", label: (d as any).hms_areas?.name || "Ukjent", days: Math.abs(daysUntil(d.due_date) || 0) })),
            ...overdueTasks.map(t => ({ type: "Oppgave", label: "Oppgave forfalt", days: Math.abs(daysUntil(t.due_date) || 0) })),
            ...overdueControls.map(c => ({ type: "Kontroll", label: c.title, days: 0 })),
          ],
        }} />
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KpiCard value={openDeviations.length} label="Åpne avvik" color={openDeviations.length > 0 ? "text-amber-400" : "text-emerald-400"} bg={openDeviations.length > 0 ? "bg-amber-950/20" : undefined} />
        <KpiCard value={resolvedDeviations.length} label="Løste avvik" color="text-emerald-400" />
        <KpiCard value={overdueControls.length} label="Forfalt kontroll" color={overdueControls.length > 0 ? "text-red-400" : "text-emerald-400"} bg={overdueControls.length > 0 ? "bg-red-950/20" : undefined} />
        <KpiCard value={`${completionRate}%`} label="Oppgaver fullført" color={completionRate >= 80 ? "text-emerald-400" : "text-amber-400"} />
        <KpiCard value={overdueTasks.length} label="Oppgaver forfalt" color={overdueTasks.length > 0 ? "text-red-400" : "text-emerald-400"} bg={overdueTasks.length > 0 ? "bg-red-950/20" : undefined} />
        <KpiCard value={avgResolutionDays !== null ? `${avgResolutionDays}d` : "—"} label="Snitt løsningstid" color="text-zinc-300" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* HMS by Severity */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <h2 className="font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-zinc-500" />
              Avvik per alvorlighetsgrad
            </h2>
            <div className="space-y-3">
              {bySeverity.map(s => (
                <div key={s.severity} className="flex items-center gap-3">
                  <Badge variant="secondary" className={`${s.config.color} w-20 justify-center`}>{s.config.label}</Badge>
                  <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden flex">
                    {s.open > 0 && (
                      <div
                        className={`h-full ${s.severity === "kritisk" || s.severity === "hoy" ? "bg-red-500/60" : "bg-amber-500/60"}`}
                        style={{ width: `${s.total > 0 ? (s.open / Math.max(...bySeverity.map(x => x.total), 1)) * 100 : 0}%` }}
                      />
                    )}
                    {(s.total - s.open) > 0 && (
                      <div
                        className="h-full bg-emerald-500/40"
                        style={{ width: `${s.total > 0 ? ((s.total - s.open) / Math.max(...bySeverity.map(x => x.total), 1)) * 100 : 0}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 w-16 text-right">
                    {s.open} åpne / {s.total}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* HMS by Area */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <h2 className="font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-zinc-500" />
              Avvik per område
            </h2>
            {byArea.length === 0 ? (
              <p className="text-sm text-zinc-500">Ingen avvik registrert</p>
            ) : (
              <div className="space-y-3">
                {byArea.map(area => (
                  <div key={area.name} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-300 w-24 truncate">{area.name}</span>
                    <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden flex">
                      {area.open > 0 && (
                        <div className="h-full bg-amber-500/60" style={{ width: `${(area.open / Math.max(...byArea.map(a => a.open + a.resolved), 1)) * 100}%` }} />
                      )}
                      {area.resolved > 0 && (
                        <div className="h-full bg-emerald-500/40" style={{ width: `${(area.resolved / Math.max(...byArea.map(a => a.open + a.resolved), 1)) * 100}%` }} />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 w-16 text-right">
                      {area.open} / {area.open + area.resolved}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-4 text-xs text-zinc-600 mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/60" /> Åpne</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/40" /> Løst</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task completion */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <h2 className="font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-zinc-500" />
              Oppgavestatus
            </h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#27272a" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${completionRate} ${100 - completionRate}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-100">{completionRate}%</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-500/60" />
                  <span className="text-zinc-400">Ny: {tasksByStatus.ny}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500/60" />
                  <span className="text-zinc-400">Pågår: {tasksByStatus.pagar}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500/60" />
                  <span className="text-zinc-400">Ferdig: {tasksByStatus.ferdig}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per person */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <h2 className="font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-zinc-500" />
              Oppgaver per person
            </h2>
            {byPerson.length === 0 ? (
              <p className="text-sm text-zinc-500">Ingen oppgaver tildelt</p>
            ) : (
              <div className="space-y-3">
                {byPerson.map(person => (
                  <div key={person.name} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-300 w-32 truncate">{person.name}</span>
                    <div className="flex-1 h-5 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500/60" style={{ width: `${person.total > 0 ? (person.done / person.total) * 100 : 0}%` }} />
                      <div className="h-full bg-amber-500/60" style={{ width: `${person.total > 0 ? ((person.total - person.done) / person.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 w-14 text-right">{person.done}/{person.total}</span>
                    {person.overdue > 0 && (
                      <span className="text-xs text-red-400">{person.overdue} forfalt</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue items */}
      {(overdueDeviations.length > 0 || overdueTasks.length > 0 || overdueControls.length > 0) && (
        <Card className="bg-red-950/20 border-red-900/30">
          <CardContent className="p-6">
            <h2 className="font-semibold text-red-300 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Forfalt — krever handling
            </h2>
            <div className="space-y-2">
              {overdueDeviations.map(d => (
                <div key={d.id} className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-zinc-300 flex-1">HMS: {(d as any).hms_areas?.name}</span>
                  <span className="text-xs text-red-400">{Math.abs(daysUntil(d.due_date) || 0)}d over frist</span>
                </div>
              ))}
              {overdueTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <ClipboardList className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-zinc-300 flex-1">Oppgave forfalt</span>
                  <span className="text-xs text-red-400">{Math.abs(daysUntil(t.due_date) || 0)}d over frist</span>
                </div>
              ))}
              {overdueControls.map(c => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-zinc-300 flex-1">{c.title}</span>
                  <span className="text-xs text-red-400">Forfalt</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ value, label, color, bg }: { value: string | number; label: string; color: string; bg?: string }) {
  return (
    <Card className={`border-zinc-800 ${bg || "bg-zinc-900"}`}>
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-zinc-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
