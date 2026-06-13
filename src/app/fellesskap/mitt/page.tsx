import { getAuthContext } from "@/lib/auth";
import { formatDate, getInitials, daysUntil } from "@/lib/config";
import {
  CalendarCheck, Users, MapPin, Calendar, Clock,
  CheckCircle2, ArrowLeft, MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RsvpButton, GroupJoinButton } from "@/components/fellesskap/CommunityComponents";
import Link from "next/link";

export default async function MittEngasjementPage() {
  const { supabase, tenantId, profileId } = await getAuthContext();

  // Arrangementer jeg har svart på
  const { data: myRsvps } = await supabase
    .from("event_rsvps")
    .select("status, posts(id, title, body, event_date, event_location, created_at, profiles!posts_author_id_fkey(full_name, role), reactions(id), comments(id), event_rsvps(id, profile_id, status))")
    .eq("profile_id", profileId);

  // Mine grupper
  const { data: myMemberships } = await supabase
    .from("group_memberships")
    .select("joined_at, groups(id, name, description, is_official, is_private, created_at, group_memberships(profile_id))")
    .eq("profile_id", profileId);

  // Alle grupper (for å vise de man ikke er med i)
  const { data: allGroups } = await supabase
    .from("groups")
    .select("id, name, description, is_official, is_private, group_memberships(profile_id)")
    .eq("tenant_id", tenantId);

  const now = new Date();

  // Sorter arrangementer
  const events = (myRsvps || [])
    .map(r => ({ ...r, post: (r as any).posts }))
    .filter(r => r.post)
    .sort((a, b) => new Date(b.post.event_date || b.post.created_at).getTime() - new Date(a.post.event_date || a.post.created_at).getTime());

  const upcomingEvents = events.filter(e => e.post.event_date && new Date(e.post.event_date) >= now);
  const pastEvents = events.filter(e => e.post.event_date && new Date(e.post.event_date) < now);

  // Grupper
  const myGroupIds = new Set((myMemberships || []).map(m => (m as any).groups?.id).filter(Boolean));
  const myGroups = (myMemberships || []).map(m => (m as any).groups).filter(Boolean);
  const otherGroups = (allGroups || []).filter(g => !myGroupIds.has(g.id) && !g.is_private);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Link href="/fellesskap" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition">
        <ArrowLeft className="w-4 h-4" />
        Tilbake til fellesskap
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Mitt engasjement</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Dine arrangementer og grupper
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-teal-400">{upcomingEvents.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Kommende</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-400">{pastEvents.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Deltatt på</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{myGroups.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Grupper</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <CalendarCheck className="w-4 h-4 inline-block mr-1.5" />
          Kommende arrangementer
        </h2>
        {upcomingEvents.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Ingen kommende arrangementer</p>
            <p className="text-xs text-zinc-600 mt-1">Meld deg på fra fellesskapssiden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((e) => {
              const post = e.post;
              const days = daysUntil(post.event_date);
              const allRsvps = post.event_rsvps || [];
              const attendingCount = allRsvps.filter((r: any) => r.status === "attending").length;
              const isAttending = e.status === "attending";

              return (
                <div key={post.id} className="bg-zinc-900 border border-teal-900/30 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-zinc-100">{post.title || "Arrangement"}</h3>
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{post.body}</p>
                    </div>
                    {days !== null && (
                      <Badge variant="secondary" className="bg-teal-500/20 text-teal-400 flex-shrink-0 ml-3">
                        {days === 0 ? "I dag" : days === 1 ? "I morgen" : `${days} dager`}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {post.event_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(post.event_date, { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                      )}
                      {post.event_location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {post.event_location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {attendingCount} deltar
                      </span>
                    </div>
                    <RsvpButton postId={post.id} isAttending={isAttending} attendingCount={attendingCount} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
            <Clock className="w-4 h-4 inline-block mr-1.5" />
            Tidligere arrangementer
          </h2>
          <div className="space-y-2">
            {pastEvents.map((e) => {
              const post = e.post;
              return (
                <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-300 truncate">{post.title || "Arrangement"}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(post.event_date, { day: "numeric", month: "short", year: "numeric" })}
                      {post.event_location && ` · ${post.event_location}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={e.status === "attending" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-500"}>
                    {e.status === "attending" ? "Deltok" : "Deltok ikke"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* My Groups */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Users className="w-4 h-4 inline-block mr-1.5" />
          Mine grupper
        </h2>
        {myGroups.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Du er ikke med i noen grupper ennå</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {myGroups.map((group: any) => {
              const memberCount = group.group_memberships?.length || 0;
              return (
                <div key={group.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                      {group.name}
                      {group.is_official && (
                        <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 text-[10px]">Offisiell</Badge>
                      )}
                    </h3>
                    <GroupJoinButton groupId={group.id} groupName="" isMember={true} memberCount={memberCount} />
                  </div>
                  {group.description && (
                    <p className="text-sm text-zinc-500">{group.description}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-2">{memberCount} medlem{memberCount !== 1 ? "mer" : ""}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Other Groups */}
      {otherGroups.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
            Andre grupper
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {otherGroups.map((group) => {
              const memberCount = (group as any).group_memberships?.length || 0;
              return (
                <div key={group.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-zinc-200">{group.name}</h3>
                    <GroupJoinButton groupId={group.id} groupName="" isMember={false} memberCount={memberCount} />
                  </div>
                  {group.description && (
                    <p className="text-sm text-zinc-500">{group.description}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-2">{memberCount} medlem{memberCount !== 1 ? "mer" : ""}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
