"use client";

import { useState, useTransition } from "react";
import { createSupplier, createBooking, cancelBooking } from "@/app/drift/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

// ── Ny leverandør ──────────────────────────────────────────────

export function NyLeverandorDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const name = (formData.get("name") as string)?.trim();
    if (!name || name.length < 2) { setError("Navn er påkrevd"); return; }

    startTransition(async () => {
      const result = await createSupplier(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}>
        <Plus className="w-4 h-4 mr-2" /> Ny leverandør
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader><DialogTitle>Legg til leverandør</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Firmanavn *</Label>
              <Input id="name" name="name" placeholder="F.eks. Oslo VVS AS" required className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select name="category" defaultValue="generelt">
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="rorlegger">Rørlegger</SelectItem>
                  <SelectItem value="elektriker">Elektriker</SelectItem>
                  <SelectItem value="vaktmester">Vaktmester</SelectItem>
                  <SelectItem value="renhold">Renhold</SelectItem>
                  <SelectItem value="heis">Heis</SelectItem>
                  <SelectItem value="uteomrade">Uteområde</SelectItem>
                  <SelectItem value="maler">Maler</SelectItem>
                  <SelectItem value="snekker">Snekker</SelectItem>
                  <SelectItem value="generelt">Generelt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Kontaktperson</Label>
              <Input id="contact_person" name="contact_person" placeholder="Navn" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" placeholder="99 88 77 66" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" name="email" type="email" placeholder="post@firma.no" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_nr">Org.nr</Label>
              <Input id="org_nr" name="org_nr" placeholder="123 456 789" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea id="notes" name="notes" rows={2} className="bg-zinc-800 border-zinc-700 resize-none" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Lagrer..." : "Legg til"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Ny booking ─────────────────────────────────────────────────

export function NyBookingDialog({ resources }: { resources: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    if (!formData.get("resource_id")) { setError("Velg en ressurs"); return; }
    if (!formData.get("date")) { setError("Dato er påkrevd"); return; }

    startTransition(async () => {
      const result = await createBooking(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}>
        <Plus className="w-4 h-4 mr-2" /> Ny booking
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader><DialogTitle>Book fellesressurs</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="resource_id">Ressurs *</Label>
            <Select name="resource_id">
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Velg ressurs" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {resources.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Dato *</Label>
            <Input id="date" name="date" type="date" required className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_from">Fra kl *</Label>
              <Input id="time_from" name="time_from" type="time" required className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_to">Til kl *</Label>
              <Input id="time_to" name="time_to" type="time" required className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Formål</Label>
            <Input id="purpose" name="purpose" placeholder="F.eks. Bursdag, dugnad" className="bg-zinc-800 border-zinc-700" />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Booker..." : "Book"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Kanseller booking ──────────────────────────────────────────

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      className="h-7 text-xs text-red-400 hover:text-red-300"
      onClick={() => startTransition(async () => { await cancelBooking(bookingId); })}
    >
      <X className="w-3 h-3 mr-1" />
      {isPending ? "..." : "Kanseller"}
    </Button>
  );
}
