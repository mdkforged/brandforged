import type { SocialSiteId } from "@/lib/onboarding/social";

/** What media the post actually needs — never imply audio/video you do not have. */
export type MediaNeed =
  | "look-photo"
  | "your-photo"
  | "your-video"
  | "cover-art"
  | "text-only";

export type ReachPackItem = {
  id: string;
  title: string;
  whenHint: string;
  /** Fan-facing caption ready to paste. Use {brand} for the artist/brand name. */
  caption: string;
  mediaNeed: MediaNeed;
  /** Honest label shown in UI, e.g. "Uses your Look photo" / "Text only — no audio". */
  mediaLabel: string;
};

/** Three reach-ready posts per platform — closed curated content, no homework. */
export const REACH_PACKS: Record<SocialSiteId, ReachPackItem[]> = {
  instagram: [
    {
      id: "ig-1",
      title: "Feed photo",
      whenHint: "Mid-morning (9–11 local) when fans scroll coffee.",
      mediaNeed: "look-photo",
      mediaLabel: "Uses your Look photo",
      caption:
        "Quiet frame. New from {brand}. Save this if you need it later — link in bio.",
    },
    {
      id: "ig-2",
      title: "Reel you film",
      whenHint: "Early evening (5–7) for first-hour reach.",
      mediaNeed: "your-video",
      mediaLabel: "You film a short Reel — no built-in sound pack",
      caption:
        "One breath. One truth. This is {brand}. Song / link at the end — wherever you listen.",
    },
    {
      id: "ig-3",
      title: "Carousel story",
      whenHint: "Weekday lunch scroll (12–1).",
      mediaNeed: "look-photo",
      mediaLabel: "Uses Look photos across slides",
      caption:
        "Slide through the feeling. Made by {brand}. Soft ask: save · share with one person who needs it.",
    },
  ],
  tiktok: [
    {
      id: "tt-1",
      title: "Talking clip you film",
      whenHint: "Evenings (6–9) when your crowd is awake.",
      mediaNeed: "your-video",
      mediaLabel: "You film on-camera — no fake sound clip",
      caption:
        "I made this for the quiet ones. — {brand}. Link in bio if it lands.",
    },
    {
      id: "tt-2",
      title: "Why this song",
      whenHint: "Late afternoon (3–5).",
      mediaNeed: "your-video",
      mediaLabel: "Talking-head video you record",
      caption:
        "20 seconds of honesty from {brand}. What this is really about — then where to listen.",
    },
    {
      id: "tt-3",
      title: "Photo + on-screen line",
      whenHint: "Weekend mornings for slower scrollers.",
      mediaNeed: "look-photo",
      mediaLabel: "Still photo + text on screen",
      caption:
        "One line. One photo. From {brand}. Pin the listen link in comments.",
    },
  ],
  youtube: [
    {
      id: "yt-1",
      title: "Short you cut",
      whenHint: "Late afternoon into evening.",
      mediaNeed: "your-video",
      mediaLabel: "Short you upload — title under 60 chars",
      caption:
        "{brand} — new Short. Hook first, clean end card with where to listen.",
    },
    {
      id: "yt-2",
      title: "Cover / visualizer art",
      whenHint: "Mid-week upload; promote same day.",
      mediaNeed: "cover-art",
      mediaLabel: "Cover art or lyric cards — not a fake audio file",
      caption:
        "Full listen from {brand}. Links + credits in the description. Soft ask to subscribe if it helps.",
    },
    {
      id: "yt-3",
      title: "Community note",
      whenHint: "When a Short is peaking.",
      mediaNeed: "text-only",
      mediaLabel: "Text post — optional thumbnail",
      caption:
        "Grateful you’re here. New from {brand} — what should we make next? Tell me in the comments.",
    },
  ],
  threads: [
    {
      id: "th-1",
      title: "Journal post",
      whenHint: "Morning (8–10).",
      mediaNeed: "text-only",
      mediaLabel: "Text only",
      caption:
        "Writing this down so I don’t lose it. From {brand}: one honest paragraph, no hard sell. Reply if it lands.",
    },
    {
      id: "th-2",
      title: "One-line truth",
      whenHint: "Lunch hour.",
      mediaNeed: "text-only",
      mediaLabel: "Text only",
      caption:
        "One true line from {brand}. Does this land for you?",
    },
    {
      id: "th-3",
      title: "Behind the take",
      whenHint: "Evening wind-down (7–9).",
      mediaNeed: "text-only",
      mediaLabel: "Text only — optional Look photo",
      caption:
        "One thing I learned making this. — {brand}. Thank you for listening.",
    },
  ],
  x: [
    {
      id: "x-1",
      title: "Single line + link",
      whenHint: "Weekday mornings and early evenings.",
      mediaNeed: "text-only",
      mediaLabel: "Text + your listen link",
      caption:
        "Out now from {brand}. One line. One link. That’s it.",
    },
    {
      id: "x-2",
      title: "Quote-ready line",
      whenHint: "Often 11–1 when niches chat.",
      mediaNeed: "text-only",
      mediaLabel: "Text only",
      caption:
        "A line worth quoting. — {brand}",
    },
    {
      id: "x-3",
      title: "Drop-day note",
      whenHint: "Twice on drop day — morning + evening.",
      mediaNeed: "text-only",
      mediaLabel: "Text + link",
      caption:
        "Out now. Why it matters, in one sentence. — {brand}. Thank you to everyone who showed up early.",
    },
  ],
  facebook: [
    {
      id: "fb-1",
      title: "Warm share",
      whenHint: "Early evening (5–7).",
      mediaNeed: "look-photo",
      mediaLabel: "Uses your Look photo",
      caption:
        "For the people who already care. New from {brand} — listen once, share with one friend if it helps.",
    },
    {
      id: "fb-2",
      title: "Short video you film",
      whenHint: "Weekend afternoons.",
      mediaNeed: "your-video",
      mediaLabel: "15–30s clip you record — not a stock sound",
      caption:
        "A small moment from {brand}. Feeling + link in the caption. Keep it personal.",
    },
    {
      id: "fb-3",
      title: "Listen / event reminder",
      whenHint: "Day-before and day-of.",
      mediaNeed: "text-only",
      mediaLabel: "Text + link or time/place",
      caption:
        "Friendly reminder from {brand}. Details + link below — drop a comment, I’ll reply.",
    },
  ],
  linkedin: [
    {
      id: "li-1",
      title: "Creator note",
      whenHint: "Tue–Thu mornings.",
      mediaNeed: "text-only",
      mediaLabel: "Text + soft link",
      caption:
        "What {brand} is building and why it matters. Clarity over hype. Soft link at the end.",
    },
    {
      id: "li-2",
      title: "Process share",
      whenHint: "Mid-week lunch scroll.",
      mediaNeed: "text-only",
      mediaLabel: "Text only",
      caption:
        "One lesson from making this release. — {brand}. What are you learning in public?",
    },
    {
      id: "li-3",
      title: "Milestone thanks",
      whenHint: "Same day as a real milestone.",
      mediaNeed: "text-only",
      mediaLabel: "Text + optional cover",
      caption:
        "Naming the milestone. Thanking the people who helped. Soft link to the work. — {brand}",
    },
  ],
  spotify: [
    {
      id: "sp-1",
      title: "Canvas + bio line",
      whenHint: "Morning of release.",
      mediaNeed: "cover-art",
      mediaLabel: "Cover / Canvas art — update in Spotify for Artists",
      caption:
        "Bio line for {brand}: one sentence on the mood of the track. Canvas updated same pass.",
    },
    {
      id: "sp-2",
      title: "Playlist pitch line",
      whenHint: "Within 7 days of release.",
      mediaNeed: "text-only",
      mediaLabel: "Pitch text only — mood, not resume",
      caption:
        "Pitch for {brand}: one-sentence vibe + comparable energy. Clean and honest.",
    },
    {
      id: "sp-3",
      title: "Fan-facing promo line",
      whenHint: "While the track is fresh.",
      mediaNeed: "cover-art",
      mediaLabel: "Story/Canvas promo line — same voice as IG",
      caption:
        "New from {brand}. Soft listen ask — same warmth as the Instagram caption.",
    },
  ],
  snapchat: [
    {
      id: "sc-1",
      title: "Story photo",
      whenHint: "Evenings when fans are free.",
      mediaNeed: "look-photo",
      mediaLabel: "Uses your Look photo — no fake audio",
      caption:
        "One clear frame. One true line. — {brand}",
    },
    {
      id: "sc-2",
      title: "Spotlight you film",
      whenHint: "Evening — first 2 seconds decide reach.",
      mediaNeed: "your-video",
      mediaLabel: "Short clip you film — not a stock sound",
      caption:
        "Open on the hook. Honest and short. End with the title. — {brand}",
    },
    {
      id: "sc-3",
      title: "Day-in-the-voice Snap",
      whenHint: "Casual midday Stories.",
      mediaNeed: "your-video",
      mediaLabel: "Quick talking Snap you record",
      caption:
        "What I’m making today. More later. — {brand}",
    },
  ],
};

export function fillBrandCaption(caption: string, brand: string): string {
  const name = brand.trim() || "your brand";
  return caption.replaceAll("{brand}", name);
}

export function reachPacksForSites(siteIds: SocialSiteId[]): Array<
  ReachPackItem & { siteId: SocialSiteId }
> {
  const out: Array<ReachPackItem & { siteId: SocialSiteId }> = [];
  for (const siteId of siteIds) {
    const pack = REACH_PACKS[siteId] || [];
    for (const item of pack) {
      out.push({ ...item, siteId });
    }
  }
  return out;
}

/** Open the platform compose / home surface (user pastes caption there). */
export const PLATFORM_OPEN_URL: Record<SocialSiteId, string> = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/upload",
  youtube: "https://studio.youtube.com/",
  threads: "https://www.threads.net/",
  x: "https://x.com/compose/post",
  facebook: "https://www.facebook.com/",
  linkedin: "https://www.linkedin.com/feed/",
  spotify: "https://artists.spotify.com/",
  snapchat: "https://www.snapchat.com/",
};

export const SOCIAL_NEEDS_STORAGE_KEY = "bf-social-needs-v1";

export type SocialNeedCard = {
  id: string;
  text: string;
  siteId: SocialSiteId | "custom";
  createdAt: string;
  sourceId?: string;
};

export function loadSocialNeeds(): SocialNeedCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SOCIAL_NEEDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SocialNeedCard =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as SocialNeedCard).id === "string" &&
        typeof (item as SocialNeedCard).text === "string",
    );
  } catch {
    return [];
  }
}

export function saveSocialNeeds(cards: SocialNeedCard[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOCIAL_NEEDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    /* ignore quota */
  }
}
