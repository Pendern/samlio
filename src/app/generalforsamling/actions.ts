"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createAssembly(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = (formData.get("title") as string)?.trim();
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const location = (formData.get("location") as string)?.trim();

  if (!title || title.length < 3) return { error: "Tittel er påkrevd" };
  if (!date) return { error: "Dato er påkrevd" };

  const { error } = await supabase.from("assemblies").insert({
    tenant_id: tenantId,
    title,
    date,
    time: time || null,
    location: location || null,
    created_by: profileId,
  });

  if (error) return { error: error.message };
  revalidatePath("/generalforsamling");
  return { success: true };
}

export async function addAgendaItem(assemblyId: string, formData: FormData) {
  const { supabase } = await getAuthContext();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const itemType = (formData.get("item_type") as string) || "sak";
  const itemNumber = parseInt(formData.get("item_number") as string) || 1;

  if (!title) return { error: "Tittel er påkrevd" };

  const { error } = await supabase.from("assembly_items").insert({
    assembly_id: assemblyId,
    item_number: itemNumber,
    title,
    description: description || null,
    item_type: itemType,
    requires_vote: itemType !== "orientering",
  });

  if (error) return { error: error.message };
  revalidatePath("/generalforsamling");
  return { success: true };
}

export async function castVote(itemId: string, vote: string) {
  const { supabase, profileId } = await getAuthContext();

  // Upsert — oppdater hvis allerede stemt
  const { data: existing } = await supabase
    .from("assembly_votes")
    .select("id")
    .eq("assembly_item_id", itemId)
    .eq("profile_id", profileId)
    .single();

  if (existing) {
    await supabase.from("assembly_votes").update({ vote, voted_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("assembly_votes").insert({
      assembly_item_id: itemId,
      profile_id: profileId,
      vote,
    });
  }

  revalidatePath("/generalforsamling");
  return { success: true };
}

export async function updateAssemblyStatus(assemblyId: string, status: string) {
  const { supabase, tenantId } = await getAuthContext();

  await supabase.from("assemblies").update({ status }).eq("id", assemblyId).eq("tenant_id", tenantId);
  revalidatePath("/generalforsamling");
  return { success: true };
}
