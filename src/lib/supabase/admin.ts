import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client with service_role key.
 * Used server-side only for operations that require elevated privileges
 * (e.g. creating auth users, bypassing RLS).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
 * Falls back to null if not available.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
