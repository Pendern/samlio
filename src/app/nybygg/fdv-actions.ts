"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createFdvDocument(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = (formData.get("title") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const buildingPart = (formData.get("building_part") as string)?.trim();
  const maintenanceInterval = (formData.get("maintenance_interval") as string)?.trim();
  const nextMaintenanceDate = formData.get("next_maintenance_date") as string;
  const notes = (formData.get("notes") as string)?.trim();

  if (!title || title.length < 2) return { error: "Tittel er påkrevd" };
  if (!category) return { error: "Kategori er påkrevd" };

  // Håndter filopplasting
  const file = formData.get("file") as File | null;
  let fileUrl: string | null = null;
  let fileType: string | null = null;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() || "pdf";
    const path = `fdv/${tenantId}/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file);

    if (uploadError) {
      // Storage bucket might not exist yet — save without file
      console.error("Upload failed:", uploadError.message);
    } else {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
      fileType = ext;
    }
  }

  const { error } = await supabase.from("fdv_documents").insert({
    tenant_id: tenantId,
    title,
    category,
    building_part: buildingPart || null,
    file_url: fileUrl,
    file_type: fileType,
    maintenance_interval: maintenanceInterval || null,
    next_maintenance_date: nextMaintenanceDate || null,
    notes: notes || null,
    uploaded_by: profileId,
  });

  if (error) return { error: "Kunne ikke opprette: " + error.message };
  revalidatePath("/nybygg");
  return { success: true };
}
