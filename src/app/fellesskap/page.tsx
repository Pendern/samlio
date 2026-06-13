import { getAuthContext } from "@/lib/auth";
import { formatDate, getInitials, roleLabels } from "@/lib/config";
import { Pin, Shield, MessageCircle, Calendar, MapPin, Users, Megaphone, Heart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PostComposer, CommentForm, ReactionButton, PinButton, RsvpButton, GroupJoinButton } from "@/components/fellesskap/CommunityComponents";

export default async function FellesskapPage() {
  const { supabase, tenantId, profileId, role } = await getAuthContext();
  const isBoard = ["styreleder", "styremedlem"].includes(role);

  // Hent innlegg med forfatter, kommentarer og reaksjoner
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey(full_name, role),
      comments(id, body, created_at, profiles!comments_author_id_fkey(full_name, role)),
      reactions(id, profile_id, type),
      event_rsvps(id, profile_id, status)
    `)
    .eq("tenant_id", tenantId)
    .is("group_id", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // Hent grupper
  const { data: groups } = await supabase
    .from("groups")
    .select("*, group_memberships(profile_id)")
    .eq("tenant_id", tenantId);

  const allPosts = posts || [];
  const allGroups = groups || [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Fellesskap</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isBoard ? "Du poster som styret" : "Hva skjer i sameiet?"}
          </p>
        </div>
        <Link
          href="/fellesskap/mitt"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition"
        >
          <Heart className="w-4 h-4" />
          Mitt engasjement
        </Link>
      </div>

      {/* Groups Bar */}
      {allGroups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-zinc-500 flex-shrink-0">Grupper:</span>
          {allGroups.map(g => {
            const memberships = (g as any).group_memberships || [];
            const memberCount = memberships.length;
            const isMember = memberships.some((m: any) => m.profile_id === profileId);
            return (
              <GroupJoinButton key={g.id} groupId={g.id} groupName={g.name} isMember={isMember} memberCount={memberCount} />
            );
          })}
        </div>
      )}

      {/* Post Composer */}
      <PostComposer isBoard={isBoard} />

      {/* Feed */}
      <div className="space-y-4">
        {allPosts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <MessageCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Ingen innlegg ennå</p>
            <p className="text-sm text-zinc-600 mt-1">Vær den første til å dele noe!</p>
          </div>
        ) : (
          allPosts.map((post) => {
            const author = (post as any).profiles;
            const comments = (post as any).comments || [];
            const reactions = (post as any).reactions || [];
            const rsvps = (post as any).event_rsvps || [];
            const authorIsBoard = ["styreleder", "styremedlem"].includes(author?.role);
            const hasReacted = reactions.some((r: any) => r.profile_id === profileId);
            const attendingCount = rsvps.filter((r: any) => r.status === "attending").length;

            return (
              <div
                key={post.id}
                className={`bg-zinc-900 border rounded-xl ${
                  post.is_pinned ? "border-amber-900/50" :
                  post.type === "announcement" ? "border-violet-900/30" :
                  post.type === "event" ? "border-teal-900/30" :
                  "border-zinc-800"
                }`}
              >
                {/* Post Header */}
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        authorIsBoard ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-300"
                      }`}>
                        {authorIsBoard ? <Shield className="w-4 h-4" /> : getInitials(author?.full_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200">
                            {authorIsBoard ? "Styret" : author?.full_name || "Ukjent"}
                          </span>
                          {post.type === "announcement" && (
                            <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 text-[10px]">
                              <Megaphone className="w-2.5 h-2.5 mr-1" />Oppslag
                            </Badge>
                          )}
                          {post.type === "event" && (
                            <Badge variant="secondary" className="bg-teal-500/20 text-teal-400 text-[10px]">
                              <Calendar className="w-2.5 h-2.5 mr-1" />Arrangement
                            </Badge>
                          )}
                          {post.is_pinned && (
                            <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {authorIsBoard && author?.full_name ? `${author.full_name} · ` : ""}
                          {formatDate(post.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {isBoard && <PinButton postId={post.id} isPinned={post.is_pinned} />}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 py-3">
                  {post.title && (
                    <h3 className="font-semibold text-zinc-100 mb-1">{post.title}</h3>
                  )}
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{post.body}</p>

                  {/* Event details */}
                  {post.type === "event" && (
                    <div className="mt-3 bg-teal-950/30 border border-teal-900/30 rounded-lg p-3 flex items-center gap-4 text-sm text-teal-300">
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
                      <RsvpButton
                        postId={post.id}
                        isAttending={rsvps.some((r: any) => r.profile_id === profileId && r.status === "attending")}
                        attendingCount={attendingCount}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center gap-4">
                  <ReactionButton postId={post.id} count={reactions.length} hasReacted={hasReacted} />
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {comments.length > 0 && comments.length}
                  </span>
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div className="px-4 pb-2 space-y-2">
                    {comments.map((comment: any) => {
                      const commentAuthor = comment.profiles;
                      const commentIsBoard = ["styreleder", "styremedlem"].includes(commentAuthor?.role);
                      return (
                        <div key={comment.id} className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                            commentIsBoard ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {commentIsBoard ? <Shield className="w-3 h-3" /> : getInitials(commentAuthor?.full_name)}
                          </div>
                          <div className="flex-1 bg-zinc-800/50 rounded-lg px-3 py-1.5">
                            <span className="text-xs font-medium text-zinc-300">
                              {commentIsBoard ? "Styret" : commentAuthor?.full_name || "Ukjent"}
                            </span>
                            <p className="text-sm text-zinc-400">{comment.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment form */}
                {!post.comments_locked && (
                  <div className="px-4 pb-3">
                    <CommentForm postId={post.id} isBoard={isBoard} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
