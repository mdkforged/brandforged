/**
 * Constrained locked kit generation (DR-015).
 * Kit tokens come ONLY from Brand Input via closed mapping tables.
 * No freeform LLM / no invented prose.
 */

import {
  getEnergyStrike,
  type EnergyStrikeId,
} from "@/lib/brand/energy-strike";
import {
  isTetheredTruthBrand,
  TETHERED_TRUTH_KIT_TOKENS,
} from "@/lib/brand/tethered-truth-palette";
import type {
  BrandInputSet,
  ColorPreference,
  LogoStylePreference,
} from "@/lib/identity/engine-scaffold";

export type LockedBrandKitTokens = {
  energyStrikeId: EnergyStrikeId;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  neutralHex: string;
  backgroundHex: string;
  textHex: string;
  fontPairing: { display: string; body: string };
  voiceTone: string[];
  logoDirection: LogoStylePreference;
  moodTags: string[];
};

export type LockedBrandKit = {
  paletteLabel: string;
  typographyLabel: string;
  logoLabel: string;
  voiceLabel: string;
  templatePackLabel: string;
  styleGuideLabel: string;
  tokens: LockedBrandKitTokens;
  lockedAt: string;
  source: "identity-engine-v1";
};

/** Plain UI labels (no forge metaphor names). */
const STRIKE_UI_LABEL: Record<EnergyStrikeId, string> = {
  "forge-green": "Bright green",
  "sapphire-blue": "Sapphire blue",
  "lumina-purple": "Lumina purple",
  "solar-gold": "Solar gold",
  "ember-red": "Ember red",
  "ion-silver": "Ion silver",
};

const COLOR_PREF_UI: Record<Exclude<ColorPreference, ""> | "default", string> = {
  warm: "Warm",
  cool: "Cool",
  neutral: "Neutral",
  bold: "Bold",
  default: "Platform default",
};

/** Closed companion palette per Energy Strike (deterministic). */
const COMPANION_HEX: Record<
  EnergyStrikeId,
  {
    secondaryHex: string;
    accentHex: string;
    neutralHex: string;
    backgroundHex: string;
    textHex: string;
  }
> = {
  "forge-green": {
    secondaryHex: "#1a2e14",
    accentHex: "#e8ffe4",
    neutralHex: "#9aa896",
    backgroundHex: "#070908",
    textHex: "#f4f6f2",
  },
  "sapphire-blue": {
    secondaryHex: "#0f1c2e",
    accentHex: "#d6eaff",
    neutralHex: "#8fa3b8",
    backgroundHex: "#07090c",
    textHex: "#f2f5f8",
  },
  "lumina-purple": {
    secondaryHex: "#1c1028",
    accentHex: "#f0dfff",
    neutralHex: "#a896b8",
    backgroundHex: "#0a070e",
    textHex: "#f6f2f8",
  },
  "solar-gold": {
    secondaryHex: "#2a220c",
    accentHex: "#fff4d0",
    neutralHex: "#b8ae8f",
    backgroundHex: "#0c0a07",
    textHex: "#f8f6f0",
  },
  "ember-red": {
    secondaryHex: "#2a1010",
    accentHex: "#ffd6d6",
    neutralHex: "#b89898",
    backgroundHex: "#0c0707",
    textHex: "#f8f2f2",
  },
  "ion-silver": {
    secondaryHex: "#1a1c1a",
    accentHex: "#f2f4f2",
    neutralHex: "#a8aca8",
    backgroundHex: "#080908",
    textHex: "#f4f6f4",
  },
};

type FontPairing = {
  id: string;
  display: string;
  body: string;
  label: string;
};

/** Closed font pairing allowlist. */
export const FONT_PAIRING_ALLOWLIST: readonly FontPairing[] = [
  {
    id: "clean-modern",
    display: "Space Grotesk",
    body: "Inter",
    label: "Clean modern",
  },
  {
    id: "editorial",
    display: "Playfair Display",
    body: "Source Sans 3",
    label: "Editorial",
  },
  {
    id: "friendly",
    display: "DM Sans",
    body: "IBM Plex Sans",
    label: "Friendly sans",
  },
  {
    id: "bold-condensed",
    display: "Oswald",
    body: "Roboto",
    label: "Bold condensed",
  },
  {
    id: "luxury",
    display: "Cormorant Garamond",
    body: "Lato",
    label: "Luxury editorial",
  },
  {
    id: "tech",
    display: "JetBrains Mono",
    body: "Inter",
    label: "Tech mono",
  },
] as const;

/** Closed voice-tone tags (sanitized output only). */
export const VOICE_TONE_ALLOWLIST = [
  "raw",
  "direct",
  "honest",
  "clear",
  "cinematic",
  "dramatic",
  "warm",
  "inviting",
  "bold",
  "confident",
  "minimal",
  "precise",
  "refined",
  "elevated",
  "friendly",
  "approachable",
  "technical",
  "playful",
  "calm",
  "energetic",
] as const;

export type VoiceToneTag = (typeof VOICE_TONE_ALLOWLIST)[number];

/** Closed mood-word allowlist → tags + voice + preferred pairing. */
const MOOD_WORD_MAP: Record<
  string,
  { tags: string[]; voice: VoiceToneTag[]; pairingId: string }
> = {
  raw: { tags: ["raw"], voice: ["raw", "direct"], pairingId: "clean-modern" },
  honest: {
    tags: ["honest"],
    voice: ["honest", "clear"],
    pairingId: "clean-modern",
  },
  cinematic: {
    tags: ["cinematic"],
    voice: ["cinematic", "dramatic"],
    pairingId: "editorial",
  },
  warm: { tags: ["warm"], voice: ["warm", "inviting"], pairingId: "friendly" },
  bold: {
    tags: ["bold"],
    voice: ["bold", "confident"],
    pairingId: "bold-condensed",
  },
  minimal: {
    tags: ["minimal"],
    voice: ["minimal", "precise"],
    pairingId: "clean-modern",
  },
  luxury: {
    tags: ["luxury"],
    voice: ["refined", "elevated"],
    pairingId: "luxury",
  },
  friendly: {
    tags: ["friendly"],
    voice: ["friendly", "approachable"],
    pairingId: "friendly",
  },
  tech: {
    tags: ["tech"],
    voice: ["technical", "clear"],
    pairingId: "tech",
  },
  playful: {
    tags: ["playful"],
    voice: ["playful", "friendly"],
    pairingId: "friendly",
  },
  calm: { tags: ["calm"], voice: ["calm", "clear"], pairingId: "editorial" },
  energetic: {
    tags: ["energetic"],
    voice: ["energetic", "bold"],
    pairingId: "bold-condensed",
  },
  confident: {
    tags: ["confident"],
    voice: ["confident", "direct"],
    pairingId: "bold-condensed",
  },
  refined: {
    tags: ["refined"],
    voice: ["refined", "precise"],
    pairingId: "luxury",
  },
  clear: { tags: ["clear"], voice: ["clear", "direct"], pairingId: "clean-modern" },
  dramatic: {
    tags: ["dramatic"],
    voice: ["dramatic", "cinematic"],
    pairingId: "editorial",
  },
  inviting: {
    tags: ["inviting"],
    voice: ["inviting", "warm"],
    pairingId: "friendly",
  },
  modern: {
    tags: ["modern"],
    voice: ["clear", "confident"],
    pairingId: "clean-modern",
  },
  classic: {
    tags: ["classic"],
    voice: ["refined", "calm"],
    pairingId: "editorial",
  },
};

const LOGO_UI: Record<LogoStylePreference, string> = {
  wordmark: "Wordmark",
  icon: "Icon",
  combo: "Combo mark",
};

const VOICE_SET = new Set<string>(VOICE_TONE_ALLOWLIST);

function splitMoodWords(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[,;/|]+|\s+/)
    .map((w) => w.trim().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean);
}

/** Map a raw token to a known mood key: exact, then includes nearest. */
function resolveMoodKey(token: string): string | null {
  if (MOOD_WORD_MAP[token]) return token;
  for (const key of Object.keys(MOOD_WORD_MAP)) {
    if (token.includes(key) || key.includes(token)) return key;
  }
  return null;
}

function pickEnergyStrike(
  colorPreference: ColorPreference,
  moodTags: string[],
): EnergyStrikeId {
  const has = (t: string) => moodTags.includes(t);
  switch (colorPreference) {
    case "warm":
      return has("luxury") || has("cinematic") || has("refined")
        ? "solar-gold"
        : "ember-red";
    case "cool":
      return has("luxury") || has("minimal") || has("refined")
        ? "lumina-purple"
        : "sapphire-blue";
    case "neutral":
      return "ion-silver";
    case "bold":
      return "forge-green";
    case "":
    default:
      return "forge-green";
  }
}

function pickFontPairing(moodKeys: string[]): FontPairing {
  const votes = new Map<string, number>();
  for (const key of moodKeys) {
    const entry = MOOD_WORD_MAP[key];
    if (!entry) continue;
    votes.set(entry.pairingId, (votes.get(entry.pairingId) ?? 0) + 1);
  }
  let bestId = "clean-modern";
  let bestScore = -1;
  for (const [id, score] of votes) {
    if (score > bestScore) {
      bestId = id;
      bestScore = score;
    }
  }
  return (
    FONT_PAIRING_ALLOWLIST.find((p) => p.id === bestId) ??
    FONT_PAIRING_ALLOWLIST[0]!
  );
}

function collectVoiceAndTags(moodKeys: string[]): {
  moodTags: string[];
  voiceTone: string[];
} {
  const moodTags: string[] = [];
  const voice: string[] = [];
  for (const key of moodKeys) {
    const entry = MOOD_WORD_MAP[key];
    if (!entry) continue;
    for (const t of entry.tags) {
      if (!moodTags.includes(t)) moodTags.push(t);
    }
    for (const v of entry.voice) {
      if (VOICE_SET.has(v) && !voice.includes(v)) voice.push(v);
    }
  }
  if (moodTags.length === 0) moodTags.push("clear");
  let voiceTone = voice.slice(0, 5);
  if (voiceTone.length < 3) {
    for (const fallback of ["clear", "confident", "direct"] as VoiceToneTag[]) {
      if (voiceTone.length >= 3) break;
      if (!voiceTone.includes(fallback)) voiceTone.push(fallback);
    }
  }
  if (voiceTone.length > 5) voiceTone = voiceTone.slice(0, 5);
  return { moodTags, voiceTone };
}

/**
 * Deterministic locked kit from Brand Input only.
 * Unknown mood words are dropped or nearest-matched via includes — never invented open prose.
 */
export function generateLockedKit(input: BrandInputSet): LockedBrandKit {
  const tokens = splitMoodWords(input.moodWords);
  const moodKeys: string[] = [];
  for (const token of tokens) {
    const key = resolveMoodKey(token);
    if (key && !moodKeys.includes(key)) moodKeys.push(key);
  }

  const { moodTags, voiceTone } = collectVoiceAndTags(moodKeys);
  const pairing = pickFontPairing(moodKeys);
  const prefKey =
    input.colorPreference === "" ? "default" : input.colorPreference;
  const prefLabel = COLOR_PREF_UI[prefKey];

  // Tethered & Truth always uses the founder Master Palette sheet.
  if (isTetheredTruthBrand(input.brandName)) {
    const ttMood = Array.from(
      new Set(["cinematic", "raw", "honest", ...moodTags]),
    ).slice(0, 6);
    return {
      paletteLabel: "Tethered & Truth Master Palette · Dark Luxury",
      typographyLabel: `${pairing.label} (${pairing.display} / ${pairing.body})`,
      logoLabel: `Logo · ${LOGO_UI[input.logoStyle]}`,
      voiceLabel: voiceTone.join(", "),
      templatePackLabel: "Social template pack (palette-locked)",
      styleGuideLabel: "Tethered & Truth Master Palette",
      tokens: {
        energyStrikeId: "sapphire-blue",
        primaryHex: TETHERED_TRUTH_KIT_TOKENS.primaryHex,
        secondaryHex: TETHERED_TRUTH_KIT_TOKENS.secondaryHex,
        accentHex: TETHERED_TRUTH_KIT_TOKENS.accentHex,
        neutralHex: TETHERED_TRUTH_KIT_TOKENS.neutralHex,
        backgroundHex: TETHERED_TRUTH_KIT_TOKENS.backgroundHex,
        textHex: TETHERED_TRUTH_KIT_TOKENS.textHex,
        fontPairing: { display: pairing.display, body: pairing.body },
        voiceTone,
        logoDirection: input.logoStyle,
        moodTags: ttMood,
      },
      lockedAt: new Date().toISOString(),
      source: "identity-engine-v1",
    };
  }

  const energyStrikeId = pickEnergyStrike(input.colorPreference, moodTags);
  const strike = getEnergyStrike(energyStrikeId);
  const companions = COMPANION_HEX[energyStrikeId];
  const strikeLabel = STRIKE_UI_LABEL[energyStrikeId];

  return {
    paletteLabel: `${prefLabel} palette · ${strikeLabel}`,
    typographyLabel: `${pairing.label} (${pairing.display} / ${pairing.body})`,
    logoLabel: `Logo · ${LOGO_UI[input.logoStyle]}`,
    voiceLabel: voiceTone.join(", "),
    templatePackLabel: "Social template pack (palette-locked)",
    styleGuideLabel: "One-page style guide",
    tokens: {
      energyStrikeId,
      primaryHex: strike.hex,
      secondaryHex: companions.secondaryHex,
      accentHex: companions.accentHex,
      neutralHex: companions.neutralHex,
      backgroundHex: companions.backgroundHex,
      textHex: companions.textHex,
      fontPairing: { display: pairing.display, body: pairing.body },
      voiceTone,
      logoDirection: input.logoStyle,
      moodTags,
    },
    lockedAt: new Date().toISOString(),
    source: "identity-engine-v1",
  };
}
