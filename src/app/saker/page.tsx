import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  FileText,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Archive,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  ny: { label: "Ny", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  under_behandling: { label: "Under behandling", color: "bg-amber-500/20 text-amber-400", icon: AlertTriangle },
  vedtatt: { label: "Vedtatt", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  avvist: { label: "Avvist", color: "bg-red-500/20 text-red-400", icon: AlertTriangle },
  utsatt: { label: "Utsatt", color: "bg-zinc-500/20 text-zinc-400", icon: Clock },
  arkivert: { label: "Arkivert", color: "bg-zinc-500/20 text-zinc-500", icon: Archive },
};

export default async function SakerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  const { data: cases } = await supabase
    .from("board_cases")
    .select("*, profiles!board_cases_created_by_fkey(full_name)")
    .eq("tenant_id", profile!.tenant_id)
    .order("created_at", { ascending: false });

  const activeCases = cases?.filter(c => c.status !== "arkivert") || [];
  const archivedCount = cases?.filter(c => c.status === "arkivert").length || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Styresaker</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {activeCases.length} aktive saker{archivedCount > 0 ? ` · ${archivedCount} arkivert` : ""}
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ny sak
        </Button>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {activeCases.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Ingen aktive saker</p>
            <p className="text-sm text-zinc-600 mt-1">Opprett en ny sak for å komme i gang</p>
          </div>
        ) : (
          activeCases.map((c) => {
            const status = statusConfig[c.status] || statusConfig.ny;
            const StatusIcon = status.icon;
            const createdDate = new Date(c.created_at).toLocaleDateString("no-NO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <a
                key={c.id}
                href={`/saker/${c.id}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-800/50 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-zinc-100 group-hover:text-white transition truncate">
                        {c.title}
                      </h3>
                      <Badge variant="secondary" className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                        {c.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {c.category && (
                        <span className="bg-zinc-800 px-2 py-0.5 rounded">
                          {c.category}
                        </span>
                      )}
                      <span>Opprettet {createdDate}</span>
                      {(c as any).profiles?.full_name && (
                        <span>av {(c as any).profiles.full_name}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition flex-shrink-0 ml-4" />
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
