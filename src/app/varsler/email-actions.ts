"use server";

import { getAuthContext } from "@/lib/auth";
import { sendEmail, buildDigestEmail, buildAlertEmail, type AlertItem } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Analyze tenant data and send a digest email to all board members.
 * Can be triggered manually from the UI or via a cron job.
 */
export async function sendDigestEmail() {
  const { supabase, tenantId, userId, tenantName } = await getAuthContext();

  // Gather data
  const [deviationsRes, invoicesRes, controlsRes, maintenanceRes, insuranceRes, casesRes, meetingRes] = await Promise.all([
    supabase.from("hms_deviations").select("id, title, severity, due_date").eq("tenant_id", tenantId).neq("status", "resolved"),
    supabase.from("invoices").select("id, vendor, amount, due_date, status").eq("tenant_id", tenantId).eq("status", "pending"),
    supabase.from("hms_controls").select("id, title, next_due_date").eq("tenant_id", tenantId),
    supabase.from("maintenance_items").select("id, building_part, next_maintenance_at, condition").eq("tenant_id", tenantId),
    supabase.from("insurance_policies").select("id, provider, type, valid_to").eq("tenant_id", tenantId).eq("status", "aktiv"),
    supabase.from("board_cases").select("id, status").eq("tenant_id", tenantId).neq("status", "arkivert"),
    supabase.from("board_meetings").select("id, title, date").eq("tenant_id", tenantId).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(1),
  ]);

  const deviations = deviationsRes.data || [];
  const invoices = invoicesRes.data || [];
  const controls = controlsRes.data || [];
  const maintenance = maintenanceRes.data || [];
  const insurance = insuranceRes.data || [];
  const cases = casesRes.data || [];

  // Build alerts
  const alerts: AlertItem[] = [];

  // Critical/high HMS deviations
  const criticalDevs = deviations.filter(d => d.severity === "kritisk" || d.severity === "hoy");
  criticalDevs.forEach(d => {
    const daysLeft = d.due_date ? Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000) : null;
    alerts.push({
      type: "critical",
      title: d.title,
      detail: daysLeft !== null
        ? (daysLeft < 0 ? `${Math.abs(daysLeft)} dager over frist` : `Frist om ${daysLeft} dager`)
        : "Ingen frist satt",
    });
  });

  // Overdue HMS controls
  const overdueControls = controls.filter(c => c.next_due_date && new Date(c.next_due_date) < new Date());
  if (overdueControls.length > 0) {
    alerts.push({
      type: "warning",
      title: `${overdueControls.length} HMS-kontroll${overdueControls.length > 1 ? "er" : ""} forfalt`,
      detail: "Gjennomfør kontroller for å oppfylle internkontrollkravene",
    });
  }

  // Overdue invoices
  const overdueInvoices = invoices.filter(i => i.due_date && new Date(i.due_date) < new Date());
  if (overdueInvoices.length > 0) {
    const total = overdueInvoices.reduce((s, i) => s + Number(i.amount), 0);
    alerts.push({
      type: "warning",
      title: `${overdueInvoices.length} faktura${overdueInvoices.length > 1 ? "er" : ""} forfalt`,
      detail: `${total.toLocaleString("no-NO")} kr — behandle snarest for å unngå purregebyr`,
    });
  }

  // Expiring insurance (within 30 days)
  const thirtyDays = Date.now() + 30 * 86400000;
  const expiringPolicies = insurance.filter(p => new Date(p.valid_to) < new Date(thirtyDays));
  expiringPolicies.forEach(p => {
    const daysLeft = Math.ceil((new Date(p.valid_to).getTime() - Date.now()) / 86400000);
    alerts.push({
      type: daysLeft <= 7 ? "critical" : "warning",
      title: `Forsikring utløper: ${p.provider} (${p.type})`,
      detail: daysLeft <= 0 ? "Utløpt!" : `Utløper om ${daysLeft} dager`,
    });
  });

  // Critical maintenance condition
  const criticalMaint = maintenance.filter(m => m.condition === "kritisk");
  if (criticalMaint.length > 0) {
    alerts.push({
      type: "warning",
      title: `${criticalMaint.length} bygningsdel${criticalMaint.length > 1 ? "er" : ""} i kritisk tilstand`,
      detail: criticalMaint.map(m => m.building_part).join(", "),
    });
  }

  // Build summary
  const activeCases = cases.filter(c => c.status !== "arkivert");
  const nextMeeting = meetingRes.data?.[0];
  const summary = [
    { label: "Åpne avvik", value: String(deviations.length), color: deviations.length > 0 ? "#fbbf24" : "#4ade80" },
    { label: "Ventende fakturaer", value: String(invoices.length), color: invoices.length > 0 ? "#fbbf24" : "#4ade80" },
    { label: "Aktive saker", value: String(activeCases.length), color: "#60a5fa" },
    { label: "Forsikringer", value: String(insurance.length), color: "#4ade80" },
  ];

  const html = buildDigestEmail(summary, alerts, tenantName);

  // Get recipients (board members with email)
  const { data: members } = await supabase
    .from("profiles")
    .select("email")
    .eq("tenant_id", tenantId)
    .in("role", ["styreleder", "styremedlem", "varamedlem"])
    .not("email", "is", null);

  const recipients = (members || []).map(m => m.email!).filter(Boolean);

  const today = new Date().toLocaleDateString("no-NO", { day: "numeric", month: "long" });
  const subject = alerts.length > 0
    ? `⚠️ ${alerts.length} varsler krever handling — ${tenantName}`
    : `✅ Daglig oppsummering — ${tenantName} — ${today}`;

  const result = await sendEmail(recipients, subject, html);

  await logAudit(supabase, tenantId, userId, "digest_email_sent", "email", null, {
    recipients: recipients.length,
    alerts: alerts.length,
    error: result.error || null,
  });

  revalidatePath("/varsler");
  return { ...result, recipients: recipients.length, alerts: alerts.length };
}

/**
 * Send an instant alert email for a single critical event.
 */
export async function sendInstantAlert(alertTitle: string, alertDetail: string, alertType: "critical" | "warning" = "critical") {
  const { supabase, tenantId, userId, tenantName } = await getAuthContext();

  const alerts: AlertItem[] = [{ type: alertType, title: alertTitle, detail: alertDetail }];
  const html = buildAlertEmail(alerts, tenantName);

  const { data: members } = await supabase
    .from("profiles")
    .select("email")
    .eq("tenant_id", tenantId)
    .in("role", ["styreleder", "styremedlem", "varamedlem"])
    .not("email", "is", null);

  const recipients = (members || []).map(m => m.email!).filter(Boolean);
  const subject = `🔴 ${alertTitle} — ${tenantName}`;

  const result = await sendEmail(recipients, subject, html);

  await logAudit(supabase, tenantId, userId, "instant_alert_sent", "email", null, {
    title: alertTitle,
    recipients: recipients.length,
  });

  return { ...result, recipients: recipients.length };
}
