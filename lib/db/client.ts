import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
  isAuthConfigured,
} from "@/lib/validation/env";

/**
 * Service-role admin client. Bypasses RLS — every query MUST enforce
 * workspace scoping in application code (filter by workspace_id and verify
 * membership via workspace-policy) before returning data to callers.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isAuthConfigured()) return null;
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) return null;

  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
