"use client";

import { useState, useTransition } from "react";
import { createAssembly, castVote, updateAssemblyStatus } from "@/app/generalforsamling/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ThumbsUp, ThumbsDown, Minus, PlayCircle, Lock } from "lucide-react";

export function NyGFDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createAssembly(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}>
        <Plus className="w-4 h-4 mr-2" /> Ny generalforsamling
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader><DialogTitle>Opprett generalforsamling</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="Ordinær generalforsamling 2026" required className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Dato *</Label>
              <Input id="date" name="date" type="date" required className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Klokkeslett</Label>
              <Input id="time" name="time" type="time" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input id="location" name="location" placeholder="Felleslokalet" className="bg-zinc-800 border-zinc-700" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Oppretter..." : "Opprett"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VoteButtons({ itemId, currentVote }: { itemId: string; currentVote: string | null }) {
  const [isPending, startTransition] = useTransition();

  function handleVote(vote: string) {
    startTransition(async () => { await castVote(itemId, vote); });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant={currentVote === "for" ? "default" : "ghost"}
        onClick={() => handleVote("for")}
        disabled={isPending}
        className={`h-8 text-xs ${currentVote === "for" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "text-emerald-400 hover:text-emerald-300"}`}
      >
        <ThumbsUp className="w-3 h-3 mr-1" /> For
      </Button>
      <Button
        size="sm"
        variant={currentVote === "against" ? "default" : "ghost"}
        onClick={() => handleVote("against")}
        disabled={isPending}
        className={`h-8 text-xs ${currentVote === "against" ? "bg-red-600 hover:bg-red-500 text-white" : "text-red-400 hover:text-red-300"}`}
      >
        <ThumbsDown className="w-3 h-3 mr-1" /> Mot
      </Button>
      <Button
        size="sm"
        variant={currentVote === "abstain" ? "default" : "ghost"}
        onClick={() => handleVote("abstain")}
        disabled={isPending}
        className={`h-8 text-xs ${currentVote === "abstain" ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
      >
        <Minus className="w-3 h-3 mr-1" /> Avhold
      </Button>
    </div>
  );
}

export function AssemblyStatusButton({ assemblyId, currentStatus }: { assemblyId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const transitions: Record<string, { next: string; label: string; icon: typeof PlayCircle }> = {
    draft: { next: "notice_sent", label: "Send innkalling", icon: PlayCircle },
    notice_sent: { next: "voting", label: "Åpne avstemning", icon: PlayCircle },
    voting: { next: "closed", label: "Avslutt", icon: Lock },
  };

  const t = transitions[currentStatus];
  if (!t) return null;

  return (
    <Button
      size="sm"
      onClick={() => startTransition(async () => { await updateAssemblyStatus(assemblyId, t.next); })}
      disabled={isPending}
      className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs"
    >
      <t.icon className="w-3 h-3 mr-1.5" />
      {isPending ? "..." : t.label}
    </Button>
  );
}
