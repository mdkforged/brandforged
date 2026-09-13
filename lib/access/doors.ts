export type AccountKind = "individual" | "business";
export type DoorAccess = "you" | "both";
/** Signup intent after kind: branding-only vs full business OS. */
export type SolutionFocus = "branding" | "all_in_one";

export type ProfileAccess = {
  door_access: DoorAccess;
  account_kind: AccountKind | null;
  solution_focus: SolutionFocus | null;
  world_upgrade_requested_at: string | null;
};

/** Signup default + hard rule: Your World is an upgrade. */
export const DEFAULT_DOOR_ACCESS: DoorAccess = "you";
export const DEFAULT_ACCOUNT_KIND: AccountKind = "individual";

export function defaultSolutionFocus(kind: AccountKind): SolutionFocus {
  return kind === "business" ? "all_in_one" : "branding";
}

export function hasWorldAccess(access: DoorAccess | null | undefined): boolean {
  return access === "both";
}

export function hasYouAccess(access: DoorAccess | null | undefined): boolean {
  return access === "you" || access === "both" || access == null;
}