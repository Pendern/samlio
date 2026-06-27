"use server";

import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function requireStyleleder(role: string) {
  if (role !== "styreleder") {
    throw new Error("Kun styreleder kan administrere brukere");
  }
}

export async function inviteUser(formData: FormData) {
  const { supabase, tenantId, userId, role } = await getAuthContext();
  requireStyleleder(role);

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const fullName = (formData.get("full_name") as string)?.trim();
  const userRole = (formData.get("role") as string) || "beboer";

  if (!email) return { error: "E-post er påkrevd" };
  if (!fullName) return { error: "Navn er påkrevd" };

  // Check if profile already exists for this email in this tenant
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "Denne e-postadressen er allerede registrert" };
  }

  const admin = createAdminClient();

  if (admin) {
    // With service role key: create auth user + profile
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12) + "A1!",
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      // User might already exist in auth — try to find them
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existingAuth = users?.find(u => u.email === email);

      if (existingAuth) {
        // Auth user exists — just create profile
        const { error: profileError } = await admin.from("profiles").insert({
          user_id: existingAuth.id,
          tenant_id: tenantId,
          full_name: fullName,
          email,
          role: userRole,
        });

        if (profileError) return { error: "Kunne ikke opprette profil: " + profileError.message };
      } else {
        return { error: "Kunne ikke opprette bruker: " + authError.message };
      }
    } else if (authUser?.user) {
      const { error: profileError } = await admin.from("profiles").insert({
        user_id: authUser.user.id,
        tenant_id: tenantId,
        full_name: fullName,
        email,
        role: userRole,
      });

      if (profileError) return { error: "Bruker opprettet, men profil feilet: " + profileError.message };
    }
  } else {
    // Without service role key: create profile with placeholder
    // User must sign up themselves — profile will be linked on first login
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId, // Temporary — will be updated when user signs up
      tenant_id: tenantId,
      full_name: fullName,
      email,
      role: userRole,
    });

    if (profileError) return { error: "Kunne ikke opprette profil: " + profileError.message };
  }

  await logAudit(supabase, tenantId, userId, "user_invited", "profile", null, {
    invited_email: email,
    invited_role: userRole,
    has_admin_client: !!admin,
  });

  revalidatePath("/brukere");
  return {};
}

export async function updateUserRole(profileId: string, newRole: string) {
  const { supabase, tenantId, userId, role } = await getAuthContext();
  requireStyleleder(role);

  const validRoles = ["styreleder", "styremedlem", "varamedlem", "vaktmester", "beboer"];
  if (!validRoles.includes(newRole)) return { error: "Ugyldig rolle" };

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", profileId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };

  await logAudit(supabase, tenantId, userId, "user_role_changed", "profile", profileId, {
    new_role: newRole,
  });

  revalidatePath("/brukere");
  return {};
}

export async function removeUser(profileId: string) {
  const { supabase, tenantId, userId, role, profileId: myProfileId } = await getAuthContext();
  requireStyleleder(role);

  if (profileId === myProfileId) return { error: "Du kan ikke fjerne deg selv" };

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };

  await logAudit(supabase, tenantId, userId, "user_removed", "profile", profileId);

  revalidatePath("/brukere");
  return {};
}
