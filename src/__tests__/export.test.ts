import { describe, it, expect, vi } from "vitest";

// Mock jsPDF and xlsx since they need browser/node APIs
class MockJsPDF {
  internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [null, {}] };
  setFontSize = vi.fn();
  setFont = vi.fn();
  setTextColor = vi.fn();
  text = vi.fn();
  setPage = vi.fn();
  save = vi.fn();
  lastAutoTable = { finalY: 100 };
}
vi.mock("jspdf", () => ({ default: MockJsPDF }));

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

vi.mock("xlsx", () => ({
  utils: {
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe("Export Utilities", () => {
  it("exportToPDF creates document without errors", async () => {
    const { exportToPDF } = await import("@/lib/export");

    expect(() =>
      exportToPDF({
        tenantName: "Test Sameie",
        generatedAt: "13. juni 2026",
        cases: [{ title: "Sak 1", category: "Vedlikehold", status: "Ny", created: "1. jun 2026" }],
        deviations: [{ title: "Avvik 1", area: "Brann", severity: "Høy", status: "Åpen", due: "15. jul 2026" }],
        tasks: [{ title: "Oppgave 1", assignee: "Andreas", status: "Pågår", due: "20. jun 2026" }],
        maintenance: [{ part: "221 Tak", description: "Taktekking", condition: "Dårlig", nextDate: "jan 2027", cost: "1 200 000 kr" }],
      })
    ).not.toThrow();
  });

  it("exportToPDF handles empty data", async () => {
    const { exportToPDF } = await import("@/lib/export");

    expect(() =>
      exportToPDF({
        tenantName: "Tomt Sameie",
        generatedAt: "13. juni 2026",
        cases: [],
        deviations: [],
        tasks: [],
        maintenance: [],
      })
    ).not.toThrow();
  });

  it("exportToExcel creates workbook without errors", async () => {
    const { exportToExcel } = await import("@/lib/export");
    const XLSX = await import("xlsx");

    exportToExcel({
      tenantName: "Test Sameie",
      generatedAt: "13. juni 2026",
      cases: [{ title: "Sak 1", category: "Drift", status: "Vedtatt", created: "1. jun 2026" }],
      deviations: [],
      tasks: [{ title: "Oppgave 1", assignee: "Kari", status: "Ny", due: "—" }],
      maintenance: [{ part: "311 Vinduer", description: "Beslag", condition: "Akseptabel", nextDate: "sep 2028", cost: "120 000 kr" }],
    });

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it("exportToExcel skips empty sections", async () => {
    const { exportToExcel } = await import("@/lib/export");
    const XLSX = await import("xlsx");

    vi.clearAllMocks();

    exportToExcel({
      tenantName: "Test",
      generatedAt: "13. juni 2026",
      cases: [],
      deviations: [],
      tasks: [],
      maintenance: [],
    });

    expect(XLSX.utils.json_to_sheet).not.toHaveBeenCalled();
  });
});
