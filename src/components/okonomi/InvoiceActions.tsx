"use client";

import { useTransition } from "react";
import { approveInvoice, rejectInvoice } from "@/app/okonomi/actions";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function InvoiceApproveButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      onClick={() => startTransition(async () => { await approveInvoice(invoiceId); })}
      disabled={isPending}
      className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs"
    >
      <Check className="w-3 h-3 mr-1" />
      {isPending ? "..." : "Godkjenn"}
    </Button>
  );
}

export function InvoiceRejectButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => startTransition(async () => { await rejectInvoice(invoiceId, "Avvist"); })}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 h-7 text-xs"
    >
      <X className="w-3 h-3 mr-1" />
      {isPending ? "..." : "Avvis"}
    </Button>
  );
}
