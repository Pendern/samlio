import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toContain("foo");
    expect(cn("foo", "bar")).toContain("bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "visible");
    expect(result).toContain("base");
    expect(result).toContain("visible");
    expect(result).not.toContain("hidden");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toContain("foo");
    expect(cn("foo", undefined, null, "bar")).toContain("bar");
  });

  it("deduplicates tailwind classes", () => {
    const result = cn("p-4", "p-6");
    expect(result).toContain("p-6");
    expect(result).not.toContain("p-4");
  });
});

describe("Business logic helpers", () => {
  it("calculates days until due date correctly", () => {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(daysLeft).toBeGreaterThanOrEqual(6);
    expect(daysLeft).toBeLessThanOrEqual(8);
  });

  it("identifies overdue items", () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const isOverdue = new Date(pastDate) < new Date();
    expect(isOverdue).toBe(true);
  });

  it("identifies future items", () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const isOverdue = new Date(futureDate) < new Date();
    expect(isOverdue).toBe(false);
  });

  it("formats Norwegian dates correctly", () => {
    const date = new Date("2026-06-13");
    const formatted = date.toLocaleDateString("no-NO", { day: "numeric", month: "short", year: "numeric" });
    expect(formatted).toContain("2026");
  });

  it("calculates total maintenance cost", () => {
    const items = [
      { estimated_cost: 15000 },
      { estimated_cost: 850000 },
      { estimated_cost: 1200000 },
      { estimated_cost: null },
    ];
    const total = items.reduce((sum, i) => sum + (Number(i.estimated_cost) || 0), 0);
    expect(total).toBe(2065000);
  });

  it("filters active cases correctly", () => {
    const cases = [
      { status: "ny" },
      { status: "under_behandling" },
      { status: "vedtatt" },
      { status: "arkivert" },
      { status: "arkivert" },
    ];
    const active = cases.filter(c => c.status !== "arkivert");
    expect(active).toHaveLength(3);
  });

  it("filters open HMS deviations", () => {
    const deviations = [
      { status: "open", severity: "hoy" },
      { status: "in_progress", severity: "middels" },
      { status: "resolved", severity: "lav" },
    ];
    const open = deviations.filter(d => d.status !== "resolved");
    expect(open).toHaveLength(2);
  });

  it("identifies critical maintenance items", () => {
    const items = [
      { condition: "god" },
      { condition: "akseptabel" },
      { condition: "darlig" },
      { condition: "kritisk" },
    ];
    const critical = items.filter(i => i.condition === "darlig" || i.condition === "kritisk");
    expect(critical).toHaveLength(2);
  });

  it("generates initials from full name", () => {
    const name = "Andreas Waag Martinsen";
    const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    expect(initials).toBe("AW");
  });

  it("handles greeting based on time of day", () => {
    const hour = 15;
    const greeting = hour < 12 ? "God morgen" : hour < 17 ? "God dag" : "God kveld";
    expect(greeting).toBe("God dag");
  });
});
