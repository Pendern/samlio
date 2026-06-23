"use client";

import { useState, useTransition } from "react";
import { createFdvDocument } from "@/app/nybygg/fdv-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText } from "lucide-react";

const categories = [
  "Ventilasjon", "Tak", "Fasade", "Brann", "Heis",
  "VVS", "El", "Vinduer/dører", "Gulv", "Utomhus", "Annet",
];

const buildingParts = [
  "VVS", "Takrenner", "Yttervegger", "Fellesareal", "Heis",
  "Vinduer", "Balkong", "Garasje", "Teknisk rom", "Annet",
];

export function NyFdvDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const title = (formData.get("title") as string)?.trim();
    const category = formData.get("category") as string;
    if (!title || title.length < 2) { setError("Tittel er påkrevd"); return; }
    if (!category) { setError("Velg en kategori"); return; }

    startTransition(async () => {
      const result = await createFdvDocument(formData);
      if (result?.error) setError(result.error);
      else { setOpen(false); setFileName(""); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" />}>
        <Upload className="w-4 h-4 mr-2" /> Last opp FDV
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader><DialogTitle>Last opp FDV-dokument</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="F.eks. Brukermanual varmepumpe" required className="bg-zinc-800 border-zinc-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select name="category" required>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Velg kategori" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_part">Bygningsdel</Label>
              <Select name="building_part">
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Velg del" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {buildingParts.map(bp => <SelectItem key={bp} value={bp}>{bp}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Fil (PDF, Word, etc.)</Label>
            <div className="relative">
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 border-dashed">
                <FileText className="w-5 h-5 text-zinc-500" />
                <span className="text-sm text-zinc-400">
                  {fileName || "Klikk for å velge fil"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance_interval">Vedlikeholdsintervall</Label>
              <Input id="maintenance_interval" name="maintenance_interval" placeholder="F.eks. Årlig" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_maintenance_date">Neste vedlikehold</Label>
              <Input id="next_maintenance_date" name="next_maintenance_date" type="date" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Tekniske detaljer, modellnummer, etc." className="bg-zinc-800 border-zinc-700 resize-none" />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Laster opp..." : "Last opp"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
