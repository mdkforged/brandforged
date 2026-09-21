export const WORLD_ROOMS = [
  {
    slug: "dashboard",
    title: "Dashboard",
    note: "The snapshot. What's moving today.",
  },
  {
    slug: "people",
    title: "People",
    note: "Who you're talking with. Names and next steps in one place.",
  },
  {
    slug: "money",
    title: "Money",
    note: "What came in and what went out.",
  },
  {
    slug: "calendar",
    title: "Calendar",
    note: "What's next. Reminders that work for you.",
  },
  {
    slug: "campaigns",
    title: "Campaigns",
    note: "The work that's live.",
  },
  {
    slug: "plans",
    title: "Plans",
    note: "The path. What we're building toward.",
  },
  {
    slug: "logs",
    title: "Logs",
    note: "What happened. So the report writes itself.",
  },
] as const;

export type WorldRoomSlug = (typeof WORLD_ROOMS)[number]["slug"];

export function worldRoomBySlug(slug: string) {
  return WORLD_ROOMS.find((room) => room.slug === slug) ?? null;
}
