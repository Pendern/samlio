"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createMaintenanceItem(formData: FormData) {
  const { supabase, tenantId } = await getAuthContext();

  const buildingPart = (formData.get("building_part") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const condition = formData.get("condition") as string;
  const lifetimeYears = formData.get("expected_lifetime_years") as string;
  const lastMaintained = formData.get("last_maintained_at") as string;
  const nextMaintenance = formData.get("next_maintenance_at") as string;
  const estimatedCost = formData.get("estimated_cost") as string;

  if (!buildingPart || buildingPart.length < 2) return { error: "Bygningsdel er påkrevd" };
  if (!description || description.length < 3) return { error: "Beskrivelse er påkrevd" };

  const { error } = await supabase.from("maintenance_items").insert({
    tenant_id: tenantId,
    building_part: buildingPart,
    description,
    condition: condition || "god",
    expected_lifetime_years: lifetimeYears ? parseInt(lifetimeYears) : null,
    last_maintained_at: lastMaintained || null,
    next_maintenance_at: nextMaintenance || null,
    estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
  });

  if (error) return { error: "Kunne ikke opprette: " + error.message };
  revalidatePath("/vedlikehold");
  revalidatePath("/");
  return { success: true };
}

export async function createTask(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const dueDate = formData.get("due_date") as string;

  if (!title || title.length < 3) return { error: "Tittel må være minst 3 tegn" };

  const { error } = await supabase.from("tasks").insert({
    tenant_id: tenantId,
    title,
    description: description || null,
    status: "ny",
    due_date: dueDate || null,
    created_by: profileId,
    assigned_to: profileId,
  });

  if (error) return { error: "Kunne ikke opprette oppgave: " + error.message };
  revalidatePath("/vedlikehold");
  revalidatePath("/oppgaver");
  revalidatePath("/");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const { supabase, tenantId } = await getAuthContext();

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  revalidatePath("/vedlikehold");
  revalidatePath("/oppgaver");
  revalidatePath("/");
  return { success: true };
}
