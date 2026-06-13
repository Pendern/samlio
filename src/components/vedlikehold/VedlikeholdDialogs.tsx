"use client";

import { useState, useTransition } from "react";
import { createMaintenanceItem, createTask, updateTaskStatus } from "@/app/vedlikehold/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wrench, ClipboardList, Check } from "lucide-react";

// ── Nytt vedlikeholdstiltak ────────────────────────────────────

export function NyttVedlikeholdDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const bp = (formData.get("building_part") as string)?.trim();
    const desc = (formData.get("description") as string)?.trim();
    if (!bp || bp.length < 2) { setError("Bygningsdel er påkrevd"); return; }
    if (!desc || desc.length < 3) { setError("Beskrivelse er påkrevd"); return; }

    startTransition(async () => {
      const result = await createMaintenanceItem(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}>
        <Wrench className="w-4 h-4 mr-2" /> Nytt tiltak
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader><DialogTitle>Nytt vedlikeholdstiltak</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building_part">Bygningsdel *</Label>
              <Input id="building_part" name="building_part" placeholder="F.eks. 361 Takrenner" required className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Tilstand</Label>
              <Select name="condition" defaultValue="god">
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="god">God</SelectItem>
                  <SelectItem value="akseptabel">Akseptabel</SelectItem>
                  <SelectItem value="darlig">Dårlig</SelectItem>
                  <SelectItem value="kritisk">Kritisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse *</Label>
            <Textarea id="description" name="description" placeholder="Beskriv tiltaket..." rows={3} required className="bg-zinc-800 border-zinc-700 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_lifetime_years">Levetid (år)</Label>
              <Input id="expected_lifetime_years" name="expected_lifetime_years" type="number" min="1" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_maintenance_at">Neste vedlikehold</Label>
              <Input id="next_maintenance_at" name="next_maintenance_at" type="date" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimert kost (kr)</Label>
              <Input id="estimated_cost" name="estimated_cost" type="number" min="0" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_maintained_at">Sist vedlikeholdt</Label>
            <Input id="last_maintained_at" name="last_maintained_at" type="date" className="bg-zinc-800 border-zinc-700" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Oppretter..." : "Legg til"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Ny oppgave ─────────────────────────────────────────────────

export function NyOppgaveDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const title = (formData.get("title") as string)?.trim();
    if (!title || title.length < 3) { setError("Tittel må være minst 3 tegn"); return; }

    startTransition(async () => {
      const result = await createTask(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" />}>
        <Plus className="w-4 h-4 mr-2" /> Ny oppgave
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader><DialogTitle>Ny oppgave</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="F.eks. Bestill takstmann for befaring" required className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" rows={3} className="bg-zinc-800 border-zinc-700 resize-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Frist</Label>
            <Input id="due_date" name="due_date" type="date" className="bg-zinc-800 border-zinc-700" />
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

// ── Oppgavestatus-knapp ────────────────────────────────────────

export function TaskStatusButton({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const nextStatus = currentStatus === "ny" ? "pagar" : currentStatus === "pagar" ? "ferdig" : "ny";
  const label = currentStatus === "ny" ? "Start" : currentStatus === "pagar" ? "Fullfør" : "Gjenåpne";

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      className={`h-7 text-xs ${currentStatus === "pagar" ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-400 hover:text-zinc-200"}`}
      onClick={() => startTransition(async () => { await updateTaskStatus(taskId, nextStatus); })}
    >
      {currentStatus === "pagar" && <Check className="w-3 h-3 mr-1" />}
      {isPending ? "..." : label}
    </Button>
  );
}
