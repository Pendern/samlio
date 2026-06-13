"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Mail, CheckCircle2, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sendStatistikkEmail } from "@/app/statistikk/actions";

interface StatistikkData {
  tenantName: string;
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

export function StatistikkExportButton({ data }: { data: StatistikkData }) {
  const [isPending, startTransition] = useTransition();
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState("");

  function handleEmail() {
    setEmailStatus("idle");
    startTransition(async () => {
      const result = await sendStatistikkEmail(data);
      if (result.error) {
        setEmailStatus("error");
        setEmailMsg(result.error);
      } else {
        setEmailStatus("sent");
        setEmailMsg(`Sendt til ${result.recipientCount} styremedlem${result.recipientCount! > 1 ? "mer" : ""}`);
        setTimeout(() => setEmailStatus("idle"), 4000);
      }
    });
  }

  function handleExport() {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Statistikk — Styrerapport", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`${data.tenantName} — ${new Date().toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" })}`, 14, y);
    doc.setTextColor(0);
    y += 14;

    // KPIs
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Nøkkeltall", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [data.kpis.map(k => k.label)],
      body: [data.kpis.map(k => k.value)],
      styles: { fontSize: 11, halign: "center", cellPadding: 4 },
      headStyles: { fillColor: [63, 63, 70], textColor: [161, 161, 170], fontSize: 8 },
      bodyStyles: { fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // HMS per alvorlighetsgrad
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("HMS-avvik per alvorlighetsgrad", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Alvorlighet", "Åpne", "Totalt", "Løst"]],
      body: data.bySeverity.map(s => [s.label, String(s.open), String(s.total), String(s.total - s.open)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [120, 53, 15] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // HMS per område
    if (data.byArea.length > 0) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("HMS-avvik per område", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Område", "Åpne", "Løst", "Totalt"]],
        body: data.byArea.map(a => [a.name, String(a.open), String(a.resolved), String(a.open + a.resolved)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [63, 63, 70] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Oppgaver
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Oppgavestatus (${data.completionRate}% fullført)`, 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Status", "Antall"]],
      body: [
        ["Ny", String(data.tasksByStatus.ny)],
        ["Pågår", String(data.tasksByStatus.pagar)],
        ["Ferdig", String(data.tasksByStatus.ferdig)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [88, 28, 135] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Per person
    if (data.byPerson.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Oppgaver per person", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Navn", "Fullført", "Totalt", "Forfalt"]],
        body: data.byPerson.map(p => [p.name, String(p.done), String(p.total), p.overdue > 0 ? String(p.overdue) : "—"]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [63, 63, 70] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Forfalt
    if (data.overdue.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("Forfalt — krever handling", 14, y);
      doc.setTextColor(0);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Type", "Beskrivelse", "Dager over frist"]],
        body: data.overdue.map(o => [o.type, o.label, `${o.days}d`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [153, 27, 27] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const pageCount = (doc as any).getNumberOfPages?.() ?? doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Samlio \u2014 Statistikkrapport \u2014 Side ${i} av ${pageCount}`,
        pw / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`statistikk-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleExport}
        variant="outline"
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      >
        <FileDown className="w-4 h-4 mr-2" />
        PDF
      </Button>
      <Button
        onClick={handleEmail}
        disabled={isPending || emailStatus === "sent"}
        variant="outline"
        className={`${
          emailStatus === "sent" ? "border-emerald-700 text-emerald-400" :
          emailStatus === "error" ? "border-red-700 text-red-400" :
          "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sender...</>
        ) : emailStatus === "sent" ? (
          <><CheckCircle2 className="w-4 h-4 mr-2" /> {emailMsg}</>
        ) : (
          <><Mail className="w-4 h-4 mr-2" /> Send til styret</>
        )}
      </Button>
    </div>
  );
}
