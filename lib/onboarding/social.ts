export type SocialSiteId =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "threads"
  | "x"
  | "facebook"
  | "linkedin"
  | "spotify";

export type SocialSite = {
  id: SocialSiteId;
  label: string;
  short: string;
};

export const SOCIAL_SITES: SocialSite[] = [
  { id: "instagram", label: "Instagram", short: "IG" },
  { id: "tiktok", label: "TikTok", short: "TT" },
  { id: "youtube", label: "YouTube", short: "YT" },
  { id: "threads", label: "Threads", short: "Th" },
  { id: "x", label: "X", short: "X" },
  { id: "facebook", label: "Facebook", short: "FB" },
  { id: "linkedin", label: "LinkedIn", short: "LI" },
  { id: "spotify", label: "Spotify for Artists", short: "Sp" },
];

/** Artist-first defaults when they tap You pick for me. */
export const SOCIAL_PICK_DEFAULTS: SocialSiteId[] = [
  "instagram",
  "tiktok",
  "youtube",
  "threads",
];

export type SocialTemplate = {
  siteId: SocialSiteId;
  title: string;
  format: string;
  prompt: string;
};

/** Starter templates opened from Quick social posts for checked sites. */
export const SOCIAL_TEMPLATES: SocialTemplate[] = [
  {
    siteId: "instagram",
    title: "Feed still",
    format: "1:1 or 4:5 photo + caption",
    prompt:
      "One honest line under the photo. Soft CTA to listen / save / share.",
  },
  {
    siteId: "instagram",
    title: "Reel hook",
    format: "9:16, first 2 seconds",
    prompt: "Face or lyric on screen. Hook in one breath, song title at the end.",
  },
  {
    siteId: "tiktok",
    title: "Sound clip",
    format: "9:16, 15–30s",
    prompt: "Open on the best 3 seconds. Text = one truth from the lyric.",
  },
  {
    siteId: "tiktok",
    title: "Day-in-the-voice",
    format: "Talking head + B-roll",
    prompt: "Say what the song is really about in 20 seconds. End with link in bio.",
  },
  {
    siteId: "youtube",
    title: "Shorts cut",
    format: "9:16 Short",
    prompt: "Same hook as TikTok, cleaner end card with song + channel.",
  },
  {
    siteId: "youtube",
    title: "Visualizer drop",
    format: "16:9 or square",
    prompt: "Full track art + waveform or lyric cards. Description: links + credits.",
  },
  {
    siteId: "threads",
    title: "Journal beat",
    format: "Text post",
    prompt: "One paragraph like a journal entry. No hard sell — invite a reply.",
  },
  {
    siteId: "x",
    title: "Single line",
    format: "Short post + link",
    prompt: "One lyric or truth. Link to the song. Pin while it's new.",
  },
  {
    siteId: "facebook",
    title: "Share post",
    format: "Photo or video + caption",
    prompt: "Warm caption for friends & fans. Include listen link once.",
  },
  {
    siteId: "linkedin",
    title: "Creator note",
    format: "Text + optional cover",
    prompt: "What you're building and why it matters. Soft link at the end.",
  },
  {
    siteId: "spotify",
    title: "Canvas / playlist pitch",
    format: "Spotify for Artists",
    prompt: "Update Canvas + bio line. Pitch the mood of the track in one sentence.",
  },
];

export function labelForSite(id: SocialSiteId): string {
  return SOCIAL_SITES.find((s) => s.id === id)?.label ?? id;
}

export function templatesForSites(siteIds: SocialSiteId[]): SocialTemplate[] {
  const set = new Set(siteIds);
  return SOCIAL_TEMPLATES.filter((t) => set.has(t.siteId));
}