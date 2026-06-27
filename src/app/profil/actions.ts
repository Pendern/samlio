"use server";

import { getAuthContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const { supabase, tenantId, userId } = await getAuthContext();

  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!fullName || fullName.length < 2) {
    return { error: "Navn må være minst 2 tegn" };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ugyldig e-postadresse" };
  }

  if (phone && !/^[\d\s+()-]{8,}$/.test(phone)) {
    return { error: "Ugyldig telefonnummer" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      email: email || null,
    })
    .eq("user_id", userId);

  if (error) {
    return { error: "Kunne ikke oppdatere profil: " + error.message };
  }

  await logAudit(supabase, tenantId, userId, "profile_updated", "profile");

  revalidatePath("/profil");
  revalidatePath("/");
  return {};
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { supabase, tenantId, userId } = await getAuthContext();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Passordet må være minst 8 tegn" };
  }

  // Verify current password by re-authenticating
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Kunne ikke hente brukerinfo" };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Nåværende passord er feil" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: "Kunne ikke endre passord: " + error.message };
  }

  await logAudit(supabase, tenantId, userId, "password_changed", "auth");

  return {};
}
