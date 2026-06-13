"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotifications } from "@/lib/notifications";

export async function createPost(formData: FormData) {
  const { supabase, profileId, tenantId, role } = await getAuthContext();

  const body = (formData.get("body") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const type = (formData.get("type") as string) || "post";
  const groupId = formData.get("group_id") as string;
  const eventDate = formData.get("event_date") as string;
  const eventLocation = formData.get("event_location") as string;

  if (!body || body.length < 2) return { error: "Innlegget kan ikke være tomt" };

  // Bare styret kan lage oppslag (announcements)
  if (type === "announcement" && !["styreleder", "styremedlem"].includes(role)) {
    return { error: "Kun styremedlemmer kan lage oppslag" };
  }

  const { error } = await supabase.from("posts").insert({
    tenant_id: tenantId,
    author_id: profileId,
    type,
    title: title || null,
    body,
    group_id: groupId || null,
    event_date: eventDate || null,
    event_location: eventLocation?.trim() || null,
  });

  if (error) return { error: "Kunne ikke publisere: " + error.message };

  // Varsle alle i sameiet om nye oppslag/innlegg
  const { data: allProfiles } = await supabase
    .from("profiles").select("id").eq("tenant_id", tenantId);

  if (allProfiles) {
    await createNotifications({
      supabase,
      tenantId,
      recipientIds: allProfiles.map(p => p.id),
      actorId: profileId,
      type: "post",
      title: type === "announcement" ? "Nytt oppslag fra styret" : type === "event" ? "Nytt arrangement" : "Nytt innlegg",
      body: (title || body).substring(0, 100),
      href: "/fellesskap",
    });
  }

  revalidatePath("/fellesskap");
  return { success: true };
}

export async function createComment(postId: string, body: string) {
  const { supabase, profileId } = await getAuthContext();

  if (!body?.trim() || body.trim().length < 1) return { error: "Kommentaren kan ikke være tom" };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: profileId,
    body: body.trim(),
  });

  if (error) return { error: error.message };

  // Varsle innleggseieren om ny kommentar
  const { data: post } = await supabase
    .from("posts").select("author_id").eq("id", postId).single();

  if (post && post.author_id !== profileId) {
    await createNotifications({
      supabase,
      tenantId: (await supabase.from("profiles").select("tenant_id").eq("id", profileId).single()).data!.tenant_id,
      recipientIds: [post.author_id],
      actorId: profileId,
      type: "comment",
      title: "Ny kommentar på ditt innlegg",
      body: body.trim().substring(0, 100),
      href: "/fellesskap",
      entityId: postId,
    });
  }

  revalidatePath("/fellesskap");
  return { success: true };
}

export async function toggleReaction(postId: string) {
  const { supabase, profileId } = await getAuthContext();

  // Sjekk om reaksjon finnes
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("profile_id", profileId)
    .single();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      post_id: postId,
      profile_id: profileId,
      type: "like",
    });
  }

  revalidatePath("/fellesskap");
  return { success: true };
}

export async function toggleRsvp(postId: string) {
  const { supabase, profileId } = await getAuthContext();

  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("id, status")
    .eq("post_id", postId)
    .eq("profile_id", profileId)
    .single();

  if (existing) {
    const newStatus = existing.status === "attending" ? "not_attending" : "attending";
    await supabase.from("event_rsvps").update({ status: newStatus }).eq("id", existing.id);
  } else {
    await supabase.from("event_rsvps").insert({
      post_id: postId,
      profile_id: profileId,
      status: "attending",
    });
  }

  revalidatePath("/fellesskap");
  return { success: true };
}

export async function toggleGroupMembership(groupId: string) {
  const { supabase, profileId } = await getAuthContext();

  const { data: existing } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .single();

  if (existing) {
    await supabase.from("group_memberships").delete().eq("id", existing.id);
  } else {
    await supabase.from("group_memberships").insert({
      group_id: groupId,
      profile_id: profileId,
    });
  }

  revalidatePath("/fellesskap");
  return { success: true };
}

export async function togglePin(postId: string) {
  const { supabase, tenantId, role } = await getAuthContext();

  if (!["styreleder", "styremedlem"].includes(role)) {
    return { error: "Kun styret kan pinne innlegg" };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("is_pinned")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single();

  if (!post) return { error: "Innlegg ikke funnet" };

  await supabase.from("posts").update({ is_pinned: !post.is_pinned }).eq("id", postId);
  revalidatePath("/fellesskap");
  return { success: true };
}
