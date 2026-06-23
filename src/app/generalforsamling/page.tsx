import { getAuthContext } from "@/lib/auth";
import { formatDate, daysUntil } from "@/lib/config";
import {
  Gavel, Calendar, MapPin, Clock, Users, Vote,
  FileText, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NyGFDialog, VoteButtons, AssemblyStatusButton } from "@/components/generalforsamling/GFComponents";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Utkast", color: "bg-zinc-500/20 text-zinc-400" },
  notice_sent: { label: "Innkalling sendt", color: "bg-blue-500/20 text-blue-400" },
  open: { label: "Pågår", color: "bg-teal-500/20 text-teal-400" },
  voting: { label: "Avstemning åpen", color: "bg-violet-500/20 text-violet-400" },
  closed: { label: "Avsluttet", color: "bg-emerald-500/20 text-emerald-400" },
};

export default async function GeneralforsamlingPage() {
  const { supabase, tenantId, profileId } = await getAuthContext();

  const { data: assemblies } = await supabase
    .from("assemblies")
    .select("*, assembly_items(*, assembly_votes(id, profile_id, vote)), assembly_attendance(profile_id, attended)")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false });

  const all = assemblies || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Generalforsamling</h1>
          <p className="text-sm text-zinc-500 mt-1">Innkalling, saksliste og digital avstemning</p>
        </div>
        <NyGFDialog />
      </div>

      {all.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Gavel className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Ingen generalforsamlinger opprettet</p>
        </div>
      ) : (
        all.map(assembly => {
          const status = statusConfig[assembly.status] || statusConfig.draft;
          const items = (assembly.assembly_items || []).sort((a: any, b: any) => a.item_number - b.item_number);
          const days = daysUntil(assembly.date);
          const isVotingOpen = assembly.status === "voting";
          const isClosed = assembly.status === "closed";
          const attendeeCount = (assembly.assembly_attendance || []).filter((a: any) => a.attended).length;

          return (
            <Card key={assembly.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-zinc-100">{assembly.title}</h2>
                      <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(assembly.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      {assembly.time && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{assembly.time.substring(0, 5)}</span>}
                      {assembly.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{assembly.location}</span>}
                      {days !== null && days > 0 && <span className="text-teal-400">{days}d igjen</span>}
                    </div>
                  </div>
                  <AssemblyStatusButton assemblyId={assembly.id} currentStatus={assembly.status} />
                </div>

                {/* Agenda Items */}
                {items.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
                      <FileText className="w-4 h-4 inline-block mr-1.5" />
                      Saksliste ({items.length} saker)
                    </h3>
                    <div className="space-y-2">
                      {items.map((item: any) => {
                        const votes = item.assembly_votes || [];
                        const forCount = votes.filter((v: any) => v.vote === "for").length;
                        const againstCount = votes.filter((v: any) => v.vote === "against").length;
                        const abstainCount = votes.filter((v: any) => v.vote === "abstain").length;
                        const totalVotes = forCount + againstCount + abstainCount;
                        const myVote = votes.find((v: any) => v.profile_id === profileId)?.vote || null;
                        const passed = isClosed && forCount > againstCount;

                        return (
                          <div key={item.id} className="bg-zinc-800/50 rounded-xl p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-400">{item.item_number}</span>
                                  <h4 className="text-sm font-medium text-zinc-200">{item.title}</h4>
                                  <Badge variant="secondary" className="bg-zinc-600/30 text-zinc-400 text-[10px]">{
                                    item.item_type === "valg" ? "Valg" : item.item_type === "orientering" ? "Orientering" : item.item_type === "vedtektsendring" ? "Vedtektsendring" : "Sak"
                                  }</Badge>
                                  {isClosed && item.requires_vote && (
                                    <Badge variant="secondary" className={passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                                      {passed ? "Vedtatt" : "Avvist"}
                                    </Badge>
                                  )}
                                </div>
                                {item.description && <p className="text-xs text-zinc-500 ml-10">{item.description}</p>}
                              </div>

                              {/* Vote results or buttons */}
                              <div className="flex-shrink-0 ml-4">
                                {isVotingOpen && item.requires_vote ? (
                                  <VoteButtons itemId={item.id} currentVote={myVote} />
                                ) : totalVotes > 0 ? (
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-emerald-400">{forCount} for</span>
                                    <span className="text-red-400">{againstCount} mot</span>
                                    {abstainCount > 0 && <span className="text-zinc-500">{abstainCount} avhold</span>}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">Ingen saker på sakslisten ennå</p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
