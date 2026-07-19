"use client";

import { useState, useTransition } from "react";
import { updateSuggestionStatus, generateSuggestions } from "@/app/ai/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, RefreshCw, Sparkles, Filter, History, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

// ── Suggestion action buttons ──────────────────────────────────

export function SuggestionActions({ suggestionId }: { suggestionId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleAction(status: "accepted" | "rejected" | "deferred") {
    startTransition(async () => {
      const result = await updateSuggestionStatus(suggestionId, status);
      if (result?.error) {
        toast.error("Kunne ikke oppdatere forslag", { description: result.error });
      } else {
        const labels = { accepted: "akseptert", rejected: "avvist", deferred: "utsatt" };
        toast.success(`Forslag ${labels[status]}`);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        size="sm"
        disabled={isPending}
        className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs"
        onClick={() => handleAction("accepted")}
      >
        <Check className="w-3 h-3 mr-1" /> Aksepter
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-zinc-400 hover:text-zinc-200 h-8 text-xs"
        onClick={() => handleAction("deferred")}
      >
        <Clock className="w-3 h-3 mr-1" /> Utsett
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-zinc-500 hover:text-zinc-300 h-8 text-xs"
        onClick={() => handleAction("rejected")}
      >
        <X className="w-3 h-3 mr-1" /> Avvis
      </Button>
    </div>
  );
}

// ── Generate suggestions button ───────────────────────────────

export function GenerateSuggestionsButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      className="text-violet-400 hover:text-violet-300 h-7 text-xs"
      onClick={() => startTransition(async () => {
        const result = await generateSuggestions();
        if (result.inserted > 0) {
          toast.success(`${result.inserted} forslag generert`, {
            description: "Basert på analyse av HMS, vedlikehold, økonomi og mer",
            icon: "\u2728",
          });
        } else {
          toast.info("Ingen nye forslag", {
            description: "Alt ser bra ut — ingen problemområder funnet",
          });
        }
      })}
    >
      <RefreshCw className={`w-3 h-3 mr-1 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Analyserer..." : "Oppdater forslag"}
    </Button>
  );
}

// ── Suggestion type filter ────────────────────────────────────

const typeConfig: Record<string, { label: string; color: string }> = {
  hms: { label: "HMS", color: "bg-amber-500/20 text-amber-400" },
  vedlikehold: { label: "Vedlikehold", color: "bg-orange-500/20 text-orange-400" },
  okonomi: { label: "Økonomi", color: "bg-emerald-500/20 text-emerald-400" },
  forsikring: { label: "Forsikring", color: "bg-blue-500/20 text-blue-400" },
  saker: { label: "Saker", color: "bg-violet-500/20 text-violet-400" },
  moter: { label: "Møter", color: "bg-teal-500/20 text-teal-400" },
};

interface Suggestion {
  id: string;
  type: string;
  suggestion_text: string;
  source_refs: string[] | null;
}

interface ResolvedSuggestion extends Suggestion {
  status: string;
  resolved_at: string | null;
}

export function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  // Get unique types from suggestions
  const types = [...new Set(suggestions.map(s => s.type))];
  const filtered = filter ? suggestions.filter(s => s.type === filter) : suggestions;

  return (
    <>
      {/* Filter chips */}
      {types.length > 1 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <button
            onClick={() => setFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-lg transition ${
              filter === null
                ? "bg-violet-500/20 text-violet-400"
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Alle ({suggestions.length})
          </button>
          {types.map(type => {
            const cfg = typeConfig[type] || { label: type, color: "bg-zinc-500/20 text-zinc-400" };
            const count = suggestions.filter(s => s.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? null : type)}
                className={`text-xs px-2.5 py-1 rounded-lg transition ${
                  filter === type ? cfg.color : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Suggestion cards */}
      <div className="space-y-3">
        {filtered.length === 0 && suggestions.length > 0 && (
          <div className="bg-violet-950/20 border border-violet-900/20 rounded-xl p-4 text-center">
            <p className="text-sm text-zinc-400">Ingen forslag i denne kategorien</p>
          </div>
        )}
        {filtered.length === 0 && suggestions.length === 0 && (
          <div className="bg-violet-950/20 border border-violet-900/20 rounded-xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Klikk &laquo;Oppdater forslag&raquo; for å analysere dataene og generere AI-forslag</p>
          </div>
        )}
        {filtered.map((s) => {
          const cfg = typeConfig[s.type] || { label: s.type, color: "bg-zinc-500/20 text-zinc-400" };
          return (
            <div
              key={s.id}
              className="bg-violet-950/30 border border-violet-900/30 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className={`${cfg.color} text-[10px] px-1.5 py-0`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{s.suggestion_text}</p>
                  {s.source_refs && s.source_refs.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">Basert på: {s.source_refs.join(", ")}</p>
                  )}
                  <SuggestionActions suggestionId={s.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Suggestion history ─────────────────────────────────────

const statusConfig: Record<string, { label: string; icon: typeof Check; color: string }> = {
  accepted: { label: "Akseptert", icon: Check, color: "text-emerald-400" },
  rejected: { label: "Avvist", icon: X, color: "text-red-400" },
  deferred: { label: "Utsatt", icon: Clock, color: "text-amber-400" },
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "akkurat nå";
  if (mins < 60) return `${mins}m siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}t siden`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d siden`;
  return new Date(dateStr).toLocaleDateString("no-NO", { day: "numeric", month: "short" });
}

export function SuggestionHistory({ suggestions }: { suggestions: ResolvedSuggestion[] }) {
  const [expanded, setExpanded] = useState(false);

  const accepted = suggestions.filter(s => s.status === "accepted").length;
  const rejected = suggestions.filter(s => s.status === "rejected").length;
  const deferred = suggestions.filter(s => s.status === "deferred").length;

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition w-full"
      >
        <History className="w-3.5 h-3.5" />
        <span>Historikk ({suggestions.length})</span>
        <span className="flex items-center gap-2 ml-1">
          {accepted > 0 && <span className="text-emerald-500">{accepted} akseptert</span>}
          {rejected > 0 && <span className="text-red-500">{rejected} avvist</span>}
          {deferred > 0 && <span className="text-amber-500">{deferred} utsatt</span>}
        </span>
        <span className="ml-auto">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {suggestions.map((s) => {
            const cfg = typeConfig[s.type] || { label: s.type, color: "bg-zinc-500/20 text-zinc-400" };
            const sc = statusConfig[s.status] || statusConfig.deferred;
            const StatusIcon = sc.icon;
            return (
              <div
                key={s.id}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex items-start gap-3 opacity-75"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  s.status === "accepted" ? "bg-emerald-500/10" :
                  s.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"
                }`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${sc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`${cfg.color} text-[10px] px-1.5 py-0`}>{cfg.label}</Badge>
                    <span className={`text-[10px] ${sc.color}`}>{sc.label}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto">{formatTimeAgo(s.resolved_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{s.suggestion_text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
