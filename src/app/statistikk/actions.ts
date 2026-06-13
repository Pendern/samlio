"use server";

import { getAuthContext } from "@/lib/auth";
import { Resend } from "resend";
import { severityConfig, taskStatusConfig, daysUntil } from "@/lib/config";

const resend = new Resend(process.env.RESEND_API_KEY);

interface StatData {
  kpis: { label: string; value: string }[];
  bySeverity: { label: string; open: number; total: number }[];
  byArea: { name: string; open: number; resolved: number }[];
  tasksByStatus: { ny: number; pagar: number; ferdig: number };
  completionRate: number;
  byPerson: { name: string; done: number; total: number; overdue: number }[];
  overdue: { type: string; label: string; days: number }[];
  nextMeetingTitle?: string;
  nextMeetingDate?: string;
}

export async function sendStatistikkEmail(data: StatData) {
  const { supabase, tenantId, fullName, tenantName } = await getAuthContext();

  const { data: members } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("tenant_id", tenantId)
    .in("role", ["styreleder", "styremedlem", "varamedlem"])
    .not("email", "is", null);

  const recipients = members?.filter(m => m.email) || [];
  if (recipients.length === 0) {
    return { error: "Ingen styremedlemmer med registrert e-post" };
  }

  const today = new Date().toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" });
  const senderName = fullName || "Styret";

  const s = (n: number) => `style="text-align:left;padding:6px 10px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:12px"`;
  const th = `style="text-align:left;padding:6px 10px;border-bottom:2px solid #3f3f46;color:#a1a1aa;font-size:11px;font-weight:600"`;

  function table(headers: string[], rows: string[][]) {
    return `<table style="width:100%;border-collapse:collapse;margin:12px 0">
      <thead><tr>${headers.map(h => `<th ${th}>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(c => `<td ${s(0)}>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
  }

  const meetingLine = data.nextMeetingTitle
    ? `<p style="color:#2dd4bf;font-size:13px;margin:0 0 16px;padding:10px;background:rgba(4,47,46,0.5);border:1px solid rgba(20,184,166,0.3);border-radius:8px">📅 Neste møte: <strong>${data.nextMeetingTitle}</strong>${data.nextMeetingDate ? ` — ${data.nextMeetingDate}` : ""}</p>`
    : "";

  const overdueSection = data.overdue.length > 0
    ? `<h2 style="color:#fca5a5;font-size:14px;font-weight:600;margin:20px 0 4px;border-bottom:1px solid #7f1d1d;padding-bottom:6px">⚠️ Forfalt — krever handling (${data.overdue.length})</h2>
       ${table(["Type", "Beskrivelse", "Dager over frist"], data.overdue.map(o => [o.type, o.label, `${o.days}d`]))}`
    : "";

  const html = `<!DOCTYPE html><html>
    <body style="background:#09090b;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:600px;margin:0 auto;padding:28px 20px">
        <div style="margin-bottom:24px">
          <div style="display:inline-block;width:32px;height:32px;border-radius:8px;background:#7c3aed;color:white;font-weight:bold;font-size:13px;line-height:32px;text-align:center;margin-right:10px;vertical-align:middle">S</div>
          <span style="color:#fafafa;font-size:16px;font-weight:700;vertical-align:middle">Statistikkrapport</span>
        </div>
        <p style="color:#a1a1aa;font-size:13px;margin:0 0 4px">${tenantName}</p>
        <p style="color:#71717a;font-size:12px;margin:0 0 20px">Sendt av ${senderName} · ${today}</p>
        ${meetingLine}
        <h2 style="color:#fafafa;font-size:14px;font-weight:600;margin:20px 0 4px;border-bottom:1px solid #27272a;padding-bottom:6px">Nøkkeltall</h2>
        ${table(data.kpis.map(k => k.label), [data.kpis.map(k => k.value)])}

        <h2 style="color:#fafafa;font-size:14px;font-weight:600;margin:20px 0 4px;border-bottom:1px solid #27272a;padding-bottom:6px">HMS-avvik per alvorlighetsgrad</h2>
        ${table(["Alvorlighet", "Åpne", "Totalt", "Løst"], data.bySeverity.map(s => [s.label, String(s.open), String(s.total), String(s.total - s.open)]))}

        ${data.byArea.length > 0 ? `
          <h2 style="color:#fafafa;font-size:14px;font-weight:600;margin:20px 0 4px;border-bottom:1px solid #27272a;padding-bottom:6px">HMS-avvik per område</h2>
          ${table(["Område", "Åpne", "Løst"], data.byArea.map(a => [a.name, String(a.open), String(a.resolved)]))}
        ` : ""}

        <h2 style="color:#fafafa;font-size:14px;font-weight:600;margin:20px 0 4px;border-bottom:1px solid #27272a;padding-bottom:6px">Oppgavestatus (${data.completionRate}% fullført)</h2>
        ${table(["Status", "Antall"], [["Ny", String(data.tasksByStatus.ny)], ["Pågår", String(data.tasksByStatus.pagar)], ["Ferdig", String(data.tasksByStatus.ferdig)]])}

        ${data.byPerson.length > 0 ? `
          <h2 style="color:#fafafa;font-size:14px;font-weight:600;margin:20px 0 4px;border-bottom:1px solid #27272a;padding-bottom:6px">Oppgaver per person</h2>
          ${table(["Navn", "Fullført", "Totalt", "Forfalt"], data.byPerson.map(p => [p.name, String(p.done), String(p.total), p.overdue > 0 ? String(p.overdue) : "—"]))}
        ` : ""}

        ${overdueSection}

        <div style="margin-top:32px;padding-top:12px;border-top:1px solid #27272a;text-align:center">
          <p style="color:#52525b;font-size:10px;margin:0">Sendt fra Samlio · samlio.no</p>
        </div>
      </div>
    </body></html>`;

  try {
    const subject = data.nextMeetingTitle
      ? `Statistikkrapport — Før ${data.nextMeetingTitle} — ${tenantName}`
      : `Statistikkrapport — ${tenantName} — ${today}`;

    const { error } = await resend.emails.send({
      from: `Samlio <rapport@samlio.no>`,
      to: recipients.map(r => r.email!),
      subject,
      html,
    });

    if (error) return { error: `Kunne ikke sende: ${error.message}` };
    return { success: true, recipientCount: recipients.length };
  } catch (e: any) {
    return { error: e.message || "E-postsending feilet" };
  }
}
