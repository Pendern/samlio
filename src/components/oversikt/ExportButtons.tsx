"use client";

import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";

interface ExportButtonsProps {
  tenantName: string;
  cases: { title: string; category: string; status: string; created: string }[];
  deviations: { title: string; area: string; severity: string; status: string; due: string }[];
  tasks: { title: string; assignee: string; status: string; due: string }[];
  maintenance: { part: string; description: string; condition: string; nextDate: string; cost: string }[];
}

export function ExportButtons(props: ExportButtonsProps) {
  const data = {
    ...props,
    generatedAt: new Date().toLocaleDateString("no-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToPDF(data)}
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9 text-xs"
      >
        <FileDown className="w-3.5 h-3.5 mr-1.5" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToExcel(data)}
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9 text-xs"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
        Excel
      </Button>
    </div>
  );
}
