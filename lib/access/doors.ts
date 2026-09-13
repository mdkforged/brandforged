export type AccountKind = "individual" | "business";
export type DoorAccess = "you" | "both";
/** Signup intent after kind: branding-only vs full business OS. */
export type SolutionFocus = "branding" | "all_in_one";

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