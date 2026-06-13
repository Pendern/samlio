import { describe, it, expect } from "vitest";
import type {
  UserRole, CaseStatus, TaskStatus, MeetingType,
  AiSuggestionStatus, HmsDeviationSeverity, MaintenanceCondition,
  Tenant, Profile, BoardCase, HmsDeviation, MaintenanceItem, Task,
} from "@/types/database";

describe("Database Types", () => {
  it("UserRole accepts valid roles", () => {
    const roles: UserRole[] = ["styreleder", "styremedlem", "varamedlem", "vaktmester", "beboer", "ekstern"];
    expect(roles).toHaveLength(6);
  });

  it("CaseStatus has correct values", () => {
    const statuses: CaseStatus[] = ["ny", "under_behandling", "vedtatt", "avvist", "utsatt", "arkivert"];
    expect(statuses).toHaveLength(6);
    expect(statuses).toContain("under_behandling");
  });

  it("HmsDeviationSeverity has correct levels", () => {
    const levels: HmsDeviationSeverity[] = ["lav", "middels", "hoy", "kritisk"];
    expect(levels).toHaveLength(4);
    expect(levels.indexOf("kritisk")).toBeGreaterThan(levels.indexOf("lav"));
  });

  it("MaintenanceCondition has correct values", () => {
    const conditions: MaintenanceCondition[] = ["god", "akseptabel", "darlig", "kritisk"];
    expect(conditions).toHaveLength(4);
  });

  it("TaskStatus has correct workflow states", () => {
    const statuses: TaskStatus[] = ["ny", "pagar", "ferdig"];
    expect(statuses).toHaveLength(3);
  });

  it("Tenant interface has required fields", () => {
    const tenant: Tenant = {
      id: "test-id",
      name: "Test Sameie",
      org_nr: "123456789",
      address: "Testveien 1",
      city: "Oslo",
      zip: "0001",
      year_built: 2020,
      num_units: 24,
      building_type: "Leilighetsbygg",
      logo_url: null,
      primary_color: "#8b5cf6",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(tenant.name).toBe("Test Sameie");
    expect(tenant.year_built).toBe(2020);
  });

  it("BoardCase interface enforces status type", () => {
    const boardCase: BoardCase = {
      id: "case-1",
      tenant_id: "t-1",
      title: "Reklamasjon tak",
      description: "Lekkasje i 4. etg",
      category: "Vedlikehold",
      status: "under_behandling",
      created_by: "p-1",
      assigned_to: null,
      meeting_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(boardCase.status).toBe("under_behandling");
  });

  it("HmsDeviation interface has severity and status", () => {
    const deviation: HmsDeviation = {
      id: "d-1",
      tenant_id: "t-1",
      area_id: "a-1",
      title: "Brannslukker utgått",
      description: "Brannslukker i 3. etg har utgått dato",
      severity: "hoy",
      status: "open",
      reported_by: "p-1",
      assigned_to: "p-2",
      due_date: "2026-07-01",
      resolved_at: null,
      images: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(deviation.severity).toBe("hoy");
    expect(deviation.status).toBe("open");
  });

  it("MaintenanceItem tracks costs and dates", () => {
    const item: MaintenanceItem = {
      id: "m-1",
      tenant_id: "t-1",
      building_part: "221 Tak",
      description: "Taktekking",
      condition: "darlig",
      expected_lifetime_years: 15,
      last_maintained_at: "2019-08-01",
      next_maintenance_at: "2027-01-01",
      estimated_cost: 1200000,
      actual_cost: null,
      notes: null,
      attachments: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(item.estimated_cost).toBe(1200000);
    expect(item.condition).toBe("darlig");
  });
});
