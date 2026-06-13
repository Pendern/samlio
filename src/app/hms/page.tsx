import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
  TreePine,
  Car,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const areaIcons: Record<string, typeof Flame> = {
  brann: Flame,
  el: Zap,
  lekeplass: TreePine,
  garasje: Car,
};

const severityConfig: Record<string, { label: string; color: string }> = {
  lav: { label: "Lav", color: "bg-emerald-500/20 text-emerald-400" },
  middels: { label: "Middels", color: "bg-amber-500/20 text-amber-400" },
  hoy: { label: "Høy", color: "bg-red-500/20 text-red-400" },
  kritisk: { label: "Kritisk", color: "bg-red-600/30 text-red-300" },
};

export default async function HmsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  const tenantId = profile!.tenant_id;

  const [areasRes, controlsRes, deviationsRes] = await Promise.all([
    supabase.from("hms_areas").select("*").eq("tenant_id", tenantId),
    supabase.from("hms_controls").select("*, hms_areas(name)").eq("tenant_id", tenantId).order("next_due_date"),
    supabase.from("hms_deviations").select("*, hms_areas(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
  ]);

  const areas = areasRes.data || [];
  const controls = controlsRes.data || [];
  const deviations = deviationsRes.data || [];

  const openDeviations = deviations.filter(d => d.status !== "resolved");
  const overdueControls = controls.filter(c => new Date(c.next_due_date) < new Date());
  const upcomingControls = controls.filter(c => {
    const due = new Date(c.next_due_date);
    const now = new Date();
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return due >= now && due <= in30days;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">HMS</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Helse, miljø og sikkerhet · Internkontroll iht. forskriften §5
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nytt avvik
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-zinc-100">{areas.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Kontrollområder</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-zinc-100">{controls.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Kontrollrutiner</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${overdueControls.length > 0 ? "bg-red-950/30" : "bg-zinc-900"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${overdueControls.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {overdueControls.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Forfalt</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${openDeviations.length > 0 ? "bg-amber-950/30" : "bg-zinc-900"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${openDeviations.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {openDeviations.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Åpne avvik</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Deviations */}
      {openDeviations.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
            Åpne avvik
          </h2>
          <div className="space-y-3">
            {openDeviations.map((dev) => {
              const severity = severityConfig[dev.severity] || severityConfig.lav;
              const daysLeft = dev.due_date
                ? Math.ceil((new Date(dev.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={dev.id}
                  className={`rounded-xl p-5 border ${
                    dev.severity === "kritisk" || dev.severity === "hoy"
                      ? "bg-red-950/30 border-red-900/30"
                      : "bg-amber-950/30 border-amber-900/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-zinc-100">{dev.title}</h3>
                        <Badge variant="secondary" className={severity.color}>
                          {severity.label}
                        </Badge>
                        {daysLeft !== null && (
                          <span className={`text-xs ${daysLeft < 0 ? "text-red-400" : "text-zinc-500"}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d over frist` : `${daysLeft}d igjen`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">{dev.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                        <span>Område: {(dev as any).hms_areas?.name}</span>
                        <span>Status: {dev.status === "open" ? "Åpen" : "Under arbeid"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Controls Schedule */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          Kontrollplan
        </h2>
        <div className="space-y-2">
          {controls.map((ctrl) => {
            const isOverdue = new Date(ctrl.next_due_date) < new Date();
            const dueDate = new Date(ctrl.next_due_date).toLocaleDateString("no-NO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const AreaIcon = areaIcons[(ctrl as any).hms_areas?.name?.toLowerCase()] || ShieldCheck;

            return (
              <div
                key={ctrl.id}
                className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${
                  isOverdue ? "border-red-900/50" : "border-zinc-800"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isOverdue ? "bg-red-500/20" : "bg-zinc-800"
                }`}>
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{ctrl.title}</p>
                  <p className="text-xs text-zinc-500">
                    {(ctrl as any).hms_areas?.name} · {ctrl.frequency === "quarterly" ? "Kvartalsvis" : ctrl.frequency === "annual" ? "Årlig" : ctrl.frequency === "monthly" ? "Månedlig" : "Halvårlig"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-zinc-400"}`}>
                    {isOverdue ? "Forfalt" : "Neste"}
                  </p>
                  <p className="text-xs text-zinc-500">{dueDate}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Areas Overview */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          Kontrollområder
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {areas.map((area) => {
            const riskLevel = severityConfig[area.risk_level] || severityConfig.lav;
            const AreaIcon = areaIcons[area.area_type] || ShieldCheck;
            const areaDeviations = openDeviations.filter(d => d.area_id === area.id).length;

            return (
              <div
                key={area.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <AreaIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <Badge variant="secondary" className={riskLevel.color}>
                    {riskLevel.label} risiko
                  </Badge>
                </div>
                <h3 className="font-semibold text-zinc-100 mb-1">{area.name}</h3>
                <p className="text-sm text-zinc-500">{area.description}</p>
                {areaDeviations > 0 && (
                  <p className="text-xs text-amber-400 mt-2">{areaDeviations} åpne avvik</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
