// ── Status, severity and condition configs ─────────────────────
// Single source of truth — used by all pages and components

export const caseStatusConfig: Record<string, { label: string; color: string }> = {
  ny: { label: "Ny", color: "bg-blue-500/20 text-blue-400" },
  under_behandling: { label: "Under behandling", color: "bg-amber-500/20 text-amber-400" },
  vedtatt: { label: "Vedtatt", color: "bg-emerald-500/20 text-emerald-400" },
  avvist: { label: "Avvist", color: "bg-red-500/20 text-red-400" },
  utsatt: { label: "Utsatt", color: "bg-zinc-500/20 text-zinc-400" },
  arkivert: { label: "Arkivert", color: "bg-zinc-500/20 text-zinc-500" },
};

export const severityConfig: Record<string, { label: string; color: string }> = {
  lav: { label: "Lav", color: "bg-emerald-500/20 text-emerald-400" },
  middels: { label: "Middels", color: "bg-amber-500/20 text-amber-400" },
  hoy: { label: "Høy", color: "bg-red-500/20 text-red-400" },
  kritisk: { label: "Kritisk", color: "bg-red-600/30 text-red-300" },
};

export const taskStatusConfig: Record<string, { label: string; color: string }> = {
  ny: { label: "Ny", color: "bg-blue-500/20 text-blue-400" },
  pagar: { label: "Pågår", color: "bg-amber-500/20 text-amber-400" },
  ferdig: { label: "Ferdig", color: "bg-emerald-500/20 text-emerald-400" },
};

export const conditionConfig: Record<string, { label: string; color: string; bg: string }> = {
  god: { label: "God", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  akseptabel: { label: "Akseptabel", color: "text-amber-400", bg: "bg-amber-500/20" },
  darlig: { label: "Dårlig", color: "text-red-400", bg: "bg-red-500/20" },
  kritisk: { label: "Kritisk", color: "text-red-300", bg: "bg-red-600/30" },
};

export const meetingTypeLabels: Record<string, string> = {
  styremote: "Styremøte",
  arsmote: "Årsmøte",
  ekstraordinart: "Ekstraordinært",
};

export const roleLabels: Record<string, string> = {
  styreleder: "Styreleder",
  styremedlem: "Styremedlem",
  varamedlem: "Varamedlem",
  vaktmester: "Vaktmester",
  beboer: "Beboer",
  ekstern: "Ekstern",
};

// ── Formatting helpers ─────────────────────────────────────────

export function formatDate(date: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("no-NO", options || { day: "numeric", month: "short", year: "numeric" });
}

export function formatCost(amount: number | null): string {
  if (!amount) return "—";
  return `${Number(amount).toLocaleString("no-NO")} kr`;
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "God morgen" : hour < 17 ? "God dag" : "God kveld";
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}
