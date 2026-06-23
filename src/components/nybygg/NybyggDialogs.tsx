"use client";

import { useState, useTransition } from "react";
import { createWarrantyClaim, updateClaimStatus } from "@/app/nybygg/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2 } from "lucide-react";

export function NyReklamasjonDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const title = (formData.get("title") as string)?.trim();
    if (!title || title.length < 3) { setError("Tittel er påkrevd"); return; }
    if (!formData.get("deadline")) { setError("Frist er påkrevd"); return; }

    startTransition(async () => {
      const result = await createWarrantyClaim(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}>
        <Plus className="w-4 h-4 mr-2" /> Ny reklamasjon
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader><DialogTitle>Registrer reklamasjon</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="F.eks. Sprekker i fasade" required className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="claim_type">Type</Label>
              <Select name="claim_type" defaultValue="reklamasjon">
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="reklamasjon">Reklamasjon</SelectItem>
                  <SelectItem value="garanti">Garanti</SelectItem>
                  <SelectItem value="mangel">Mangel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Frist *</Label>
              <Input id="deadline" name="deadline" type="date" required className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building_part">Bygningsdel</Label>
              <Input id="building_part" name="building_part" placeholder="F.eks. Fasade" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor">Entreprenør</Label>
              <Input id="contractor" name="contractor" placeholder="F.eks. Veidekke AS" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discovered_at">Oppdaget dato</Label>
            <Input id="discovered_at" name="discovered_at" type="date" className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" rows={3} className="bg-zinc-800 border-zinc-700 resize-none" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Registrerer..." : "Registrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClaimStatusButton({ claimId, currentStatus }: { claimId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  if (currentStatus === "resolved" || currentStatus === "expired") return null;

  const nextStatus = currentStatus === "active" ? "submitted" : "resolved";
  const label = currentStatus === "active" ? "Meld inn" : "Marker løst";

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      className={`h-7 text-xs ${nextStatus === "resolved" ? "text-emerald-400 hover:text-emerald-300" : "text-violet-400 hover:text-violet-300"}`}
      onClick={() => startTransition(async () => { await updateClaimStatus(claimId, nextStatus); })}
    >
      {nextStatus === "resolved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {isPending ? "..." : label}
    </Button>
  );
}
