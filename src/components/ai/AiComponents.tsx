"use client";

import { useTransition } from "react";
import { updateSuggestionStatus, generateSuggestions } from "@/app/ai/actions";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, RefreshCw } from "lucide-react";

export function SuggestionActions({ suggestionId }: { suggestionId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleAction(status: "accepted" | "rejected" | "deferred") {
    startTransition(async () => {
      await updateSuggestionStatus(suggestionId, status);
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

export function GenerateSuggestionsButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      className="text-violet-400 hover:text-violet-300 h-7 text-xs"
      onClick={() => startTransition(async () => { await generateSuggestions(); })}
    >
      <RefreshCw className={`w-3 h-3 mr-1 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Analyserer..." : "Oppdater forslag"}
    </Button>
  );
}
