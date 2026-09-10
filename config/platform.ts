/**
 * Frozen Sprint 0 platform decisions.
 * Change only via an explicit ADR — do not swap providers ad hoc.
 */
export const PLATFORM = {
  hosting: "vercel",
  database: "supabase-postgres",
  auth: "supabase-auth",
  validation: "zod",
  tenancy: "workspace-rls",
} as const;

export type PlatformDecisions = typeof PLATFORM;
