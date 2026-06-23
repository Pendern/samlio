"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createWarrantyClaim(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const buildingPart = (formData.get("building_part") as string)?.trim();
  const contractor = (formData.get("contractor") as string)?.trim();
  const claimType = formData.get("claim_type") as string;
  const deadline = formData.get("deadline") as string;
  const discoveredAt = formData.get("discovered_at") as string;

  if (!title || title.length < 3) return { error: "Tittel er paakrevd (minst 3 tegn)" };
  if (!deadline) return { error: "Frist er paakrevd" };

  const { error } = await supabase.from("warranty_claims").insert({
    tenant_id: tenantId,
    title,
    description: description || null,
    building_part: buildingPart || null,
    contractor: contractor || null,
    claim_type: claimType || "reklamasjon",
    deadline,
    discovered_at: discoveredAt || null,
    legal_basis: "Bustadsoppforingslova § 30",
    reported_by: profileId,
  });

  if (error) return { error: error.message };
  revalidatePath("/nybygg");
  return { success: true };
}

export async function updateClaimStatus(claimId: string, status: string, notes?: string) {
  const { supabase, tenantId } = await getAuthContext();

  const update: Record<string, unknown> = { status };
  if (status === "resolved") {
    update.resolved_at = new Date().toISOString();
    update.resolution_notes = notes || null;
  }

  const { error } = await supabase
    .from("warranty_claims")
    .update(update)
    .eq("id", claimId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  revalidatePath("/nybygg");
  return { success: true };
}
