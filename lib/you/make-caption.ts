import { extractOrderTitle } from "@/lib/you/make-order";

/**
 * Make this captions: AI preferred; local rewrite only as fallback.
 * The one-line brief is the subject of the post. Never echo it, and never
 * describe the Look photo (it is not sent to the model).
 */

export type MakeCaptionInput = {
  brandName: string;
  oneLiner: string;
  voiceLabel?: string;
  voiceTone?: string[];
  moodTags?: string[];
};

export type MakeCaptionResult = {
  caption: string;
  source: "ai" | "local";
};

/** Fallback / pad set for the required 4 hashtags on the last line. */
export const DEFAULT_CAPTION_HASHTAGS = [
  "#TetheredAndTruth",
  "#NewMusic",
  "#IndependentArtist",
  "#NowPlaying",
] as const;

const HASHTAG_RE = /#[A-Za-z0-9_]+/g;
const HASHTAG_ONLY_LINE_RE = /^(?:#[A-Za-z0-9_]+[\s,]*)+$/;
const TRAILING_TAGS_RE = /(?:\s+#[A-Za-z0-9_]+)+[\s,]*$/;

/**
 * Enforce exactly 4 hashtags on their own last line.
 * Trailing tag runs / tag-only lines are collected; extras are trimmed;
 * missing ones are padded from DEFAULT_CAPTION_HASHTAGS.
 */
export function enforceFourHashtags(caption: string): string {
  const lines = caption.replace(/\r\n/g, "\n").trim().split("\n");
  const tags: string[] = [];
  const bodyLines: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      bodyLines.push("");
      continue;
    }
    if (HASHTAG_ONLY_LINE_RE.test(line)) {
      tags.push(...(line.match(HASHTAG_RE) || []));
      continue;
    }
    const trailing = line.match(TRAILING_TAGS_RE);
    let text = line;
    if (trailing) {
      tags.push(...(trailing[0].match(HASHTAG_RE) || []));
      text = line.slice(0, line.length - trailing[0].length).trim();
    }
    // Mid-sentence tags would push the count past 4 - keep the word, drop the #.
    text = text.replace(/(^|\s)#([A-Za-z0-9_]+)/g, "$1$2");
    bodyLines.push(text);
  }
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const tag of [...tags, ...DEFAULT_CAPTION_HASHTAGS]) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(tag);
    if (picked.length === 4) break;
  }
  const body = bodyLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return body ? `${body}\n\n${picked.join(" ")}` : picked.join(" ");
}

/** True when the brief itself asks for a caption about the photo / the look. */
export function briefAsksForPhotoCaption(brief: string): boolean {
  const b = brief.toLowerCase();
  return (
    /\bcaption (for |this |the )*(photo|pic|picture|image|shot|look)\b/.test(b) ||
    /\bdescribe (the |this |my )?(photo|pic|picture|image|shot|look)\b/.test(b) ||
    /\b(about|for) (the|this|my) (photo|pic|picture|image|look)\b/.test(b) ||
    /\bthe look\b/.test(b)
  );
}

const RELEASE_WORDS_RE =
  /\b(album|album art|artwork|cover|cover art|single|song|track|ep|record|release|drop|video|lyric|lyrics)\b/i;

/** Pull a release title out of briefs like "Album art - Moment To Rise". */
export function extractReleaseTitle(brief: string): string | null {
  const text = brief.trim().replace(/\s+/g, " ");
  const ordered = extractOrderTitle(text);
  if (ordered) return ordered;
  const quoted = text.match(/["\u201C]([^"\u201D]{2,80})["\u201D]/);
  if (quoted && quoted[1].trim()) return quoted[1].trim();
  const parts = text
    .split(/\s+[-\u2013\u2014|:]\s+|:\s+|\s[\u2013\u2014]|[\u2013\u2014]\s/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const [left, ...rest] = parts;
    const right = rest.join(" - ");
    if (RELEASE_WORDS_RE.test(left) && right) return right.replace(/[.!?]+$/, "");
    if (RELEASE_WORDS_RE.test(right) && left) return left.replace(/[.!?]+$/, "");
  }
  const named = text.match(
    /\b(?:called|titled|named)\s+([A-Z][^.!?,;]{1,60})/,
  );
  if (named && named[1].trim()) return named[1].trim();
  return null;
}

/**
 * Local fallback caption: 3-6 short sentences about the brief's subject,
 * exactly 4 hashtags on the last line. Never pastes the brief, never
 * describes the photo unless the brief asks for a photo caption.
 */
export function localOnBrandCaption(input: MakeCaptionInput): string {
  const brief = input.oneLiner.trim().replace(/\s+/g, " ");
  const lower = brief.toLowerCase();
  const title = brief ? extractReleaseTitle(brief) : null;
  let sentences: string[];

  if (title) {
    sentences = [
      `"${title}" is for anyone still finding their footing.`,
      "It came from the quiet, from the moments that ask more of you than you think you have.",
      "Let it meet you where you are.",
      "Rise with it.",
    ];
  } else if (RELEASE_WORDS_RE.test(lower) || /\b(music|listen|new)\b/.test(lower)) {
    sentences = [
      "This one is for anyone still finding their footing.",
      "It came from the quiet, and it was made to be felt.",
      "Let it meet you where you are.",
      "Turn it up when you need it most.",
    ];
  } else if (/\b(thank|thanks|grateful|gratitude)\b/.test(lower)) {
    sentences = [
      "Thank you for staying close.",
      "Every listen, every message, every share carries this further than I could alone.",
      "I see you.",
      "This is ours.",
    ];
  } else if (/\b(behind|process|making|studio|writing|session)\b/.test(lower)) {
    sentences = [
      "This is the part nobody sees.",
      "Late hours, honest takes, starting again.",
      "Every piece of it is for you.",
      "More soon.",
    ];
  } else if (brief && briefAsksForPhotoCaption(brief)) {
    sentences = [
      "This is me, as I am.",
      "No filter on the feeling.",
      "Just truth, held steady.",
      "Stay close.",
    ];
  } else {
    sentences = [
      "Some things are worth saying slowly.",
      "This is one of them.",
      "Hold on to what is true for you.",
      "Keep rising.",
    ];
  }

  return enforceFourHashtags(sentences.join(" "));
}

/** Client: POST /api/you/make-caption; fall back to local only if the API fails. */
export async function requestAiCaption(
  input: MakeCaptionInput,
): Promise<MakeCaptionResult> {
  try {
    const res = await fetch("/api/you/make-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: input.brandName,
        oneLiner: input.oneLiner,
        voiceLabel: input.voiceLabel,
        voiceTone: input.voiceTone,
        moodTags: input.moodTags,
      }),
    });
    if (!res.ok) {
      return {
        caption: localOnBrandCaption(input),
        source: "local",
      };
    }
    const data = (await res.json()) as {
      caption?: unknown;
      source?: unknown;
    };
    const caption =
      typeof data.caption === "string" ? data.caption.trim() : "";
    if (!caption) {
      return {
        caption: localOnBrandCaption(input),
        source: "local",
      };
    }
    const source = data.source === "ai" ? "ai" : "local";
    return { caption, source };
  } catch {
    return {
      caption: localOnBrandCaption(input),
      source: "local",
    };
  }
}
