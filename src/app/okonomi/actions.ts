"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveInvoice(invoiceId: string, comment?: string) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "approved",
      approved_by: profileId,
      approved_at: new Date().toISOString(),
      comment: comment || null,
    })
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  revalidatePath("/okonomi");
  return { success: true };
}

export async function rejectInvoice(invoiceId: string, comment: string) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "rejected",
      approved_by: profileId,
      approved_at: new Date().toISOString(),
      comment: comment || "Avvist",
    })
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  revalidatePath("/okonomi");
  return { success: true };
}

export async function createExpense(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const description = (formData.get("description") as string)?.trim();
  const amount = formData.get("amount") as string;

  if (!description || description.length < 3) return { error: "Beskrivelse er påkrevd" };
  if (!amount || isNaN(parseFloat(amount))) return { error: "Ugyldig beløp" };

  const { error } = await supabase.from("expenses").insert({
    tenant_id: tenantId,
    submitted_by: profileId,
    description,
    amount: parseFloat(amount),
  });

  if (error) return { error: error.message };
  revalidatePath("/okonomi");
  return { success: true };
}
