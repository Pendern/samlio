"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createMeeting(formData: FormData) {
  const { supabase, profileId, tenantId } = await getAuthContext();

  const title = (formData.get("title") as string)?.trim();
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const location = formData.get("location") as string;
  const meetingType = (formData.get("meeting_type") as string) || "styremote";

  if (!title || title.length < 3) return { error: "Tittel må være minst 3 tegn" };
  if (!date) return { error: "Dato er påkrevd" };

  const { data: meeting, error } = await supabase.from("board_meetings").insert({
    tenant_id: tenantId,
    meeting_type: meetingType,
    title: title,
    date,
    time: time || null,
    location: location?.trim() || null,
    created_by: profileId,
  }).select("id").single();

  if (error) return { error: "Kunne ikke opprette møte: " + error.message };

  // Inviter alle styremedlemmer automatisk
  const { data: members } = await supabase
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("role", ["styreleder", "styremedlem", "varamedlem"]);

  if (members && members.length > 0) {
    await supabase.from("meeting_attendance").insert(
      members.map(m => ({
        meeting_id: meeting.id,
        profile_id: m.id,
        status: "pending",
      }))
    );
  }

  revalidatePath("/moter");
  revalidatePath("/");
  return { success: true };
}

export async function saveProtocol(meetingId: string, protocol: string) {
  const { supabase, tenantId } = await getAuthContext();

  const { error } = await supabase
    .from("board_meetings")
    .update({ ai_protocol_draft: protocol })
    .eq("id", meetingId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Kunne ikke lagre protokoll: " + error.message };

  revalidatePath("/moter");
  revalidatePath(`/moter/${meetingId}`);
  return { success: true };
}
