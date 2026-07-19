import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ── Base email layout ──────────────────────────────────────────

function emailLayout(title: string, content: string, tenantName: string): string {
  return `<!DOCTYPE html><html>
    <body style="background:#09090b;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:560px;margin:0 auto;padding:28px 20px">
        <div style="margin-bottom:20px">
          <div style="display:inline-block;width:32px;height:32px;border-radius:8px;background:#7c3aed;color:white;font-weight:bold;font-size:13px;line-height:32px;text-align:center;margin-right:10px;vertical-align:middle">S</div>
          <span style="color:#fafafa;font-size:16px;font-weight:700;vertical-align:middle">${title}</span>
        </div>
        <p style="color:#a1a1aa;font-size:12px;margin:0 0 20px">${tenantName}</p>
        ${content}
        <div style="margin-top:32px;padding-top:12px;border-top:1px solid #27272a;text-align:center">
          <a href="https://www.samlio.no" style="color:#7c3aed;font-size:11px;text-decoration:none">Åpne Samlio →</a>
          <p style="color:#52525b;font-size:10px;margin:8px 0 0">Samlio · samlio.no</p>
        </div>
      </div>
    </body></html>`;
}

function alertCard(color: string, bgColor: string, icon: string, title: string, detail: string): string {
  return `<div style="padding:12px 16px;margin:8px 0;border-radius:10px;background:${bgColor};border:1px solid ${color}">
    <p style="margin:0;color:#fafafa;font-size:13px;font-weight:600">${icon} ${title}</p>
    <p style="margin:4px 0 0;color:#a1a1aa;font-size:12px">${detail}</p>
  </div>`;
}

// ── Email templates ────────────────────────────────────────────

export interface AlertItem {
  type: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
}

export function buildAlertEmail(alerts: AlertItem[], tenantName: string): string {
  const cards = alerts.map(a => {
    const config = {
      critical: { color: "#7f1d1d", bg: "rgba(127,29,29,0.3)", icon: "🔴" },
      warning: { color: "#78350f", bg: "rgba(120,53,15,0.3)", icon: "🟡" },
      info: { color: "#1e3a5f", bg: "rgba(30,58,95,0.3)", icon: "🔵" },
    }[a.type];
    return alertCard(config.color, config.bg, config.icon, a.title, a.detail);
  }).join("");

  return emailLayout("Viktige varsler", cards, tenantName);
}

export function buildDigestEmail(
  summary: { label: string; value: string; color: string }[],
  alerts: AlertItem[],
  tenantName: string,
): string {
  const summaryHtml = summary.map(s =>
    `<div style="display:inline-block;text-align:center;padding:8px 16px;margin:4px">
      <p style="margin:0;color:${s.color};font-size:22px;font-weight:700">${s.value}</p>
      <p style="margin:2px 0 0;color:#71717a;font-size:10px">${s.label}</p>
    </div>`
  ).join("");

  const alertHtml = alerts.length > 0
    ? `<h2 style="color:#fca5a5;font-size:13px;font-weight:600;margin:20px 0 8px">Krever handling</h2>` +
      alerts.map(a => {
        const config = {
          critical: { color: "#7f1d1d", bg: "rgba(127,29,29,0.3)", icon: "🔴" },
          warning: { color: "#78350f", bg: "rgba(120,53,15,0.3)", icon: "🟡" },
          info: { color: "#1e3a5f", bg: "rgba(30,58,95,0.3)", icon: "🔵" },
        }[a.type];
        return alertCard(config.color, config.bg, config.icon, a.title, a.detail);
      }).join("")
    : `<p style="color:#4ade80;font-size:13px;margin:16px 0;padding:12px;background:rgba(4,47,15,0.3);border:1px solid rgba(34,197,94,0.3);border-radius:10px">✅ Alt ser bra ut — ingen kritiske hendelser</p>`;

  const content = `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
      ${summaryHtml}
    </div>
    ${alertHtml}
  `;

  return emailLayout("Daglig oppsummering", content, tenantName);
}

// ── Send email ─────────────────────────────────────────────────

export async function sendEmail(
  to: string[],
  subject: string,
  html: string,
): Promise<{ error?: string }> {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping:", subject);
    return { error: "E-posttjeneste ikke konfigurert (mangler RESEND_API_KEY)" };
  }

  if (to.length === 0) return { error: "Ingen mottakere" };

  try {
    const { error } = await resend.emails.send({
      from: "Samlio <noreply@samlio.no>",
      to,
      subject,
      html,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message || "E-postsending feilet" };
  }
}
