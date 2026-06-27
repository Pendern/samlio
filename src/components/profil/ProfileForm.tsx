"use client";

import { useState, useTransition, useRef } from "react";
import { updateProfile, changePassword } from "@/app/profil/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { roleLabels } from "@/lib/config";

interface ProfileFormProps {
  profile: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
    role: string;
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    const fullName = (formData.get("full_name") as string)?.trim();
    if (!fullName || fullName.length < 2) { setError("Navn m\u00e5 v\u00e6re minst 2 tegn"); return; }

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) setError(result.error);
      else toast.success("Profilen er oppdatert");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">Fullt navn *</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name || ""} required className="bg-zinc-800 border-zinc-700" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input id="email" name="email" type="email" defaultValue={profile.email || ""} placeholder="din@epost.no" className="bg-zinc-800 border-zinc-700" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={profile.phone || ""} placeholder="+47 900 00 000" className="bg-zinc-800 border-zinc-700" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Rolle</Label>
        <div className="px-4 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-400">
          {roleLabels[profile.role] || profile.role}
          <span className="text-zinc-600 ml-2">\u00b7 Kan ikke endres her</span>
        </div>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white">
        {isPending ? "Lagrer..." : "Lagre endringer"}
      </Button>
    </form>
  );
}

// \u2500\u2500 Password change form \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError("");
    const current = (formData.get("current_password") as string) || "";
    const newPw = (formData.get("new_password") as string) || "";
    const confirm = (formData.get("confirm_password") as string) || "";

    if (!current) { setError("N\u00e5v\u00e6rende passord er p\u00e5krevd"); return; }
    if (newPw.length < 8) { setError("Nytt passord m\u00e5 v\u00e6re minst 8 tegn"); return; }
    if (newPw !== confirm) { setError("Passordene stemmer ikke overens"); return; }

    startTransition(async () => {
      const result = await changePassword(current, newPw);
      if (result?.error) {
        setError(result.error);
      } else {
        toast.success("Passordet er endret");
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="current_password">N\u00e5v\u00e6rende passord *</Label>
        <Input id="current_password" name="current_password" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required className="bg-zinc-800 border-zinc-700" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="new_password">Nytt passord *</Label>
          <Input id="new_password" name="new_password" type="password" placeholder="Minst 8 tegn" required className="bg-zinc-800 border-zinc-700" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Bekreft passord *</Label>
          <Input id="confirm_password" name="confirm_password" type="password" placeholder="Gjenta passord" required className="bg-zinc-800 border-zinc-700" />
        </div>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <Button type="submit" disabled={isPending} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700">
        {isPending ? "Endrer..." : "Endre passord"}
      </Button>
    </form>
  );
}
