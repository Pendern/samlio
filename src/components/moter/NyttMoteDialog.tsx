"use client";

import { useState, useTransition } from "react";
import { createMeeting } from "@/app/moter/actions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export function NyttMoteDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const title = (formData.get("title") as string)?.trim();
    const date = formData.get("date") as string;
    if (!title || title.length < 3) { setError("Tittel må være minst 3 tegn"); return; }
    if (!date) { setError("Dato er påkrevd"); return; }

    startTransition(async () => {
      const result = await createMeeting(formData);
      if (result?.error) { setError(result.error); }
      else { setOpen(false); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nytt møte
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett nytt møte</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="F.eks. Styremøte august 2026" required className="bg-zinc-800 border-zinc-700" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type">Type</Label>
            <Select name="meeting_type" defaultValue="styremote">
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="styremote">Styremøte</SelectItem>
                <SelectItem value="arsmote">Årsmøte</SelectItem>
                <SelectItem value="ekstraordinart">Ekstraordinært</SelectItem>
              </SelectContent>
            </Select>
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
            <Input id="location" name="location" placeholder="F.eks. Felleslokalet, 1. etg" className="bg-zinc-800 border-zinc-700" />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Oppretter..." : "Opprett møte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
