import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import Link from "next/link";

export async function NotificationBell() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return null;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", profile.id)
    .eq("is_read", false);

  const unreadCount = count || 0;

  return (
    <Link
      href="/varsler"
      className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors group"
    >
      <Bell className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
      <span>Varsler</span>
      {unreadCount > 0 && (
        <span className="ml-auto bg-violet-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
