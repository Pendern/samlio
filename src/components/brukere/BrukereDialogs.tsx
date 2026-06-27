"use client";

import { useState, useTransition } from "react";
import { inviteUser, updateUserRole, removeUser } from "@/app/brukere/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ── Inviter bruker ─────────────────────────────────────────────

export function InviterBrukerDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const email = (formData.get("email") as string)?.trim();
    const fullName = (formData.get("full_name") as string)?.trim();
    if (!email) { setError("E-post er påkrevd"); return; }
    if (!fullName || fullName.length < 2) { setError("Navn er påkrevd"); return; }

    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        toast.success("Bruker invitert", { description: `${fullName} (${email})` });
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-500 text-white" />}>
        <Plus className="w-4 h-4 mr-2" /> Inviter bruker
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader><DialogTitle>Inviter ny bruker</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Fullt navn *</Label>
              <Input id="full_name" name="full_name" placeholder="Ola Nordmann" required className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-post *</Label>
              <Input id="email" name="email" type="email" placeholder="ola@epost.no" required className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rolle</Label>
            <Select name="role" defaultValue="beboer">
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="styreleder">Styreleder</SelectItem>
                <SelectItem value="styremedlem">Styremedlem</SelectItem>
                <SelectItem value="varamedlem">Varamedlem</SelectItem>
                <SelectItem value="vaktmester">Vaktmester</SelectItem>
                <SelectItem value="beboer">Beboer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Avbryt</Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
              {isPending ? "Inviterer..." : "Inviter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Endre rolle ────────────────────────────────────────────────

export function RolleSelect({ profileId, currentRole, isCurrentUser }: {
  profileId: string;
  currentRole: string;
  isCurrentUser: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (isCurrentUser) {
    return <span className="text-xs text-zinc-500 italic">Din profil</span>;
  }

  return (
    <Select
      defaultValue={currentRole}
      disabled={isPending}
      onValueChange={(value: string | null) => {
        if (!value) return;
        startTransition(async () => {
          const result = await updateUserRole(profileId, value);
          if (result?.error) {
            toast.error("Kunne ikke endre rolle", { description: result.error });
          } else {
            toast.success("Rolle endret");
          }
        });
      }}
    >
      <SelectTrigger className="bg-zinc-800 border-zinc-700 h-8 text-xs w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700">
        <SelectItem value="styreleder">Styreleder</SelectItem>
        <SelectItem value="styremedlem">Styremedlem</SelectItem>
        <SelectItem value="varamedlem">Varamedlem</SelectItem>
        <SelectItem value="vaktmester">Vaktmester</SelectItem>
        <SelectItem value="beboer">Beboer</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Fjern bruker ───────────────────────────────────────────────

export function FjernBrukerButton({ profileId, name }: { profileId: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
      onClick={() => {
        if (!confirm(`Er du sikker på at du vil fjerne ${name}?`)) return;
        startTransition(async () => {
          const result = await removeUser(profileId);
          if (result?.error) {
            toast.error("Kunne ikke fjerne bruker", { description: result.error });
          } else {
            toast.success(`${name} fjernet`);
          }
        });
      }}
    >
      <Trash2 className="w-3 h-3 mr-1" />
      {isPending ? "..." : "Fjern"}
    </Button>
  );
}
