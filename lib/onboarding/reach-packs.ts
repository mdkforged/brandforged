import type { SocialSiteId } from "@/lib/onboarding/social";

export type ReachPackItem = {
  id: string;
  title: string;
  whenHint: string;
  caption: string;
};

/** Three reach-ready posts per platform — closed curated content, no homework. */
export const REACH_PACKS: Record<SocialSiteId, ReachPackItem[]> = {
  instagram: [
    {
      id: "ig-1",
      title: "Feed still — soft CTA",
      whenHint: "Post mid-morning (9–11 local) when fans scroll coffee.",
      caption:
        "Still frame. One honest line under the photo. Soft CTA: save this · share with someone who needs it · link in bio.",
    },
    {
      id: "ig-2",
      title: "Reel hook — face first",
      whenHint: "Drop Reels early evening (5–7) for first-hour reach.",
      caption:
        "First 2 seconds: face or lyric on screen. One breath hook. End card: song title + where to listen.",
    },
    {
      id: "ig-3",
      title: "Carousel — story in 5",
      whenHint: "Weekday lunch scroll (12–1) works for carousels.",
      caption:
        "Slide 1 hook · 2–4 the feeling · 5 the listen link. Keep text short. Invite a save.",
    },
  ],
  tiktok: [
    {
      id: "tt-1",
      title: "Sound clip — best 3 seconds",
      whenHint: "Post when your crowd is awake evenings (6–9).",
      caption:
        "Open on the best 3 seconds. On-screen text = one truth from the lyric. End with song title.",
    },
    {
      id: "tt-2",
      title: "Talking head — why this song",
      whenHint: "Late afternoon (3–5) for talking-head reach.",
      caption:
        "Say what the song is really about in 20 seconds. Natural voice. Soft end: link in bio.",
    },
    {
      id: "tt-3",
      title: "B-roll + lyric line",
      whenHint: "Weekend mornings catch slower scrollers.",
      caption:
        "B-roll of your world + one lyric line. Keep it honest. Pin a comment with the listen link.",
    },
  ],
  youtube: [
    {
      id: "yt-1",
      title: "Shorts cut — clean end card",
      whenHint: "Shorts: late afternoon into evening for discovery.",
      caption:
        "Same hook energy as TikTok, cleaner end card with song + channel. Title under 60 characters.",
    },
    {
      id: "yt-2",
      title: "Visualizer drop",
      whenHint: "Upload full visualizer mid-week; promote same day on Shorts.",
      caption:
        "Full track art + waveform or lyric cards. Description: links, credits, one soft ask to subscribe.",
    },
    {
      id: "yt-3",
      title: "Community note",
      whenHint: "Post a Community update when a Short is peaking.",
      caption:
        "One warm line about the track + thumbnail. Ask a simple question fans can answer in comments.",
    },
  ],
  threads: [
    {
      id: "th-1",
      title: "Journal beat",
      whenHint: "Morning Threads (8–10) catch quiet readers.",
      caption:
        "One paragraph like a journal entry. No hard sell — invite a reply. Soft link at the end if it fits.",
    },
    {
      id: "th-2",
      title: "One-line truth",
      whenHint: "Lunch hour for short posts.",
      caption:
        "One true line about the work. Ask: “does this land for you?” Keep it human.",
    },
    {
      id: "th-3",
      title: "Behind the take",
      whenHint: "Evening wind-down (7–9).",
      caption:
        "Share one thing you learned making this. End with gratitude — not a pitch.",
    },
  ],
  x: [
    {
      id: "x-1",
      title: "Single line + link",
      whenHint: "Weekday mornings and early evenings travel farthest.",
      caption:
        "One lyric or truth. Link to the song. Pin while it’s new.",
    },
    {
      id: "x-2",
      title: "Quote-ready hook",
      whenHint: "Post when your niche is chatting (often 11–1).",
      caption:
        "A line people can quote. No thread required. Soft follow-up reply with the listen link.",
    },
    {
      id: "x-3",
      title: "Drop day reminder",
      whenHint: "Twice on drop day — morning + evening.",
      caption:
        "Out now. One sentence on why it matters. Link once. Thank early listeners in replies.",
    },
  ],
  facebook: [
    {
      id: "fb-1",
      title: "Share post — warm caption",
      whenHint: "Early evening (5–7) for friends & fans.",
      caption:
        "Warm caption for people who already care. Include the listen link once. Ask them to share with one friend.",
    },
    {
      id: "fb-2",
      title: "Short video cut",
      whenHint: "Weekend afternoons for video reach.",
      caption:
        "15–30s cut of the song or a talking moment. Caption = feeling + link. Keep it personal.",
    },
    {
      id: "fb-3",
      title: "Event / listen reminder",
      whenHint: "Day-before and day-of for shows or drops.",
      caption:
        "Friendly reminder with time/place or drop link. Invite comments — reply to every one you can.",
    },
  ],
  linkedin: [
    {
      id: "li-1",
      title: "Creator note",
      whenHint: "Tue–Thu mornings for professional reach.",
      caption:
        "What you’re building and why it matters. Soft link at the end. No hype — clarity.",
    },
    {
      id: "li-2",
      title: "Process share",
      whenHint: "Mid-week lunch scroll.",
      caption:
        "One lesson from making this release. End with an open question for other creators.",
    },
    {
      id: "li-3",
      title: "Milestone gratitude",
      whenHint: "When you hit a real milestone — same day.",
      caption:
        "Name the milestone. Thank the people who helped. Soft link to the work.",
    },
  ],
  spotify: [
    {
      id: "sp-1",
      title: "Canvas + bio line",
      whenHint: "Update Canvas the morning of release.",
      caption:
        "Update Canvas and artist bio in one pass. Bio line = mood of the track in one sentence.",
    },
    {
      id: "sp-2",
      title: "Playlist pitch line",
      whenHint: "Pitch within 7 days of release in for Artists.",
      caption:
        "Pitch the mood, not the resume. One sentence vibe + comparable energy. Keep it clean.",
    },
    {
      id: "sp-3",
      title: "Marquee / story nudge",
      whenHint: "Use Marquee or story tools when the track is fresh.",
      caption:
        "Short fan-facing line for Spotify story/canvas promo. Same voice as your Instagram soft CTA.",
    },
  ],
  snapchat: [
    {
      id: "sc-1",
      title: "Story frame — face or art",
      whenHint: "Stories peak evenings — post when fans are free.",
      caption:
        "One clear frame with your face or art. Caption = one true line. Soft swipe-up feel without hard sell.",
    },
    {
      id: "sc-2",
      title: "Spotlight hook",
      whenHint: "Spotlight: first 2 seconds decide reach — post evening.",
      caption:
        "Open on the hook. Keep it honest and short. End with song title or where to listen.",
    },
    {
      id: "sc-3",
      title: "Day-in-the-voice Snap",
      whenHint: "Casual midday Stories feel native on Snap.",
      caption:
        "Quick talking Snap: what you’re making today. End with a soft “more tonight” or listen line.",
    },
  ],
};

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
