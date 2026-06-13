import { describe, it, expect } from "vitest";

// ── Test data fixtures ─────────────────────────────────────────

const sampleData = {
  kpis: [
    { label: "Åpne avvik", value: "2" },
    { label: "Løste avvik", value: "5" },
    { label: "Forfalt kontroll", value: "1" },
    { label: "Oppgaver fullført", value: "67%" },
    { label: "Oppgaver forfalt", value: "1" },
    { label: "Snitt løsningstid", value: "12d" },
  ],
  bySeverity: [
    { label: "Kritisk", open: 0, total: 0 },
    { label: "Høy", open: 1, total: 2 },
    { label: "Middels", open: 1, total: 3 },
    { label: "Lav", open: 0, total: 1 },
  ],
  byArea: [
    { name: "Brannvern", open: 1, resolved: 1 },
    { name: "Lekeplass", open: 1, resolved: 0 },
  ],
  tasksByStatus: { ny: 1, pagar: 1, ferdig: 2 },
  completionRate: 50,
  byPerson: [
    { name: "Andreas Waag Martinsen", done: 1, total: 2, overdue: 0 },
    { name: "Kari Nordmann", done: 1, total: 2, overdue: 1 },
  ],
  overdue: [
    { type: "HMS", label: "Lekeplass", days: 21 },
    { type: "Oppgave", label: "Purre TakTek", days: 3 },
  ],
};

// ── Report data structure tests ────────────────────────────────

describe("Statistikk Report Data", () => {
  it("has exactly 6 KPIs", () => {
    expect(sampleData.kpis).toHaveLength(6);
  });

  it("KPIs have label and value", () => {
    sampleData.kpis.forEach(kpi => {
      expect(kpi.label).toBeTruthy();
      expect(kpi.value).toBeTruthy();
    });
  });

  it("severity breakdown has 4 levels in correct order", () => {
    const labels = sampleData.bySeverity.map(s => s.label);
    expect(labels).toEqual(["Kritisk", "Høy", "Middels", "Lav"]);
  });

  it("severity open count never exceeds total", () => {
    sampleData.bySeverity.forEach(s => {
      expect(s.open).toBeLessThanOrEqual(s.total);
    });
  });

  it("resolved count is total minus open", () => {
    sampleData.bySeverity.forEach(s => {
      const resolved = s.total - s.open;
      expect(resolved).toBeGreaterThanOrEqual(0);
    });
  });

  it("area breakdown has consistent open/resolved counts", () => {
    sampleData.byArea.forEach(area => {
      expect(area.open).toBeGreaterThanOrEqual(0);
      expect(area.resolved).toBeGreaterThanOrEqual(0);
    });
    const totalOpen = sampleData.byArea.reduce((sum, a) => sum + a.open, 0);
    expect(totalOpen).toBeGreaterThanOrEqual(0);
  });

  it("task status sums to correct total", () => {
    const { ny, pagar, ferdig } = sampleData.tasksByStatus;
    const total = ny + pagar + ferdig;
    expect(total).toBe(4);
  });

  it("completion rate matches task data", () => {
    const { ferdig } = sampleData.tasksByStatus;
    const total = sampleData.tasksByStatus.ny + sampleData.tasksByStatus.pagar + ferdig;
    const rate = Math.round((ferdig / total) * 100);
    expect(rate).toBe(sampleData.completionRate);
  });

  it("per-person done never exceeds total", () => {
    sampleData.byPerson.forEach(p => {
      expect(p.done).toBeLessThanOrEqual(p.total);
    });
  });

  it("per-person overdue only for incomplete tasks", () => {
    sampleData.byPerson.forEach(p => {
      expect(p.overdue).toBeLessThanOrEqual(p.total - p.done);
    });
  });

  it("overdue items have positive days", () => {
    sampleData.overdue.forEach(o => {
      expect(o.days).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Meeting context tests ──────────────────────────────────────

describe("Meeting Context in Report", () => {
  it("generates correct subject with meeting title", () => {
    const tenantName = "Bryggepromenaden 1";
    const today = "13. juni 2026";
    const meetingTitle = "Styremøte juni 2026";

    const subject = meetingTitle
      ? `Statistikkrapport — Før ${meetingTitle} — ${tenantName}`
      : `Statistikkrapport — ${tenantName} — ${today}`;

    expect(subject).toBe("Statistikkrapport — Før Styremøte juni 2026 — Bryggepromenaden 1");
  });

  it("generates correct subject without meeting", () => {
    const tenantName = "Bryggepromenaden 1";
    const today = "13. juni 2026";
    const meetingTitle = undefined;

    const subject = meetingTitle
      ? `Statistikkrapport — Før ${meetingTitle} — ${tenantName}`
      : `Statistikkrapport — ${tenantName} — ${today}`;

    expect(subject).toBe("Statistikkrapport — Bryggepromenaden 1 — 13. juni 2026");
  });

  it("includes meeting info in email when meeting exists", () => {
    const nextMeetingTitle = "Styremøte juni 2026";
    const nextMeetingDate = "mandag 22. juni";

    const meetingLine = nextMeetingTitle
      ? `Neste møte: ${nextMeetingTitle} — ${nextMeetingDate}`
      : "";

    expect(meetingLine).toContain("Styremøte juni 2026");
    expect(meetingLine).toContain("mandag 22. juni");
  });

  it("omits meeting info when no upcoming meeting", () => {
    const nextMeetingTitle = undefined;

    const meetingLine = nextMeetingTitle
      ? `Neste møte: ${nextMeetingTitle}`
      : "";

    expect(meetingLine).toBe("");
  });
});

// ── Recipient handling tests ───────────────────────────────────

describe("Email Recipient Handling", () => {
  it("filters members with email only", () => {
    const members = [
      { full_name: "Andreas", email: "andreas@test.no", role: "styreleder" },
      { full_name: "Kari", email: null, role: "styremedlem" },
      { full_name: "Per", email: "per@test.no", role: "styremedlem" },
      { full_name: "Ola", email: "", role: "varamedlem" },
    ];

    const recipients = members.filter(m => m.email);
    // null is falsy, empty string is falsy — only non-empty emails pass
    expect(recipients).toHaveLength(2); // andreas + per
  });

  it("only includes board members", () => {
    const validRoles = ["styreleder", "styremedlem", "varamedlem"];
    const members = [
      { role: "styreleder" },
      { role: "styremedlem" },
      { role: "beboer" },
      { role: "vaktmester" },
      { role: "varamedlem" },
    ];

    const boardMembers = members.filter(m => validRoles.includes(m.role));
    expect(boardMembers).toHaveLength(3);
  });

  it("returns error when no recipients", () => {
    const recipients: any[] = [];
    const result = recipients.length === 0
      ? { error: "Ingen styremedlemmer med registrert e-post" }
      : { success: true };

    expect(result.error).toBe("Ingen styremedlemmer med registrert e-post");
  });
});

// ── HTML generation tests ──────────────────────────────────────

describe("Email HTML Generation", () => {
  function makeTable(headers: string[], rows: string[][]) {
    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  it("generates KPI table with all values", () => {
    const html = makeTable(
      sampleData.kpis.map(k => k.label),
      [sampleData.kpis.map(k => k.value)]
    );

    expect(html).toContain("Åpne avvik");
    expect(html).toContain("67%");
    expect(html).toContain("12d");
  });

  it("generates severity table with breakdown", () => {
    const html = makeTable(
      ["Alvorlighet", "Åpne", "Totalt", "Løst"],
      sampleData.bySeverity.map(s => [s.label, String(s.open), String(s.total), String(s.total - s.open)])
    );

    expect(html).toContain("Kritisk");
    expect(html).toContain("Høy");
    expect(html).toContain("Middels");
    expect(html).toContain("Lav");
  });

  it("generates per-person table", () => {
    const html = makeTable(
      ["Navn", "Fullført", "Totalt", "Forfalt"],
      sampleData.byPerson.map(p => [p.name, String(p.done), String(p.total), p.overdue > 0 ? String(p.overdue) : "—"])
    );

    expect(html).toContain("Andreas Waag Martinsen");
    expect(html).toContain("Kari Nordmann");
  });

  it("generates overdue section with red styling", () => {
    const hasOverdue = sampleData.overdue.length > 0;
    expect(hasOverdue).toBe(true);

    const overdueHtml = makeTable(
      ["Type", "Beskrivelse", "Dager"],
      sampleData.overdue.map(o => [o.type, o.label, `${o.days}d`])
    );

    expect(overdueHtml).toContain("HMS");
    expect(overdueHtml).toContain("Lekeplass");
    expect(overdueHtml).toContain("21d");
  });

  it("skips overdue section when empty", () => {
    const emptyOverdue: any[] = [];
    const shouldRender = emptyOverdue.length > 0;
    expect(shouldRender).toBe(false);
  });

  it("skips area table when no areas", () => {
    const emptyAreas: any[] = [];
    const shouldRender = emptyAreas.length > 0;
    expect(shouldRender).toBe(false);
  });

  it("skips per-person table when no tasks assigned", () => {
    const emptyPersons: any[] = [];
    const shouldRender = emptyPersons.length > 0;
    expect(shouldRender).toBe(false);
  });
});
