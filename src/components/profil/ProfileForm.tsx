"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/profil/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

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
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);

    const fullName = (formData.get("full_name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();

    if (!fullName || fullName.length < 2) {
      setError("Navn må være minst 2 tegn");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ugyldig e-postadresse");
      return;
    }
    if (phone && !/^[\d\s+()-]{8,}$/.test(phone)) {
      setError("Ugyldig telefonnummer (minst 8 siffer)");
      return;
    }

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">Fullt navn *</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name || ""}
          required
          className="bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={profile.email || ""}
          placeholder="din@epost.no"
          className="bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone || ""}
          placeholder="+47 900 00 000"
          className="bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="space-y-2">
        <Label>Rolle</Label>
        <div className="px-4 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-400">
          {profile.role === "styreleder" ? "Styreleder" :
           profile.role === "styremedlem" ? "Styremedlem" :
           profile.role === "varamedlem" ? "Varamedlem" :
           profile.role === "vaktmester" ? "Vaktmester" :
           profile.role === "beboer" ? "Beboer" : profile.role}
          <span className="text-zinc-600 ml-2">· Kan ikke endres her</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Profilen er oppdatert
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-violet-600 hover:bg-violet-500 text-white"
      >
        {isPending ? "Lagrer..." : "Lagre endringer"}
      </Button>
    </form>
  );
}
