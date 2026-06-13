import { getAuthContext } from "@/lib/auth";
import { formatDate, getInitials } from "@/lib/config";
import {
  Bell, MessageCircle, ThumbsUp, Calendar, ShieldAlert,
  ClipboardList, Users, Megaphone, Shield,
} from "lucide-react";
import Link from "next/link";
import { MarkReadButton, MarkAllReadButton } from "@/components/varsler/NotificationActions";

const typeIcons: Record<string, typeof Bell> = {
  post: Megaphone,
  comment: MessageCircle,
  reaction: ThumbsUp,
  event_reminder: Calendar,
  rsvp: Users,
  hms_deviation: ShieldAlert,
  task_assigned: ClipboardList,
  meeting_reminder: Calendar,
};

const typeColors: Record<string, string> = {
  post: "bg-violet-500/20 text-violet-400",
  comment: "bg-blue-500/20 text-blue-400",
  reaction: "bg-pink-500/20 text-pink-400",
  event_reminder: "bg-teal-500/20 text-teal-400",
  rsvp: "bg-teal-500/20 text-teal-400",
  hms_deviation: "bg-red-500/20 text-red-400",
  task_assigned: "bg-amber-500/20 text-amber-400",
  meeting_reminder: "bg-teal-500/20 text-teal-400",
};

export default async function VarslerPage() {
  const { supabase, profileId } = await getAuthContext();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, profiles!notifications_actor_id_fkey(full_name, role)")
    .eq("recipient_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications || [];
  const unreadCount = items.filter(n => !n.is_read).length;

  // Grupper etter dag
  const grouped: Record<string, typeof items> = {};
  items.forEach(n => {
    const day = new Date(n.created_at).toLocaleDateString("no-NO", { weekday: "long", day: "numeric", month: "long" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(n);
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Varsler</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} uleste` : "Alle lest"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Notifications */}
      {items.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Bell className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Ingen varsler ennå</p>
          <p className="text-sm text-zinc-600 mt-1">Du vil bli varslet om nye innlegg, kommentarer og arrangementer</p>
        </div>
      ) : (
        Object.entries(grouped).map(([day, dayNotifications]) => (
          <section key={day}>
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">{day}</h2>
            <div className="space-y-1">
              {dayNotifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                const color = typeColors[n.type] || "bg-zinc-500/20 text-zinc-400";
                const actor = (n as any).profiles;
                const actorIsBoard = actor && ["styreleder", "styremedlem"].includes(actor.role);
                const actorName = actorIsBoard ? "Styret" : actor?.full_name || "";
                const time = new Date(n.created_at).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });

                const content = (
                  <div className={`flex items-start gap-3 p-3 rounded-xl transition ${n.is_read ? "opacity-50" : "bg-zinc-900/50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">
                        {actorName && <span className="font-medium">{actorName} </span>}
                        {n.title.toLowerCase()}
                      </p>
                      {n.body && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{n.body}</p>
                      )}
                      <p className="text-xs text-zinc-600 mt-1">{time}</p>
                    </div>
                    {!n.is_read && <MarkReadButton notificationId={n.id} />}
                  </div>
                );

                return n.href ? (
                  <Link key={n.id} href={n.href} className="block hover:bg-zinc-800/30 rounded-xl">
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
