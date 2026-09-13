/**
 * Tethered & Truth Master Palette — locked from founder sheet.
 * Do not invent alternate T&T colors. Energy Strike greens are Brand Forged
 * platform defaults for OTHER creators; T&T always uses this sheet.
 */

export type MasterPaletteSwatch = {
  id:
    | "coreMood"
    | "primaryBase"
    | "skinTone"
    | "hairTone"
    | "accentGold"
    | "eyeColor";
  role: string;
  name: string;
  hex: string;
};

/** Sampled + locked from the official Master Palette sheet (2026-09-13). */
export const TETHERED_TRUTH_MASTER_PALETTE = {
  coreMood: {
    id: "coreMood" as const,
    role: "CORE MOOD",
    name: "Dark Luxury",
    hex: "#111010",
  },
  primaryBase: {
    id: "primaryBase" as const,
    role: "PRIMARY BASE",
    name: "Obsidian Black",
    hex: "#0c0c0d",
  },
  skinTone: {
    id: "skinTone" as const,
    role: "SKIN TONE",
    name: "Silver-Grey",
    hex: "#8a8179",
  },
  hairTone: {
    id: "hairTone" as const,
    role: "HAIR TONE",
    name: "Platinum Ash Blonde",
    hex: "#c4b5a4",
  },
  accentGold: {
    id: "accentGold" as const,
    role: "ACCENT GOLD",
    name: "Antique Gold",
    hex: "#ad885d",
  },
  eyeColor: {
    id: "eyeColor" as const,
    role: "EYE COLOR",
    name: "Sapphire Blue-Green",
    hex: "#3d7f78",
  },
} as const;

export const TETHERED_TRUTH_SWATCHES: readonly MasterPaletteSwatch[] = [
  TETHERED_TRUTH_MASTER_PALETTE.coreMood,
  TETHERED_TRUTH_MASTER_PALETTE.primaryBase,
  TETHERED_TRUTH_MASTER_PALETTE.skinTone,
  TETHERED_TRUTH_MASTER_PALETTE.hairTone,
  TETHERED_TRUTH_MASTER_PALETTE.accentGold,
  TETHERED_TRUTH_MASTER_PALETTE.eyeColor,
];

export const TETHERED_TRUTH_PALETTE_IMAGE =
  "/brand/tethered-truth-master-palette.png";

/** Kit token mapping for Identity Engine when brand is Tethered & Truth. */
export const TETHERED_TRUTH_KIT_TOKENS = {
  primaryHex: TETHERED_TRUTH_MASTER_PALETTE.accentGold.hex,
  secondaryHex: TETHERED_TRUTH_MASTER_PALETTE.coreMood.hex,
  accentHex: TETHERED_TRUTH_MASTER_PALETTE.eyeColor.hex,
  neutralHex: TETHERED_TRUTH_MASTER_PALETTE.skinTone.hex,
  backgroundHex: TETHERED_TRUTH_MASTER_PALETTE.primaryBase.hex,
  textHex: "#e8e4dc",
  hairToneHex: TETHERED_TRUTH_MASTER_PALETTE.hairTone.hex,
} as const;

export function isTetheredTruthBrand(brandName: string | null | undefined): boolean {
  if (!brandName) return false;
  const n = brandName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return (
    n.includes("tethered") ||
    n.includes("truth") ||
    n === "mdk" ||
    n.includes("tethered truth")
  );
}
