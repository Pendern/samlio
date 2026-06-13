"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await getAuthContext();

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

  revalidatePath("/profil");
  revalidatePath("/");
  return { success: true };
}
