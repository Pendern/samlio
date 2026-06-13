import { getAuthContext } from "@/lib/auth";
import { caseStatusConfig, formatDate } from "@/lib/config";
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Archive,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NySakDialog } from "@/components/saker/NySakDialog";

const statusIcons: Record<string, typeof Clock> = {
  ny: Clock, under_behandling: AlertTriangle, vedtatt: CheckCircle2,
  avvist: AlertTriangle, utsatt: Clock, arkivert: Archive,
};

export default async function SakerPage() {
  const { supabase, tenantId } = await getAuthContext();

  const { data: cases } = await supabase
    .from("board_cases")
    .select("*, profiles!board_cases_created_by_fkey(full_name)")
    .eq("tenant_id", tenantId)
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
        <NySakDialog />
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
            const status = caseStatusConfig[c.status] || caseStatusConfig.ny;
            const StatusIcon = statusIcons[c.status] || Clock;
            const createdDate = formatDate(c.created_at);

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
