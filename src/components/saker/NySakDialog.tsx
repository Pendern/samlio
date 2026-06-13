"use client";

import { useState, useTransition } from "react";
import { createBoardCase } from "@/app/actions";
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

const categories = [
  "Vedlikehold",
  "Drift",
  "Økonomi",
  "Juridisk",
  "HMS",
  "Kommunikasjon",
  "Beboerhenvendelse",
  "Annet",
];

export function NySakDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");

    const title = (formData.get("title") as string)?.trim();
    if (!title) {
      setError("Tittel er påkrevd");
      return;
    }
    if (title.length < 3) {
      setError("Tittelen må være minst 3 tegn");
      return;
    }
    if (title.length > 200) {
      setError("Tittelen kan maks være 200 tegn");
      return;
    }

    startTransition(async () => {
      try {
        await createBoardCase(formData);
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
        Ny sak
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett ny styresak</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              name="title"
              placeholder="F.eks. Reklamasjon fasade"
              required
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select name="category">
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Beskriv saken i detalj..."
              rows={4}
              className="bg-zinc-800 border-zinc-700 resize-none"
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
              {isPending ? "Oppretter..." : "Opprett sak"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
