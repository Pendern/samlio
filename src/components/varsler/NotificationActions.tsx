"use client";

import { useTransition } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/varsler/actions";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await markNotificationRead(notificationId); })}
      disabled={isPending}
      className="w-2.5 h-2.5 rounded-full bg-violet-500 hover:bg-violet-400 transition flex-shrink-0"
      title="Marker som lest"
    />
  );
}

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(async () => { await markAllNotificationsRead(); })}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-8 text-xs"
    >
      <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
      {isPending ? "..." : "Marker alle som lest"}
    </Button>
  );
}
