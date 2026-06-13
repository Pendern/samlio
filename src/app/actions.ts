"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Styresaker ─────────────────────────────────────────────────

export async function createBoardCase(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  if (!title?.trim()) throw new Error("Tittel er påkrevd");

  const { error } = await supabase.from("board_cases").insert({
    tenant_id: tenantId,
    title: title.trim(),
    description: description?.trim() || null,
    category: category || null,
    status: "ny",
    created_by: profileId,
  });

  if (error) throw new Error("Kunne ikke opprette sak: " + error.message);

  revalidatePath("/saker");
  revalidatePath("/");
}

// ── HMS-avvik ──────────────────────────────────────────────────

export async function createHmsDeviation(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const areaId = formData.get("area_id") as string;
  const severity = formData.get("severity") as string;
  const dueDate = formData.get("due_date") as string;

  if (!title?.trim()) throw new Error("Tittel er påkrevd");
  if (!description?.trim()) throw new Error("Beskrivelse er påkrevd");
  if (!areaId) throw new Error("Velg et kontrollområde");

  const { error } = await supabase.from("hms_deviations").insert({
    tenant_id: tenantId,
    area_id: areaId,
    title: title.trim(),
    description: description.trim(),
    severity: severity || "middels",
    status: "open",
    reported_by: profileId,
    due_date: dueDate || null,
  });

  if (error) throw new Error("Kunne ikke opprette avvik: " + error.message);

  revalidatePath("/hms");
  revalidatePath("/");
}

// ── Logg ut ────────────────────────────────────────────────────

export async function signOut() {
  const { supabase } = await getAuthContext();
  await supabase.auth.signOut();
  redirect("/login");
}
