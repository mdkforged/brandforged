/**
 * Brand masters for Make this: three pockets (Brand 1 / 2 / 3), each with a
 * name, four locked hexes, and an optional one-line rule. Make this uses ONLY
 * the applied brand's master - no mixing, no fallback to other tokens.
 * Brand 1 is the Tethered & Truth master and can be refined, never emptied.
 */
import {
  TETHERED_TRUTH_KIT_TOKENS,
  TETHERED_TRUTH_MASTER_PALETTE,
} from "@/lib/brand/tethered-truth-palette";
import type { PaletteSwatch } from "@/lib/you/make-order";

export const BRAND_MASTERS_STORAGE_KEY = "bf-brand-masters-v1";
export const BRAND_PICK_STORAGE_KEY = "bf-make-brand-pick-v1";

export type BrandSlot = 1 | 2 | 3;
export const BRAND_SLOTS: readonly BrandSlot[] = [1, 2, 3];

export type BrandMaster = {
  name: string;
  backgroundHex: string;
  primaryHex: string;
  accentHex: string;
  textHex: string;
  /** Optional one-line rule, e.g. "gold type only, no neon, no extra logo". */
  rule: string;
};

export type BrandMasters = {
  1: BrandMaster;
  2: BrandMaster | null;
  3: BrandMaster | null;
};

export type BrandHexKey = "backgroundHex" | "primaryHex" | "accentHex" | "textHex";

export const BRAND_HEX_FIELDS: readonly { key: BrandHexKey; label: string }[] = [
  { key: "backgroundHex", label: "Background" },
  { key: "primaryHex", label: "Primary / gold" },
  { key: "accentHex", label: "Accent" },
  { key: "textHex", label: "Text" },
];

export const BRAND_NAME_MAX = 60;
export const BRAND_RULE_MAX = 160;

/** Brand 1 = the current Tethered & Truth master. */
export const BRAND_1_DEFAULT: BrandMaster = {
  name: "Tethered & Truth by MDK",
  backgroundHex: TETHERED_TRUTH_MASTER_PALETTE.primaryBase.hex,
  primaryHex: TETHERED_TRUTH_MASTER_PALETTE.accentGold.hex,
  accentHex: TETHERED_TRUTH_MASTER_PALETTE.eyeColor.hex,
  textHex: TETHERED_TRUTH_KIT_TOKENS.textHex,
  rule: "",
};

/** "#AbCdEf" / "abcdef" -> "#abcdef"; anything else -> null. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  const withHash = v.startsWith("#") ? v : `#${v}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : null;
}

export function isValidHex(value: unknown): boolean {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

/** Validate an untrusted master (localStorage or request body). */
export function parseBrandMaster(value: unknown): BrandMaster | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const name =
    typeof o.name === "string" ? o.name.trim().replace(/\s+/g, " ").slice(0, BRAND_NAME_MAX) : "";
  if (!name) return null;
  const backgroundHex = normalizeHex(o.backgroundHex);
  const primaryHex = normalizeHex(o.primaryHex);
  const accentHex = normalizeHex(o.accentHex);
  const textHex = normalizeHex(o.textHex);
  if (!backgroundHex || !primaryHex || !accentHex || !textHex) return null;
  const rule =
    typeof o.rule === "string" ? o.rule.trim().replace(/\s+/g, " ").slice(0, BRAND_RULE_MAX) : "";
  return { name, backgroundHex, primaryHex, accentHex, textHex, rule };
}

export type BrandDraft = {
  name: string;
  backgroundHex: string;
  primaryHex: string;
  accentHex: string;
  textHex: string;
  rule: string;
};

export function draftFromMaster(master: BrandMaster | null): BrandDraft {
  return master
    ? { ...master }
    : { name: "", backgroundHex: "", primaryHex: "", accentHex: "", textHex: "", rule: "" };
}

export type BrandDraftResult =
  | { ok: true; master: BrandMaster }
  | { ok: false; error: string };

/** Pocket form -> master, with visible errors. Brand 1 can't be emptied. */
export function validateBrandDraft(draft: BrandDraft, slot: BrandSlot): BrandDraftResult {
  const name = draft.name.trim().replace(/\s+/g, " ");
  if (!name) {
    return {
      ok: false,
      error:
        slot === 1
          ? "Brand 1 can't be emptied - keep its name."
          : `Give Brand ${slot} a name before saving.`,
    };
  }
  if (name.length > BRAND_NAME_MAX) {
    return { ok: false, error: `Keep the name under ${BRAND_NAME_MAX} characters.` };
  }
  const hexes: Partial<Record<BrandHexKey, string>> = {};
  for (const field of BRAND_HEX_FIELDS) {
    const hex = normalizeHex(draft[field.key]);
    if (!hex) {
      return {
        ok: false,
        error: `${field.label} must be a hex color like #0c0c0d (#RRGGBB).`,
      };
    }
    hexes[field.key] = hex;
  }
  const rule = draft.rule.trim().replace(/\s+/g, " ");
  if (rule.length > BRAND_RULE_MAX) {
    return { ok: false, error: `Keep the rule under ${BRAND_RULE_MAX} characters.` };
  }
  return {
    ok: true,
    master: {
      name,
      backgroundHex: hexes.backgroundHex as string,
      primaryHex: hexes.primaryHex as string,
      accentHex: hexes.accentHex as string,
      textHex: hexes.textHex as string,
      rule,
    },
  };
}

function defaultMasters(): BrandMasters {
  return { 1: { ...BRAND_1_DEFAULT }, 2: null, 3: null };
}

export function loadBrandMasters(): BrandMasters {
  if (typeof window === "undefined") return defaultMasters();
  try {
    const raw = window.localStorage.getItem(BRAND_MASTERS_STORAGE_KEY);
    if (!raw) return defaultMasters();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      1: parseBrandMaster(parsed["1"]) || { ...BRAND_1_DEFAULT },
      2: parseBrandMaster(parsed["2"]),
      3: parseBrandMaster(parsed["3"]),
    };
  } catch {
    return defaultMasters();
  }
}

/** Durable save: write, then read back and compare. Refuses an empty Brand 1. */
export function saveBrandMasters(masters: BrandMasters): boolean {
  if (typeof window === "undefined") return false;
  if (!parseBrandMaster(masters[1])) return false;
  const body = JSON.stringify({ 1: masters[1], 2: masters[2], 3: masters[3] });
  try {
    window.localStorage.setItem(BRAND_MASTERS_STORAGE_KEY, body);
    return window.localStorage.getItem(BRAND_MASTERS_STORAGE_KEY) === body;
  } catch {
    return false;
  }
}

/** Picked brand on this device; falls back to Brand 1 if the pick is empty. */
export function loadBrandPick(masters: BrandMasters): BrandSlot {
  if (typeof window === "undefined") return 1;
  try {
    const n = Number(window.localStorage.getItem(BRAND_PICK_STORAGE_KEY));
    if ((n === 2 || n === 3) && masters[n]) return n;
  } catch {
    /* ignore */
  }
  return 1;
}

export function saveBrandPick(slot: BrandSlot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRAND_PICK_STORAGE_KEY, String(slot));
  } catch {
    /* ignore */
  }
}

/** Palette for the image edit: only this master's four locked hexes. */
export function masterToPalette(master: BrandMaster): PaletteSwatch[] {
  return [
    { name: "Background", hex: master.backgroundHex },
    { name: "Primary / gold", hex: master.primaryHex },
    { name: "Accent", hex: master.accentHex },
    { name: "Text", hex: master.textHex },
  ];
}
