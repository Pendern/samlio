import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Wrench, AlertTriangle, CheckCircle2, Clock, ClipboardList, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NyttVedlikeholdDialog, NyOppgaveDialog, TaskStatusButton } from "@/components/vedlikehold/VedlikeholdDialogs";

const conditionConfig: Record<string, { label: string; color: string; bg: string }> = {
  god: { label: "God", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  akseptabel: { label: "Akseptabel", color: "text-amber-400", bg: "bg-amber-500/20" },
  darlig: { label: "Dårlig", color: "text-red-400", bg: "bg-red-500/20" },
  kritisk: { label: "Kritisk", color: "text-red-300", bg: "bg-red-600/30" },
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  ny: { label: "Ny", color: "bg-blue-500/20 text-blue-400" },
  pagar: { label: "Pågår", color: "bg-amber-500/20 text-amber-400" },
  ferdig: { label: "Ferdig", color: "bg-emerald-500/20 text-emerald-400" },
};

export default async function VedlikeholdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("id, tenant_id").eq("user_id", user.id).single();
  const tenantId = profile!.tenant_id;

  const [itemsRes, tasksRes] = await Promise.all([
    supabase.from("maintenance_items").select("*").eq("tenant_id", tenantId).order("next_maintenance_at"),
    supabase.from("tasks").select("*, profiles!tasks_assigned_to_fkey(full_name)").eq("tenant_id", tenantId).order("due_date"),
  ]);

  const items = itemsRes.data || [];
  const tasks = tasksRes.data || [];

  const totalEstimatedCost = items.reduce((sum, i) => sum + (Number(i.estimated_cost) || 0), 0);
  const criticalItems = items.filter(i => i.condition === "darlig" || i.condition === "kritisk");
  const thisYearItems = items.filter(i => i.next_maintenance_at && new Date(i.next_maintenance_at).getFullYear() === new Date().getFullYear());
  const pendingTasks = tasks.filter(t => t.status !== "ferdig");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Vedlikehold</h1>
          <p className="text-sm text-zinc-500 mt-1">Vedlikeholdsplan og oppgaveoppfølging</p>
        </div>
        <div className="flex items-center gap-2">
          <NyOppgaveDialog />
          <NyttVedlikeholdDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{items.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Bygningsdeler</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${criticalItems.length > 0 ? "bg-red-950/20" : "bg-zinc-900"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${criticalItems.length > 0 ? "text-red-400" : "text-emerald-400"}`}>{criticalItems.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Kritisk / dårlig</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{thisYearItems.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Tiltak i år</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{totalEstimatedCost > 0 ? `${(totalEstimatedCost / 1000000).toFixed(1)}M` : "—"}</p>
            <p className="text-xs text-zinc-500 mt-1">Total estimert</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <ClipboardList className="w-4 h-4 inline-block mr-1.5" />
          Oppgaver ({pendingTasks.length} åpne)
        </h2>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <ClipboardList className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen oppgaver — opprett en for å komme i gang</p>
            </div>
          ) : (
            tasks.map((task) => {
              const ts = taskStatusConfig[task.status] || taskStatusConfig.ny;
              const isOverdue = task.due_date && task.status !== "ferdig" && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${isOverdue ? "border-red-900/50" : task.status === "ferdig" ? "border-zinc-800 opacity-60" : "border-zinc-800"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-red-500/20" : task.status === "ferdig" ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                    {task.status === "ferdig" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                     isOverdue ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                     <ClipboardList className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === "ferdig" ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{task.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {(task as any).profiles?.full_name && `${(task as any).profiles.full_name}`}
                      {task.due_date && ` · Frist: ${new Date(task.due_date).toLocaleDateString("no-NO", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={ts.color}>{ts.label}</Badge>
                  <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Maintenance Plan */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Wrench className="w-4 h-4 inline-block mr-1.5" />
          Vedlikeholdsplan
        </h2>
        <div className="space-y-3">
          {items.map((item) => {
            const cond = conditionConfig[item.condition] || conditionConfig.god;
            const isUpcoming = item.next_maintenance_at && new Date(item.next_maintenance_at) <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            const isOverdue = item.next_maintenance_at && new Date(item.next_maintenance_at) < new Date();

            return (
              <div key={item.id} className={`bg-zinc-900 border rounded-xl p-5 ${isOverdue ? "border-red-900/50" : "border-zinc-800"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-zinc-100">{item.building_part}</h3>
                      <Badge variant="secondary" className={`${cond.bg} ${cond.color}`}>{cond.label}</Badge>
                      {isOverdue && <Badge variant="secondary" className="bg-red-500/20 text-red-400">Forfalt</Badge>}
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
                  </div>
                  {item.estimated_cost && (
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-lg font-bold text-zinc-200">{Number(item.estimated_cost).toLocaleString("no-NO")}</p>
                      <p className="text-xs text-zinc-500">kr estimert</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 text-xs text-zinc-500">
                  {item.last_maintained_at && (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sist: {new Date(item.last_maintained_at).toLocaleDateString("no-NO", { month: "short", year: "numeric" })}
                    </span>
                  )}
                  {item.next_maintenance_at && (
                    <span className={`flex items-center gap-1.5 ${isOverdue ? "text-red-400" : isUpcoming ? "text-amber-400" : ""}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      Neste: {new Date(item.next_maintenance_at).toLocaleDateString("no-NO", { month: "short", year: "numeric" })}
                    </span>
                  )}
                  {item.expected_lifetime_years && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Levetid: {item.expected_lifetime_years} år
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
