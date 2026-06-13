"use client";

import { useState, useTransition } from "react";
import { createHmsDeviation } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface HmsArea {
  id: string;
  name: string;
}

export function NyttAvvikDialog({ areas }: { areas: HmsArea[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        await createHmsDeviation(formData);
        setOpen(false);
      } catch (e: any) {
        setError(e.message || "Noe gikk galt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nytt avvik
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrer HMS-avvik</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              name="title"
              placeholder="F.eks. Ødelagt rekkverk ved inngang"
              required
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_id">Kontrollområde *</Label>
              <Select name="area_id" required>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Velg område" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Alvorlighetsgrad</Label>
              <Select name="severity" defaultValue="middels">
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="lav">Lav</SelectItem>
                  <SelectItem value="middels">Middels</SelectItem>
                  <SelectItem value="hoy">Høy</SelectItem>
                  <SelectItem value="kritisk">Kritisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Beskriv avviket, hva som er observert og eventuell risiko..."
              rows={4}
              required
              className="bg-zinc-800 border-zinc-700 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Frist for utbedring</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-400"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {isPending ? "Registrerer..." : "Registrer avvik"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
