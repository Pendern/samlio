import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportData {
  tenantName: string;
  generatedAt: string;
  cases: { title: string; category: string; status: string; created: string }[];
  deviations: { title: string; area: string; severity: string; status: string; due: string }[];
  tasks: { title: string; assignee: string; status: string; due: string }[];
  maintenance: { part: string; description: string; condition: string; nextDate: string; cost: string }[];
}

// ── PDF Export ──────────────────────────────────────────────────

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Styreoversikt", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`${data.tenantName} — Generert ${data.generatedAt}`, 14, y);
  doc.setTextColor(0);
  y += 12;

  // Saker
  if (data.cases.length > 0) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Styresaker", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Tittel", "Kategori", "Status", "Opprettet"]],
      body: data.cases.map((c) => [c.title, c.category, c.status, c.created]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [63, 63, 70] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // HMS-avvik
  if (data.deviations.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("HMS-avvik", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Tittel", "Område", "Alvorlighet", "Status", "Frist"]],
      body: data.deviations.map((d) => [d.title, d.area, d.severity, d.status, d.due]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [120, 53, 15] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Oppgaver
  if (data.tasks.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Oppgaver", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Tittel", "Ansvarlig", "Status", "Frist"]],
      body: data.tasks.map((t) => [t.title, t.assignee, t.status, t.due]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [88, 28, 135] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Vedlikehold
  if (data.maintenance.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Vedlikehold", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Bygningsdel", "Beskrivelse", "Tilstand", "Neste", "Estimert kostnad"]],
      body: data.maintenance.map((m) => [m.part, m.description, m.condition, m.nextDate, m.cost]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [154, 52, 18] },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on all pages
  const pageCount = (doc as any).getNumberOfPages?.() ?? doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Samlio \u2014 Styreoversikt \u2014 Side ${i} av ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`styreoversikt-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ── Excel Export ───────────────────────────────────────────────

export function exportToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();

  // Saker
  if (data.cases.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.cases.map((c) => ({
        Tittel: c.title,
        Kategori: c.category,
        Status: c.status,
        Opprettet: c.created,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Saker");
  }

  // HMS-avvik
  if (data.deviations.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.deviations.map((d) => ({
        Tittel: d.title,
        Område: d.area,
        Alvorlighet: d.severity,
        Status: d.status,
        Frist: d.due,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "HMS-avvik");
  }

  // Oppgaver
  if (data.tasks.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.tasks.map((t) => ({
        Tittel: t.title,
        Ansvarlig: t.assignee,
        Status: t.status,
        Frist: t.due,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Oppgaver");
  }

  // Vedlikehold
  if (data.maintenance.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.maintenance.map((m) => ({
        Bygningsdel: m.part,
        Beskrivelse: m.description,
        Tilstand: m.condition,
        "Neste vedlikehold": m.nextDate,
        "Estimert kostnad": m.cost,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Vedlikehold");
  }

  XLSX.writeFile(wb, `styreoversikt-${new Date().toISOString().split("T")[0]}.xlsx`);
}
