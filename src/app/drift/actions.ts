"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSupplier(formData: FormData) {
  const { supabase, tenantId } = await getAuthContext();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Navn er påkrevd" };

  const { error } = await supabase.from("suppliers").insert({
    tenant_id: tenantId,
    name,
    category: (formData.get("category") as string) || "generelt",
    contact_person: (formData.get("contact_person") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    org_nr: (formData.get("org_nr") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
  });

  if (error) return { error: "Kunne ikke opprette leverandør: " + error.message };

  revalidatePath("/drift");
  return {};
}

export async function createBooking(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const resourceId = formData.get("resource_id") as string;
  const date = formData.get("date") as string;
  const timeFrom = formData.get("time_from") as string;
  const timeTo = formData.get("time_to") as string;

  if (!resourceId) return { error: "Velg en ressurs" };
  if (!date) return { error: "Dato er påkrevd" };
  if (!timeFrom || !timeTo) return { error: "Tid er påkrevd" };

  const { error } = await supabase.from("bookings").insert({
    tenant_id: tenantId,
    resource_id: resourceId,
    booked_by: profileId,
    date,
    time_from: timeFrom,
    time_to: timeTo,
    purpose: (formData.get("purpose") as string)?.trim() || null,
    status: "bekreftet",
  });

  if (error) return { error: "Kunne ikke opprette booking: " + error.message };

  revalidatePath("/drift");
  return {};
}

export async function cancelBooking(bookingId: string) {
  const { supabase } = await getAuthContext();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "kansellert" })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  revalidatePath("/drift");
  return {};
}
