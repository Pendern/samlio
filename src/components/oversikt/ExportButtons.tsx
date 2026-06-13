"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export";
import { sendReportEmail } from "@/app/oversikt/actions";

interface ExportButtonsProps {
  tenantName: string;
  cases: { title: string; category: string; status: string; created: string }[];
  deviations: { title: string; area: string; severity: string; status: string; due: string }[];
  tasks: { title: string; assignee: string; status: string; due: string }[];
  maintenance: { part: string; description: string; condition: string; nextDate: string; cost: string }[];
}

export function ExportButtons(props: ExportButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "error">("idle");
  const [emailMessage, setEmailMessage] = useState("");

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

  function handleSendEmail() {
    setEmailStatus("idle");
    startTransition(async () => {
      const result = await sendReportEmail({
        cases: props.cases,
        deviations: props.deviations,
        tasks: props.tasks,
        maintenance: props.maintenance,
      });
      if (result.error) {
        setEmailStatus("error");
        setEmailMessage(result.error);
      } else {
        setEmailStatus("sent");
        setEmailMessage(`Sendt til ${result.recipientCount} styremedlem${result.recipientCount! > 1 ? "mer" : ""}`);
        setTimeout(() => setEmailStatus("idle"), 4000);
      }
    });
  }

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
      <Button
        variant="outline"
        size="sm"
        onClick={handleSendEmail}
        disabled={isPending || emailStatus === "sent"}
        className={`h-9 text-xs ${
          emailStatus === "sent"
            ? "border-emerald-700 text-emerald-400"
            : emailStatus === "error"
            ? "border-red-700 text-red-400"
            : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        {isPending ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sender...</>
        ) : emailStatus === "sent" ? (
          <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {emailMessage}</>
        ) : emailStatus === "error" ? (
          <><Mail className="w-3.5 h-3.5 mr-1.5" /> Feilet</>
        ) : (
          <><Mail className="w-3.5 h-3.5 mr-1.5" /> Send p\u00e5 e-post</>
        )}
      </Button>
    </div>
  );
}
