export type AccountKind = "individual" | "business";
export type DoorAccess = "you" | "both";

/** Signup default + hard rule: Your World is an upgrade. */
export const DEFAULT_DOOR_ACCESS: DoorAccess = "you";
export const DEFAULT_ACCOUNT_KIND: AccountKind = "individual";

export function hasWorldAccess(access: DoorAccess | null | undefined): boolean {
  return access === "both";
}

export function hasYouAccess(access: DoorAccess | null | undefined): boolean {
  // Everyone with a profile has This is You (including both).
  return access === "you" || access === "both" || access == null;
}