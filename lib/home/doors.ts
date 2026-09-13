export type HomeDoorId = "you" | "world";

export type HomeDoor = {
  id: HomeDoorId;
  href: "/you" | "/world";
  label: "This is You" | "Your World";
  summary: string;
};

/**
 * Locked home CTAs (DR-003). Labels are user-facing and must stay plain.
 * Access: everyone starts with This is You; Your World is an upgrade (DR-008).
 */
export const HOME_DOORS: readonly HomeDoor[] = [
  {
    id: "you",
    href: "/you",
    label: "This is You",
    summary: "Your voice, your look, and the things you want to say.",
  },
  {
    id: "world",
    href: "/world",
    label: "Your World",
    summary: "The people and work around what you're building.",
  },
];

export const WORLD_UPGRADE_COPY = {
  badge: "Upgrade",
  summary: "People, money, and campaigns - unlock when you're ready.",
  cta: "Open Your World",
  requesting: "Sending request...",
  requested: "Request sent - we'll open Your World for you.",
  signedOut: "Sign in to request Your World.",
  allInOneHint:
    "You chose all-in-one at signup - request Your World whenever you're ready.",
} as const;

export function doorByHref(pathname: string): HomeDoor | undefined {
  return HOME_DOORS.find((door) => door.href === pathname);
}