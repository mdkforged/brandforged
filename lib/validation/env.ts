import { z } from "zod";

const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serviceRoleSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

function readPublicCandidate() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** True when public Supabase URL + anon key are present and valid. */
export function isAuthConfigured(): boolean {
  return publicSupabaseSchema.safeParse(readPublicCandidate()).success;
}

/** Lazy getter — throws only when called without valid public env. */
export function getSupabasePublicEnv() {
  return publicSupabaseSchema.parse(readPublicCandidate());
}

/** Lazy getter for optional service role key. Returns null when unset. */
export function getSupabaseServiceRoleKey(): string | null {
  const parsed = serviceRoleSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return parsed.success ? parsed.data.SUPABASE_SERVICE_ROLE_KEY : null;
}

/**
 * When true, middleware protects /app, /settings, and /workspaces.
 * Defaults to false so next build and local smoke tests work without auth env.
 */
export function isAuthRequired(): boolean {
  const raw = process.env.AUTH_REQUIRED;
  if (raw === undefined || raw === "") return false;
  return raw === "true" || raw === "1";
}
