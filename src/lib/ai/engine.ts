import { getAiProvider } from "./index";
import type { AiSuggestionInput } from "./provider";

/**
 * Analyze live tenant data and generate AI suggestion inputs.
 * This is the "brain" that decides what to analyze — the provider
 * then generates the actual suggestion text.
 */
export async function analyzeAndGenerateSuggestions(
  supabase: any,
  tenantId: string,
  profileId: string,
): Promise<{ inserted: number }> {
  const provider = getAiProvider();

  // Gather data for analysis
  const [
    controlsRes,
    deviationsRes,
    maintenanceRes,
    invoicesRes,
    budgetRes,
    insuranceRes,
    casesRes,
    meetingRes,
  ] = await Promise.all([
    supabase.from("hms_controls").select("id, next_due_date").eq("tenant_id", tenantId),
    supabase.from("hms_deviations").select("id, severity, status").eq("tenant_id", tenantId).neq("status", "resolved"),
    supabase.from("maintenance_items").select("id, building_part, condition, next_maintenance_at").eq("tenant_id", tenantId),
    supabase.from("invoices").select("id, amount, status").eq("tenant_id", tenantId).eq("status", "pending"),
    supabase.from("budget_items").select("id, category, budgeted_amount, actual_amount").eq("tenant_id", tenantId).eq("year", new Date().getFullYear()),
    supabase.from("insurance_policies").select("id, type, provider, valid_to, status").eq("tenant_id", tenantId).eq("status", "aktiv"),
    supabase.from("board_cases").select("id, status, created_at").eq("tenant_id", tenantId).in("status", ["ny", "under_behandling"]),
    supabase.from("board_meetings").select("id, title, date").eq("tenant_id", tenantId).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(1),
  ]);

  const inputs: AiSuggestionInput[] = [];

  // 1. HMS: overdue controls
  const overdueControls = (controlsRes.data || []).filter(
    (c: any) => c.next_due_date && new Date(c.next_due_date) < new Date()
  );
  if (overdueControls.length > 0) {
    inputs.push({ type: "hms_overdue_controls", context: { count: overdueControls.length } });
  }

  // 2. HMS: open deviations
  const deviations = deviationsRes.data || [];
  if (deviations.length > 0) {
    const critical = deviations.filter((d: any) => d.severity === "kritisk" || d.severity === "hoy").length;
    inputs.push({ type: "hms_open_deviations", context: { total: deviations.length, critical } });
  }

  // 3. Maintenance: upcoming in 6 months
  const sixMonths = Date.now() + 180 * 24 * 60 * 60 * 1000;
  const upcomingMaintenance = (maintenanceRes.data || []).filter(
    (m: any) => m.next_maintenance_at && new Date(m.next_maintenance_at) <= new Date(sixMonths) && new Date(m.next_maintenance_at) >= new Date()
  );
  if (upcomingMaintenance.length > 0) {
    inputs.push({
      type: "maintenance_upcoming",
      context: { items: upcomingMaintenance.map((m: any) => m.building_part) },
    });
  }

  // 4. Maintenance: bad condition
  const badCondition = (maintenanceRes.data || []).filter(
    (m: any) => m.condition === "darlig" || m.condition === "kritisk"
  );
  if (badCondition.length > 0) {
    inputs.push({
      type: "maintenance_condition",
      context: { parts: badCondition.map((m: any) => m.building_part) },
    });
  }

  // 5. Economy: pending invoices
  const pendingInvoices = invoicesRes.data || [];
  if (pendingInvoices.length > 0) {
    const totalAmount = pendingInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    inputs.push({ type: "economy_pending_invoices", context: { count: pendingInvoices.length, totalAmount } });
  }

  // 6. Economy: budget overruns
  const overBudget = (budgetRes.data || []).filter(
    (b: any) => Number(b.actual_amount) > Number(b.budgeted_amount)
  );
  if (overBudget.length > 0) {
    inputs.push({
      type: "economy_budget_overrun",
      context: { categories: overBudget.map((b: any) => b.category) },
    });
  }

  // 7. Insurance: expiring within 60 days
  const sixtyDays = Date.now() + 60 * 24 * 60 * 60 * 1000;
  const expiringPolicies = (insuranceRes.data || []).filter(
    (p: any) => new Date(p.valid_to) < new Date(sixtyDays)
  );
  if (expiringPolicies.length > 0) {
    inputs.push({
      type: "insurance_expiring",
      context: { policies: expiringPolicies.map((p: any) => `${p.provider} (${p.type})`) },
    });
  }

  // 8. Cases: stale (>30 days without resolution)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const staleCases = (casesRes.data || []).filter(
    (c: any) => c.created_at < thirtyDaysAgo
  );
  if (staleCases.length > 0) {
    inputs.push({ type: "cases_stale", context: { count: staleCases.length } });
  }

  // 9. Meeting: upcoming within 14 days
  const nextMeeting = meetingRes.data?.[0];
  if (nextMeeting) {
    const daysUntil = Math.ceil((new Date(nextMeeting.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 14) {
      inputs.push({
        type: "meeting_preparation",
        context: { daysUntil, title: nextMeeting.title },
      });
    }
  }

  // Generate suggestions from provider
  if (inputs.length === 0) return { inserted: 0 };

  const suggestions = await provider.generateSuggestions(inputs);

  // Clear old pending suggestions and insert new ones
  await supabase
    .from("ai_suggestions")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  const rows = suggestions.map(s => ({
    tenant_id: tenantId,
    type: s.type,
    suggestion_text: s.suggestion_text,
    source_refs: s.source_refs,
    context_json: s.context_json,
    model_used: s.model_used,
    status: "pending",
  }));

  const { error } = await supabase.from("ai_suggestions").insert(rows);
  if (error) throw new Error("Kunne ikke lagre forslag: " + error.message);

  return { inserted: rows.length };
}
