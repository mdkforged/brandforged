export type HomeDoorId = "you" | "world";

export type HomeDoor = {
  id: HomeDoorId;
  href: "/you" | "/world";
  label: "This is You" | "Your World";
  summary: string;
};

/**
 * Locked home CTAs (DR-003). Labels are user-facing and must stay plain.
 * Forge-era names do not belong here.
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

export function doorByHref(pathname: string): HomeDoor | undefined {
  return HOME_DOORS.find((door) => door.href === pathname);
}