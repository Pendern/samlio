"use server";

import { getAuthContext } from "@/lib/auth";
import { analyzeAndGenerateSuggestions } from "@/lib/ai/engine";
import { getAiProvider } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function generateSuggestions() {
  const { supabase, tenantId, profileId } = await getAuthContext();

  const result = await analyzeAndGenerateSuggestions(supabase, tenantId, profileId);

  revalidatePath("/");
  return { inserted: result.inserted };
}

export async function updateSuggestionStatus(
  suggestionId: string,
  status: "accepted" | "rejected" | "deferred",
) {
  const { supabase, userId } = await getAuthContext();

  const { error } = await supabase
    .from("ai_suggestions")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    })
    .eq("id", suggestionId);

  if (error) return { error: error.message };

  revalidatePath("/");
  return {};
}

export async function chatWithAi(messages: { role: "user" | "assistant"; content: string }[]) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    // Gather context for the chat
    const [deviationsRes, invoicesRes, maintenanceRes, insuranceRes, casesRes, suppliersRes, bookingsRes] = await Promise.all([
      supabase.from("hms_deviations").select("id").eq("tenant_id", tenantId).neq("status", "resolved"),
      supabase.from("invoices").select("id").eq("tenant_id", tenantId).eq("status", "pending"),
      supabase.from("maintenance_items").select("id, next_maintenance_at").eq("tenant_id", tenantId),
      supabase.from("insurance_policies").select("id, valid_to, status").eq("tenant_id", tenantId).eq("status", "aktiv"),
      supabase.from("board_cases").select("id, status").eq("tenant_id", tenantId).in("status", ["ny", "under_behandling"]),
      supabase.from("suppliers").select("id").eq("tenant_id", tenantId),
      supabase.from("bookings").select("id, date, status").eq("tenant_id", tenantId).eq("status", "bekreftet").gte("date", new Date().toISOString().split("T")[0]),
    ]);

    const thisYear = (maintenanceRes.data || []).filter(
      (m: any) => m.next_maintenance_at && new Date(m.next_maintenance_at).getFullYear() === new Date().getFullYear()
    );

    const sixtyDays = Date.now() + 60 * 24 * 60 * 60 * 1000;
    const expiringPolicies = (insuranceRes.data || []).filter(
      (p: any) => new Date(p.valid_to) < new Date(sixtyDays)
    );

    const context = {
      openDeviations: deviationsRes.data?.length || 0,
      pendingInvoices: invoicesRes.data?.length || 0,
      maintenanceThisYear: thisYear.length,
      expiringPolicies: expiringPolicies.length,
      openCases: casesRes.data?.length || 0,
      totalSuppliers: suppliersRes.data?.length || 0,
      upcomingBookings: bookingsRes.data?.length || 0,
    };

    const provider = getAiProvider();
    const response = await provider.chat(messages, context);

    return { response };
  } catch {
    return { response: "Beklager, noe gikk galt. Prøv igjen." };
  }
}
