import { extractOrderTitle } from "@/lib/you/make-order";
import type { BrandMaster } from "@/lib/brand/brand-masters";

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
  /** Her Notes (bf-you-notes-v1), trimmed to what matters for this brief. */
  notes?: string;
  /** Applied Brand 1 / 2 / 3 master: name is voice context only. */
  brand?: BrandMaster;
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
export function enforceFourHashtags(
  caption: string,
  defaults: readonly string[] = DEFAULT_CAPTION_HASHTAGS,
): string {
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
  for (const tag of [...tags, ...defaults]) {
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

/**
 * Pad set for the applied brand: T&T keeps its default set; any other brand
 * gets its own name tag - never #TetheredAndTruth mixed in.
 */
export function hashtagsForBrand(brandName: string | undefined): readonly string[] {
  const name = (brandName || "").trim();
  if (!name || /tethered/i.test(name)) return DEFAULT_CAPTION_HASHTAGS;
  const words = name.replace(/&/g, " and ").match(/[A-Za-z0-9]+/g) || [];
  const tag = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .slice(0, 30);
  const base = ["#NewMusic", "#IndependentArtist", "#NowPlaying", "#Musician"];
  return tag.length >= 3 ? [`#${tag}`, ...base.slice(0, 3)] : base;
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

  const phrases = title ? notePhrasesForRelease(input.notes || "", title) : [];
  if (title && phrases.length) {
    // Her Notes name this release: one or two of her own short phrases.
    sentences = [
      `"${title}" carries something I needed to say.`,
      ...phrases,
      "Let it meet you where you are.",
      "Rise with it.",
    ];
  } else if (title) {
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

  return enforceFourHashtags(sentences.join(" "), hashtagsForBrand(input.brandName));
}

/** Most Notes text sent with a brief. */
export const NOTES_MAX_CHARS = 4000;

const NOTE_STOPWORDS = new Set([
  "make", "into", "album", "with", "that", "this", "from", "about", "post",
  "caption", "title", "titled", "font", "gold", "golden", "middle", "center",
  "centre", "other", "adjustments", "changes", "write", "song", "single",
  "release", "track", "photo", "image", "picture", "cover", "poster", "flyer",
  "your", "mine", "have", "just", "only", "then", "them", "they", "what",
  "when", "will", "would", "could", "should", "there", "their", "here",
]);

function noteKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function splitNoteBlocks(notes: string): string[] {
  const text = notes.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const blocks = text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  return text.split("\n").map((b) => b.trim()).filter(Boolean);
}

/** True when the Notes name the same release as the brief. */
export function notesMatchRelease(notes: string, title: string): boolean {
  const key = noteKey(title);
  return key.length >= 3 && noteKey(notes).includes(key);
}

/**
 * Pick the Notes to send with a brief: everything when short; otherwise
 * blocks that name the brief's release first, then blocks sharing its
 * words, then the most recent - capped at maxChars, kept in original order.
 */
export function selectNotesForBrief(
  notes: string,
  brief: string,
  maxChars: number = NOTES_MAX_CHARS,
): string {
  const text = (notes || "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  const blocks = splitNoteBlocks(text);
  const title = extractReleaseTitle(brief);
  const titleKey = title ? noteKey(title) : "";
  const words = Array.from(
    new Set(
      (brief.toLowerCase().match(/[a-z0-9']{4,}/g) || []).filter(
        (w) => !NOTE_STOPWORDS.has(w),
      ),
    ),
  );
  const scored = blocks.map((block, index) => {
    const lower = block.toLowerCase();
    let score = 0;
    if (titleKey && noteKey(block).includes(titleKey)) score += 100;
    for (const w of words) if (lower.includes(w)) score += 1;
    return { block, index, score };
  });
  const ranked = [...scored].sort((a, b) => b.score - a.score || b.index - a.index);
  const picked: typeof scored = [];
  let used = 0;
  for (const item of ranked) {
    const len = item.block.length + 2;
    if (used + len > maxChars) {
      if (picked.length === 0) {
        picked.push({ ...item, block: item.block.slice(0, maxChars) });
        used = maxChars;
      }
      continue;
    }
    picked.push(item);
    used += len;
  }
  return picked
    .sort((a, b) => a.index - b.index)
    .map((p) => p.block)
    .join("\n\n");
}

const EMOTION_RE =
  /\b(?:dedicat|pray|prayer|faith|fight|fought|body|heal|worth|hope|love|believ|god|strength|surviv|rise|rising|breath)/i;

/** One or two short phrases from Notes that name this release (local fallback). */
export function notePhrasesForRelease(notes: string, title: string): string[] {
  if (!notes || !notesMatchRelease(notes, title)) return [];
  const key = noteKey(title);
  const relevant = splitNoteBlocks(notes).filter((b) => noteKey(b).includes(key));
  const sentences = relevant.join(" ").match(/[^.!?\n]+[.!?]*/g) || [];
  const cleaned = sentences
    .map((s) =>
      s
        .replace(/#[A-Za-z0-9_]+/g, "")
        .replace(/["\u201C\u201D]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(
      (s) =>
        s.length >= 15 &&
        s.length <= 90 &&
        !/https?:|www\./i.test(s) &&
        noteKey(s) !== key &&
        !META_RE.test(s),
    );
  const ordered = [
    ...cleaned.filter((s) => EMOTION_RE.test(s)),
    ...cleaned.filter((s) => !EMOTION_RE.test(s)),
  ];
  const out: string[] = [];
  for (const s of ordered) {
    if (out.length === 2) break;
    if (out.includes(s)) continue;
    const sentence = s.charAt(0).toUpperCase() + s.slice(1);
    out.push(/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
  }
  return out;
}

const META_RE =
  /\b(?:you (?:may|might|could) want to|feel free to|edit (?:this|it|as needed)|rewrite (?:this|it)|tweak (?:this|it)|adjust (?:this|it|as needed)|another chat|here(?:'s| is) (?:a|your|the) caption|let me know|hope this helps|as an ai)\b/i;

/** Drop meta sentences ("you may want to edit this") and labels from a caption. */
export function stripMetaText(caption: string): string {
  return caption
    .replace(/\r\n/g, "\n")
    .replace(/^\s*(?:caption|here(?:'s| is) (?:your|the|a) caption)\s*:\s*/i, "")
    .split("\n")
    .map((line) => {
      if (!META_RE.test(line)) return line;
      const parts = line.match(/[^.!?]+[.!?]*\s*/g) || [line];
      return parts.filter((p) => !META_RE.test(p)).join("").trim();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
        notes: input.notes,
        brand: input.brand,
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
