import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  profileId: string;
  tenantId: string;
  fullName: string | null;
  role: string;
  tenantName: string;
}

/**
 * Get authenticated user context for server components and server actions.
 * Redirects to /login if not authenticated.
 * Returns user, profile, and tenant info in one call.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Hent primær profil — styreleder prioriteres over andre roller
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, tenant_id, full_name, role, tenants(name)")
    .eq("user_id", user.id)
    .order("role")
    .limit(1);

  const profile = profiles?.[0];

  if (!profile) redirect("/login");

  return {
    supabase,
    userId: user.id,
    profileId: profile.id,
    tenantId: profile.tenant_id,
    fullName: profile.full_name,
    role: profile.role,
    tenantName: (profile as any).tenants?.name || "Ditt sameie",
  };
}
