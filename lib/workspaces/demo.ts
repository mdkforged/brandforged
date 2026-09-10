import type { Workspace } from "@/lib/contracts/workspace";

/**
 * UI-facing workspace summary.
 * Compatible with {@link Workspace} via shared `slug` + `name` fields.
 */
export type WorkspaceSummary = Pick<Workspace, "slug" | "name">;

/**
 * DEMO / FALLBACK workspace list until live membership fetch exists.
 * Not production tenancy data — seed UI only.
 */
export const DEMO_WORKSPACES: readonly WorkspaceSummary[] = [
  // DEMO/FALLBACK — default active workspace for the shell
  { slug: "tethered-and-truth", name: "Tethered & Truth" },
  // DEMO placeholder — second workspace so the switcher is not a single hard-coded brand
  { slug: "brand-forged", name: "Brand Forged" },
];

/** Default active workspace (first DEMO/FALLBACK entry). */
export const DEFAULT_DEMO_WORKSPACE: WorkspaceSummary = DEMO_WORKSPACES[0];

export function findDemoWorkspace(
  slug: string,
): WorkspaceSummary | undefined {
  return DEMO_WORKSPACES.find((w) => w.slug === slug);
}
