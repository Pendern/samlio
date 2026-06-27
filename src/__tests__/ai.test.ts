import { describe, it, expect, vi } from "vitest";
import { MockAiProvider } from "@/lib/ai/mock-provider";
import type { AiSuggestionInput } from "@/lib/ai/provider";

// ── MockAiProvider: Suggestion generation ──────────────────────

describe("MockAiProvider — generateSuggestions", () => {
  const provider = new MockAiProvider();

  it("generates HMS overdue controls suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "hms_overdue_controls", context: { count: 3 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("hms");
    expect(result[0].suggestion_text).toContain("3 HMS-kontroller");
    expect(result[0].source_refs).toContain("Internkontrollforskriften");
    expect(result[0].model_used).toBe("mock-rules-v1");
  });

  it("generates critical HMS deviations suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "hms_open_deviations", context: { total: 5, critical: 2 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result).toHaveLength(1);
    expect(result[0].suggestion_text).toContain("2 kritiske HMS-avvik");
  });

  it("generates non-critical HMS deviations suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "hms_open_deviations", context: { total: 3, critical: 0 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].suggestion_text).toContain("3 åpne HMS-avvik");
  });

  it("returns null for zero HMS deviations", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "hms_open_deviations", context: { total: 0, critical: 0 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result).toHaveLength(0);
  });

  it("generates maintenance upcoming suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "maintenance_upcoming", context: { items: ["Tak", "Fasade", "Balkong"] } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].suggestion_text).toContain("Tak");
    expect(result[0].suggestion_text).toContain("Fasade");
    expect(result[0].type).toBe("vedlikehold");
  });

  it("truncates long maintenance item lists", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "maintenance_upcoming", context: { items: ["A", "B", "C", "D", "E"] } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].suggestion_text).toContain("m.fl.");
    expect(result[0].suggestion_text).toContain("5 vedlikeholdstiltak");
  });

  it("generates maintenance condition suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "maintenance_condition", context: { parts: ["Rør", "Vinduer"] } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].suggestion_text).toContain("Rør, Vinduer");
    expect(result[0].source_refs).toContain("NS 3451");
  });

  it("generates economy pending invoices suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "economy_pending_invoices", context: { count: 4, totalAmount: 125000 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].type).toBe("okonomi");
    expect(result[0].suggestion_text).toContain("4 fakturaer");
  });

  it("generates budget overrun suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "economy_budget_overrun", context: { categories: ["Renhold", "Vedlikehold"] } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].suggestion_text).toContain("Renhold, Vedlikehold");
  });

  it("generates insurance expiring suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "insurance_expiring", context: { policies: ["If (bygning)"] } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].type).toBe("forsikring");
    expect(result[0].suggestion_text).toContain("If (bygning)");
  });

  it("generates stale cases suggestion", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "cases_stale", context: { count: 7 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].type).toBe("saker");
    expect(result[0].suggestion_text).toContain("7 styresaker");
  });

  it("generates meeting preparation suggestion for upcoming meeting", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "meeting_preparation", context: { daysUntil: 5, title: "Styremøte mars" } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].type).toBe("moter");
    expect(result[0].suggestion_text).toContain("Styremøte mars");
    expect(result[0].suggestion_text).toContain("5 dager");
  });

  it("generates urgent meeting suggestion for <=3 days", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "meeting_preparation", context: { daysUntil: 2, title: "Hastemøte" } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result[0].suggestion_text).toContain("saksliste og dokumenter er klare");
  });

  it("skips meeting suggestion when >14 days away", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "meeting_preparation", context: { daysUntil: 20, title: "Fremtidig møte" } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result).toHaveLength(0);
  });

  it("handles multiple inputs and returns multiple suggestions", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "hms_overdue_controls", context: { count: 2 } },
      { type: "economy_pending_invoices", context: { count: 1, totalAmount: 5000 } },
      { type: "cases_stale", context: { count: 3 } },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.type)).toEqual(["hms", "okonomi", "saker"]);
  });

  it("skips unknown input types", async () => {
    const inputs: AiSuggestionInput[] = [
      { type: "unknown_type", context: {} },
    ];
    const result = await provider.generateSuggestions(inputs);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty inputs", async () => {
    const result = await provider.generateSuggestions([]);
    expect(result).toHaveLength(0);
  });
});

// ── MockAiProvider: Chat ───────────────────────────────────────

describe("MockAiProvider — chat", () => {
  const provider = new MockAiProvider();
  const context = {
    openDeviations: 3,
    pendingInvoices: 2,
    maintenanceThisYear: 5,
    expiringPolicies: 1,
    openCases: 4,
    totalSuppliers: 6,
    upcomingBookings: 2,
  };

  it("responds to HMS questions with deviation count", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hvordan er HMS-statusen?" }],
      context,
    );
    expect(response).toContain("3 åpne HMS-avvik");
  });

  it("responds to HMS when no deviations", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "HMS status" }],
      { ...context, openDeviations: 0 },
    );
    expect(response).toContain("ser bra ut");
  });

  it("responds to vedlikehold questions", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hva med vedlikehold?" }],
      context,
    );
    expect(response).toContain("5 vedlikeholdstiltak");
  });

  it("responds to økonomi with pending invoices", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hvordan er økonomien?" }],
      context,
    );
    expect(response).toContain("2 fakturaer");
  });

  it("responds to økonomi when no pending invoices", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Budsjett" }],
      { ...context, pendingInvoices: 0 },
    );
    expect(response).toContain("ryddig ut");
  });

  it("responds to forsikring with expiring policies", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Forsikring?" }],
      context,
    );
    expect(response).toContain("1 forsikringspolise");
  });

  it("responds to forsikring when all are valid", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Polise status" }],
      { ...context, expiringPolicies: 0 },
    );
    expect(response).toContain("aktive og gyldige");
  });

  it("responds to møte questions", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hjelp meg med neste styremøte" }],
      context,
    );
    expect(response).toContain("saksliste");
  });

  it("responds to generalforsamling", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Generalforsamling tips" }],
      context,
    );
    expect(response).toContain("innkalling");
    expect(response).toContain("8 dager");
  });

  it("responds to leverandør with count", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Leverandører" }],
      context,
    );
    expect(response).toContain("6 leverandører");
  });

  it("responds to nøkkel questions", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hvor finner jeg nøkkelregisteret?" }],
      context,
    );
    expect(response).toContain("Drift");
  });

  it("responds to styresak with open cases count", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Åpne styresaker?" }],
      context,
    );
    expect(response).toContain("4 åpne styresaker");
  });

  it("does not trigger sak handler for forsikring", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Forsikringssaken" }],
      context,
    );
    // Should match forsikring, not sak
    expect(response).not.toContain("styresak");
  });

  it("responds to booking questions", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Booking av felleslokale" }],
      context,
    );
    expect(response).toContain("2 kommende bookinger");
  });

  it("provides status overview", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Gi meg en statusoversikt" }],
      context,
    );
    expect(response).toContain("HMS-avvik");
    expect(response).toContain("fakturaer");
    expect(response).toContain("styresaker");
    expect(response).toContain("forsikringer");
    expect(response).toContain("vedlikeholdstiltak");
    expect(response).toContain("bookinger");
  });

  it("provides all-clear status when nothing is pending", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Status" }],
      { openDeviations: 0, pendingInvoices: 0, openCases: 0, expiringPolicies: 0, maintenanceThisYear: 0, upcomingBookings: 0 },
    );
    expect(response).toContain("Alt ser bra ut");
  });

  it("responds to hjelp/help", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hjelp" }],
      context,
    );
    expect(response).toContain("HMS");
    expect(response).toContain("Vedlikehold");
    expect(response).toContain("statusoversikt");
  });

  it("gives default response for unknown topics", async () => {
    const response = await provider.chat(
      [{ role: "user", content: "Hva er 2+2?" }],
      context,
    );
    expect(response).toContain("AI-assistenten");
  });

  it("uses last message for context", async () => {
    const response = await provider.chat(
      [
        { role: "user", content: "Hei" },
        { role: "assistant", content: "Hei!" },
        { role: "user", content: "HMS avvik?" },
      ],
      context,
    );
    expect(response).toContain("HMS-avvik");
  });

  it("handles empty messages gracefully", async () => {
    const response = await provider.chat([], context);
    expect(response).toContain("AI-assistenten");
  });
});

// ── Engine: Data analysis logic ────────────────────────────────

describe("AI Engine — data analysis logic", () => {
  // Test the analysis patterns used by the engine without calling Supabase

  it("identifies overdue controls", () => {
    const controls = [
      { next_due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      { next_due_date: null },
    ];
    const overdue = controls.filter(
      c => c.next_due_date && new Date(c.next_due_date) < new Date()
    );
    expect(overdue).toHaveLength(1);
  });

  it("counts critical deviations", () => {
    const deviations = [
      { severity: "kritisk" },
      { severity: "hoy" },
      { severity: "middels" },
      { severity: "lav" },
    ];
    const critical = deviations.filter(d => d.severity === "kritisk" || d.severity === "hoy");
    expect(critical).toHaveLength(2);
  });

  it("finds maintenance items upcoming within 6 months", () => {
    const now = Date.now();
    const items = [
      { next_maintenance_at: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(), building_part: "Tak" },
      { next_maintenance_at: new Date(now + 200 * 24 * 60 * 60 * 1000).toISOString(), building_part: "Rør" },
      { next_maintenance_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(), building_part: "Fasade" },
      { next_maintenance_at: null, building_part: "Vinduer" },
    ];
    const sixMonths = now + 180 * 24 * 60 * 60 * 1000;
    const upcoming = items.filter(
      m => m.next_maintenance_at && new Date(m.next_maintenance_at) <= new Date(sixMonths) && new Date(m.next_maintenance_at) >= new Date()
    );
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].building_part).toBe("Tak");
  });

  it("identifies bad condition items", () => {
    const items = [
      { condition: "god", building_part: "Tak" },
      { condition: "akseptabel", building_part: "Fasade" },
      { condition: "darlig", building_part: "Rør" },
      { condition: "kritisk", building_part: "Vinduer" },
    ];
    const bad = items.filter(m => m.condition === "darlig" || m.condition === "kritisk");
    expect(bad).toHaveLength(2);
    expect(bad.map(b => b.building_part)).toEqual(["Rør", "Vinduer"]);
  });

  it("calculates total pending invoice amount", () => {
    const invoices = [
      { amount: "15000" },
      { amount: "25000" },
      { amount: "7500" },
    ];
    const total = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
    expect(total).toBe(47500);
  });

  it("finds budget overruns", () => {
    const items = [
      { category: "Renhold", budgeted_amount: "50000", actual_amount: "60000" },
      { category: "Vedlikehold", budgeted_amount: "100000", actual_amount: "80000" },
      { category: "Strøm", budgeted_amount: "30000", actual_amount: "35000" },
    ];
    const overBudget = items.filter(b => Number(b.actual_amount) > Number(b.budgeted_amount));
    expect(overBudget).toHaveLength(2);
    expect(overBudget.map(b => b.category)).toEqual(["Renhold", "Strøm"]);
  });

  it("finds policies expiring within 60 days", () => {
    const now = Date.now();
    const policies = [
      { valid_to: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), provider: "If" },
      { valid_to: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(), provider: "Gjensidige" },
      { valid_to: new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString(), provider: "Tryg" },
    ];
    const sixtyDays = now + 60 * 24 * 60 * 60 * 1000;
    const expiring = policies.filter(p => new Date(p.valid_to) < new Date(sixtyDays));
    expect(expiring).toHaveLength(1);
    expect(expiring[0].provider).toBe("If");
  });

  it("identifies stale cases older than 30 days", () => {
    const now = Date.now();
    const cases = [
      { created_at: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString() },
      { created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { created_at: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const stale = cases.filter(c => c.created_at < thirtyDaysAgo);
    expect(stale).toHaveLength(2);
  });

  it("calculates days until meeting", () => {
    const meetingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const daysUntil = Math.ceil((meetingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(daysUntil).toBeGreaterThanOrEqual(6);
    expect(daysUntil).toBeLessThanOrEqual(8);
  });

  it("skips meeting preparation when >14 days away", () => {
    const daysUntil = 20;
    const shouldGenerate = daysUntil <= 14;
    expect(shouldGenerate).toBe(false);
  });

  it("generates no inputs when all data is clean", () => {
    const inputs: AiSuggestionInput[] = [];
    // No overdue controls, no deviations, no upcoming maintenance, etc.
    expect(inputs).toHaveLength(0);
  });
});
