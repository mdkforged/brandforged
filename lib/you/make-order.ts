/**
 * Make this: the one-line brief is an ORDER about the selected Look photo.
 * classifyBrief() decides whether it is a VISUAL order (album art, title or
 * text on the piece, change the quote / background, edit the image) or a
 * caption-only brief. parseImageOrder() reads exactly what the order asks
 * for (title, gold, placement, strict "no other changes"). Shared by client
 * and server - no browser APIs, no imports (unit-tested with node --test).
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
/** "titled ...", "gold font" - always about the picture. */
const STRONG_VISUAL_RE =
  /\btitled\b|\bgold(?:en)?\s+(?:font|type|text|letters|lettering|title|script)\b/i;
const ALBUM_ART_RE = /\balbum\s+(?:art|artwork|cover)\b/i;
const MIDDLE_RE = /\bin the (?:middle|center|centre)\b/i;
/** "no other adjustments" = title placement only. */
const STRICT_RE =
  /\bno other (?:adjustments?|changes?|edits?|alterations?)\b|\bnothing else\b|\b(?:do not|don'?t) change anything else\b|\bleave everything else\b/i;
const GOLD_RE = /\bgold(?:en)?\b/i;
const BRAND_TEXT_RE =
  /\b(?:tethered|mdk|artist name|my name|brand name|brand text|credit|credits|logo|signature)\b/i;

export function classifyBrief(brief: string): BriefKind {
  const text = brief.trim();
  if (!text) return "caption";
  if (TITLE_FIELD_RE.test(text)) return "visual";
  if (CAPTION_FIRST_RE.test(text)) return "caption";
  if (STRONG_VISUAL_RE.test(text) || STRICT_RE.test(text)) return "visual";
  // "add my name to the caption" is about words, not the picture.
  if (/\bcaption\b/i.test(text) && !IMAGE_WORD_RE.test(text)) return "caption";
  if (
    MAKE_INTO_RE.test(text) ||
    INTO_COVER_RE.test(text) ||
    CHANGE_RE.test(text) ||
    ADD_ON_RE.test(text) ||
    EDIT_PHOTO_RE.test(text) ||
    ALBUM_ART_RE.test(text) ||
    MIDDLE_RE.test(text)
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

/** Where an unquoted title ends: "... in gold font", "... in the middle", ", no other ...". */
const TITLE_STOP = String.raw`(?=\s+(?:in\s+(?:the|a|an|gold|golden|white|black|silver|bold)\b|in\s+\w+\s+(?:font|type|letters|lettering|text)\b|at\s+the\b|on\s+the\b|on\s+(?:it|this)\b|onto\b|across\b|with\b|using\b|centered\b|centred\b|no\s+other\b|and\s+(?:no|keep|leave|make|put|add|change)\b)|\s+[-\u2013\u2014]\s|\s*[,;.]|\s*$)`;
const TITLED_RE = new RegExp(
  String.raw`\btitled\s+([A-Za-z0-9][^,;"\u201C\u201D]{0,80}?)` + TITLE_STOP,
  "i",
);
const TITLE_FIELD_VALUE_RE = new RegExp(
  String.raw`\btitle\s*[:=]\s*([^,;"\u201C\u201D]{1,80}?)` + TITLE_STOP,
  "i",
);
const NAMED_TITLE_RE = new RegExp(
  String.raw`\b(?:add|put|place)\s+(?:the\s+)?title\s+([A-Za-z0-9][^,;."\u201C\u201D]{0,60}?)` + TITLE_STOP,
  "i",
);

/** Title the order wants on the piece, e.g. "titled Moment To Rise". */
export function extractOrderTitle(brief: string): string | null {
  const text = brief.trim().replace(/\s+/g, " ");
  const quoted = text.match(/\btitled?\s*[:=]?\s*["\u201C]([^"\u201D]{1,80})["\u201D]/i);
  if (quoted && cleanPiece(quoted[1])) return cleanPiece(quoted[1]);
  for (const re of [TITLE_FIELD_VALUE_RE, TITLED_RE, NAMED_TITLE_RE]) {
    const m = text.match(re);
    if (m && cleanPiece(m[1])) return cleanPiece(m[1]);
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

export type Placement = {
  center: boolean;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  /** Plain words for the prompt, e.g. "centered in the middle of the image". */
  phrase: string | null;
};

function parsePlacement(lower: string): Placement {
  const center =
    /\b(?:in the (?:middle|center|centre)|centered|centred|center|centre|middle)\b/.test(lower);
  const top =
    /\b(?:at the top|on the top|top of|top (?:left|right|center|centre|corner|edge)|upper)\b/.test(lower);
  const bottom =
    /\b(?:at the bottom|on the bottom|bottom of|bottom (?:left|right|center|centre|corner|edge)|lower (?:third|left|right))\b/.test(lower);
  const left =
    /\b(?:(?:on|to|at) the left|(?:top|bottom|upper|lower) left|left(?:[- ](?:side|corner|aligned|edge)))\b/.test(lower);
  const right =
    /\b(?:(?:on|to|at) the right|(?:top|bottom|upper|lower) right|right(?:[- ](?:side|corner|aligned|edge)))\b/.test(lower);
  const v = top ? "top" : bottom ? "bottom" : "";
  const h = left ? "left" : right ? "right" : "";
  let phrase: string | null = null;
  if (v && h) phrase = `in the ${v} ${h} corner of the image`;
  else if (v) phrase = `at the ${v}${center ? " center" : ""} of the image`;
  else if (h) phrase = `on the ${h} side of the image`;
  else if (center) phrase = "centered in the middle of the image, both horizontally and vertically";
  return { center, top, bottom, left, right, phrase };
}

export type ImageOrder = {
  title: string | null;
  quote: string | null;
  /** Gold type only when the brief says gold. */
  gold: boolean;
  placement: Placement;
  /** "no other adjustments" / "no other changes": text placement only. */
  strict: boolean;
  /** Brand / artist text only when the brief asks for it. */
  wantsBrandText: boolean;
  albumArt: boolean;
  poster: boolean;
};

export function parseImageOrder(brief: string): ImageOrder {
  const order = brief.trim().replace(/\s+/g, " ");
  const lower = order.toLowerCase();
  return {
    title: extractOrderTitle(order),
    quote: extractOrderQuote(order),
    gold: GOLD_RE.test(order),
    placement: parsePlacement(lower),
    strict: STRICT_RE.test(order),
    wantsBrandText: BRAND_TEXT_RE.test(order),
    albumArt: /\b(?:album art|album cover|album artwork|cover art|single cover|ep cover)\b/.test(lower) ||
      INTO_COVER_RE.test(order),
    poster: /\b(?:poster|flyer)\b/.test(lower),
  };
}

/** Always in the edit prompt: her face, eyes, skin, pose, and the lilies stay hers. */
export const PRESERVE_RULE =
  "Preserve the person exactly as in the original photo: same face and facial features, same eye color, same skin tone and skin texture, same hair, same pose and expression. Keep the white lilies (if present) exactly as they are. Do not retouch, beautify, recolor, reshape, or move any of these unless the order explicitly asks to change them.";

/** "No other adjustments": the only change is the requested text. */
export const STRICT_RULE =
  "STRICT: this is a text-placement-only edit. The only change is adding the requested text. Keep everything else pixel-faithful to the original photo: no background changes, no color grading, no lighting changes, no crop or reframing, no aspect ratio change, no style changes, no recoloring, no filters or effects.";

/** Prompt for the image EDIT of the selected Look photo. */
export function buildImageEditPrompt(input: {
  order: string;
  /** Context only - never rendered as text on the art. */
  brandName?: string;
  palette: PaletteSwatch[];
  /** Applied brand's one-line rule, e.g. "gold type only, no neon". */
  brandRule?: string;
}): string {
  const order = input.order.trim().replace(/\s+/g, " ");
  const o = parseImageOrder(order);
  const palette = input.palette.filter((p) => p.hex && p.name);
  const goldSwatch = palette.find((p) => /gold/i.test(p.name));
  const goldWords = goldSwatch
    ? `in a gold font (${goldSwatch.name} ${goldSwatch.hex})`
    : "in a gold font";

  const lines: string[] = [
    `Edit the provided photo to carry out this order exactly: "${order}".`,
    PRESERVE_RULE,
  ];

  if (o.strict) {
    lines.push(STRICT_RULE);
  } else {
    lines.push("Change only what the order asks for; keep everything else as it is in the original photo.");
    if (o.albumArt) lines.push("Present it as a finished square (1:1) album cover.");
    if (o.poster) lines.push("Present it as a finished poster / flyer layout.");
  }

  const textStyle = (what: string) => {
    let s = what;
    if (o.gold) s += `, ${goldWords}`;
    if (o.placement.phrase) s += `, placed ${o.placement.phrase}`;
    return `${s}. Clean, elegant, legible typography.`;
  };
  if (o.title) {
    lines.push(textStyle(`Add the title text "${o.title}", spelled exactly like that`));
  }
  if (o.quote) {
    lines.push(textStyle(`Replace the quote / text in the box with exactly "${o.quote}", spelled exactly`));
  }

  // Palette guides background / color changes only - never the type color,
  // and never in strict mode.
  if (!o.strict && palette.length) {
    lines.push(
      `For any background or color change the order asks for, use only this palette: ${palette
        .map((p) => `${p.name} ${p.hex}`)
        .join(", ")}. The palette does not set the text color.`,
    );
  }

  const rule = (input.brandRule || "").trim().replace(/[.\s]+$/, "");
  if (rule) {
    lines.push(
      o.strict
        ? `Brand rule, for the title styling only (nothing else changes): ${rule}.`
        : `Brand rule: ${rule}.`,
    );
  }

  if (!o.wantsBrandText) {
    lines.push(
      "Do not add an artist name, artist lockup, brand name, credit line, logo, signature, or watermark.",
    );
  }
  lines.push("Do not add any text other than what the order asks for.");
  return lines.join(" ");
}
