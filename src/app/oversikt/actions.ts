"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReportData {
  cases: { title: string; category: string; status: string }[];
  deviations: { title: string; area: string; severity: string; due: string }[];
  tasks: { title: string; assignee: string; status: string; due: string }[];
  maintenance: { part: string; condition: string; nextDate: string; cost: string }[];
}

export async function sendReportEmail(data: ReportData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, full_name, tenants(name)")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profil ikke funnet" };

  // Hent alle styremedlemmer med e-post
  const { data: members } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("tenant_id", profile.tenant_id)
    .in("role", ["styreleder", "styremedlem", "varamedlem"])
    .not("email", "is", null);

  const recipients = members?.filter(m => m.email) || [];

  if (recipients.length === 0) {
    return { error: "Ingen styremedlemmer med registrert e-post" };
  }

  const tenantName = (profile as any).tenants?.name || "Boligselskapet";
  const senderName = profile.full_name || "Styret";
  const today = new Date().toLocaleDateString("no-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = buildEmailHtml({
    tenantName,
    senderName,
    date: today,
    ...data,
  });

  try {
    const { error } = await resend.emails.send({
      from: `Samlio <rapport@samlio.no>`,
      to: recipients.map(r => r.email!),
      subject: `Styreoversikt — ${tenantName} — ${today}`,
      html,
    });

    if (error) {
      return { error: `Kunne ikke sende e-post: ${error.message}` };
    }

    return { success: true, recipientCount: recipients.length };
  } catch (e: any) {
    return { error: e.message || "E-postsending feilet" };
  }
}

function buildEmailHtml(data: {
  tenantName: string;
  senderName: string;
  date: string;
  cases: ReportData["cases"];
  deviations: ReportData["deviations"];
  tasks: ReportData["tasks"];
  maintenance: ReportData["maintenance"];
}) {
  const tableStyle = `style="width:100%;border-collapse:collapse;margin:16px 0"`;
  const thStyle = `style="text-align:left;padding:8px 12px;border-bottom:2px solid #3f3f46;color:#a1a1aa;font-size:12px;font-weight:600"`;
  const tdStyle = `style="padding:8px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:13px"`;

  function renderTable(headers: string[], rows: string[][]) {
    if (rows.length === 0) return `<p style="color:#71717a;font-size:13px">Ingen data</p>`;
    return `
      <table ${tableStyle}>
        <thead><tr>${headers.map(h => `<th ${thStyle}>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td ${tdStyle}>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <body style="background:#09090b;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:640px;margin:0 auto;padding:32px 24px">
        <!-- Header -->
        <div style="margin-bottom:32px">
          <div style="display:inline-block;width:36px;height:36px;border-radius:8px;background:#7c3aed;color:white;font-weight:bold;font-size:14px;line-height:36px;text-align:center;margin-right:12px;vertical-align:middle">S</div>
          <span style="color:#fafafa;font-size:18px;font-weight:700;vertical-align:middle">Styreoversikt</span>
        </div>

        <p style="color:#a1a1aa;font-size:14px;margin:0 0 4px">${data.tenantName}</p>
        <p style="color:#71717a;font-size:13px;margin:0 0 24px">Sendt av ${data.senderName} · ${data.date}</p>

        <!-- Saker -->
        <h2 style="color:#fafafa;font-size:15px;font-weight:600;margin:24px 0 4px;border-bottom:1px solid #27272a;padding-bottom:8px">Styresaker (${data.cases.length})</h2>
        ${renderTable(["Tittel", "Kategori", "Status"], data.cases.map(c => [c.title, c.category, c.status]))}

        <!-- HMS -->
        <h2 style="color:#fafafa;font-size:15px;font-weight:600;margin:24px 0 4px;border-bottom:1px solid #27272a;padding-bottom:8px">HMS-avvik (${data.deviations.length})</h2>
        ${renderTable(["Tittel", "Område", "Alvorlighet", "Frist"], data.deviations.map(d => [d.title, d.area, d.severity, d.due]))}

        <!-- Oppgaver -->
        <h2 style="color:#fafafa;font-size:15px;font-weight:600;margin:24px 0 4px;border-bottom:1px solid #27272a;padding-bottom:8px">Oppgaver (${data.tasks.length})</h2>
        ${renderTable(["Tittel", "Ansvarlig", "Status", "Frist"], data.tasks.map(t => [t.title, t.assignee, t.status, t.due]))}

        <!-- Vedlikehold -->
        <h2 style="color:#fafafa;font-size:15px;font-weight:600;margin:24px 0 4px;border-bottom:1px solid #27272a;padding-bottom:8px">Vedlikehold (${data.maintenance.length})</h2>
        ${renderTable(["Bygningsdel", "Tilstand", "Neste", "Kostnad"], data.maintenance.map(m => [m.part, m.condition, m.nextDate, m.cost]))}

        <!-- Footer -->
        <div style="margin-top:40px;padding-top:16px;border-top:1px solid #27272a;text-align:center">
          <p style="color:#52525b;font-size:11px;margin:0">Sendt fra Samlio — AI-drevet styreportal for sameier</p>
          <p style="color:#52525b;font-size:11px;margin:4px 0 0">samlio.no</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
