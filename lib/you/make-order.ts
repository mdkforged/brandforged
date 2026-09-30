/**
 * Make this: the one-line brief is an ORDER about the selected Look photo.
 * classifyBrief() decides whether it is a VISUAL order (album art, title or
 * text on the piece, change the quote / background, edit the image) or a
 * caption-only brief. Shared by client and server - no browser APIs here.
 */

export type BriefKind = "visual" | "caption";

export type PaletteSwatch = { name: string; hex: string };

const DESIGN_NOUN =
  "(?:album art|album cover|album artwork|cover art|single cover|ep cover|artwork|poster|flyer|thumbnail|banner|graphic|wallpaper)";
const MAKE_INTO_RE = new RegExp(
  `\\b(?:make|turn|convert|transform|create|design|redo|remake|use)\\b[^.!?]{0,40}\\b${DESIGN_NOUN}\\b`,
  "i",
);
const INTO_COVER_RE = /\b(?:into|as)\s+(?:a |an |the |my )?cover\b/i;
const CHANGE_RE =
  /\b(?:change|swap|replace|edit|update|remove|redo|recolor|recolour|darken|brighten|blur)\b[^.!?]{0,40}\b(?:background|backdrop|quote|text|words|title|box|colou?rs?|lighting|sky|image|photo|picture|pic)\b/i;
const ADD_ON_RE =
  /\b(?:add|put|place|overlay|stamp|print)\b[^.!?]{0,40}\b(?:title|text|words|quote|name|logo|lyrics|typography)\b/i;
const TITLE_FIELD_RE = /\btitle\s*[:=]/i;
const EDIT_PHOTO_RE =
  /\b(?:edit|retouch|restyle|redo|fix)\s+(?:the |this |my )?(?:photo|image|picture|pic|look)\b/i;
const CAPTION_FIRST_RE = /^\s*(?:write|draft|caption|post about|give me a caption)\b/i;
const IMAGE_WORD_RE =
  /\b(?:photo|image|picture|pic|art|artwork|cover|poster|flyer|background|backdrop|box|graphic)\b/i;

export function classifyBrief(brief: string): BriefKind {
  const text = brief.trim();
  if (!text) return "caption";
  if (TITLE_FIELD_RE.test(text)) return "visual";
  if (CAPTION_FIRST_RE.test(text)) return "caption";
  // "add my name to the caption" is about words, not the picture.
  if (/\bcaption\b/i.test(text) && !IMAGE_WORD_RE.test(text)) return "caption";
  if (
    MAKE_INTO_RE.test(text) ||
    INTO_COVER_RE.test(text) ||
    CHANGE_RE.test(text) ||
    ADD_ON_RE.test(text) ||
    EDIT_PHOTO_RE.test(text)
  ) {
    return "visual";
  }
  return "caption";
}

function cleanPiece(value: string): string {
  return value
    .trim()
    .replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, "")
    .replace(/[.!?]+$/, "")
    .trim();
}

/** Title the order wants on the piece, e.g. "title: Moment To Rise". */
export function extractOrderTitle(brief: string): string | null {
  const text = brief.trim().replace(/\s+/g, " ");
  const quoted = text.match(/\btitled?\s*[:=]?\s*["\u201C]([^"\u201D]{1,80})["\u201D]/i);
  if (quoted && cleanPiece(quoted[1])) return cleanPiece(quoted[1]);
  const field = text.match(
    /\btitle\s*[:=]\s*([^,;"\u201C\u201D]{1,80}?)\s*(?:[,;]|\s[-\u2013\u2014]\s|$)/i,
  );
  if (field && cleanPiece(field[1])) return cleanPiece(field[1]);
  const named = text.match(/\b(?:[Aa]dd|[Pp]ut|[Pp]lace)\s+(?:[Tt]he\s+)?title\s+([A-Z][^,;.]{0,60})/);
  if (named) {
    const piece = cleanPiece(named[1].replace(/\s+(?:on|onto|across|at)\s+(?:it|this|the\s+\w+)\s*$/i, ""));
    if (piece) return piece;
  }
  return null;
}

/** New quote / text for the box, e.g. "change the quote in the box to ...". */
export function extractOrderQuote(brief: string): string | null {
  const text = brief.trim().replace(/\s+/g, " ");
  const quoted = text.match(/\b(?:quote|text|words)\b[^"\u201C]{0,60}?["\u201C]([^"\u201D]{1,200})["\u201D]/i);
  if (quoted && cleanPiece(quoted[1])) return cleanPiece(quoted[1]);
  const plain = text.match(
    /\b(?:quote|text|words)\b.{0,40}?\bto\s*:?\s+(.+?)(?:\s*[,;]?\s+and\s+(?:change|make|swap|add|put|set|turn|use)\b|$)/i,
  );
  if (plain && cleanPiece(plain[1])) return cleanPiece(plain[1]);
  return null;
}

/** Prompt for the image EDIT of the selected Look photo. */
export function buildImageEditPrompt(input: {
  order: string;
  brandName?: string;
  palette: PaletteSwatch[];
}): string {
  const order = input.order.trim().replace(/\s+/g, " ");
  const lower = order.toLowerCase();
  const title = extractOrderTitle(order);
  const quote = extractOrderQuote(order);
  const albumArt = /\b(album art|album cover|album artwork|cover art|single cover|ep cover|cover)\b/.test(lower);
  const poster = /\b(poster|flyer)\b/.test(lower);
  const palette = input.palette.filter((p) => p.hex && p.name);
  return [
    `Edit the provided photo to carry out this order: "${order}".`,
    "This is an edit of that photo: keep its main subject recognizable, do not replace it with an unrelated picture.",
    albumArt ? "Compose it as a finished square (1:1) album cover." : "",
    poster ? "Compose it as a finished poster / flyer layout." : "",
    title
      ? `Render the title text "${title}" clearly on the piece, spelled exactly like that, in refined dark-luxury display typography.`
      : "",
    quote
      ? `Replace the quote / text in the box with exactly: "${quote}". Spell it exactly.`
      : "",
    palette.length
      ? `Color palette is locked to: ${palette.map((p) => `${p.name} ${p.hex}`).join(", ")}. Use only these colors for background, type, and accents.`
      : "",
    input.brandName ? `Artist / brand: ${input.brandName}.` : "",
    "Mood: dark luxury, inspiring, cinematic. Never cheap, never neon.",
    "Do not add any other text, logos, or watermarks beyond what the order asks for.",
  ]
    .filter(Boolean)
    .join(" ");
}
