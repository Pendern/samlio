"use client";

import { useTransition } from "react";
import { sendDigestEmail } from "@/app/varsler/email-actions";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function SendDigestButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      className="text-violet-400 hover:text-violet-300 h-8 text-xs"
      onClick={() => startTransition(async () => {
        const result = await sendDigestEmail();
        if (result.error) {
          toast.error("Kunne ikke sende e-post", { description: result.error });
        } else {
          toast.success(`Oppsummering sendt til ${result.recipients} mottaker${result.recipients !== 1 ? "e" : ""}`, {
            description: result.alerts > 0
              ? `${result.alerts} varsler inkludert`
              : "Ingen kritiske hendelser",
          });
        }
      })}
    >
      <Mail className={`w-3.5 h-3.5 mr-1.5 ${isPending ? "animate-pulse" : ""}`} />
      {isPending ? "Sender..." : "Send oppsummering"}
    </Button>
  );
}
