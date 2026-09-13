/**
 * Canon Identity Engine / Brand Onboarding (DR-011).
 * Source: Master Brand System v1.0 section 2.3 Input Set + Workflow 4.2.
 */

export type LogoStylePreference = "wordmark" | "icon" | "combo";
export type ColorPreference = "warm" | "cool" | "neutral" | "bold" | "";

/** Layer 2 post-kit first deliverable (not Brand Input). */
export type FirstMakeChoice =
  | "logo"
  | "identity_guide"
  | "social"
  | "website";

/** Workflow 4.2 stages */
export type OnboardingStage =
  | "brief"
  | "engine_run"
  | "kit_review"
  | "sticker_book"
  | "first_template"
  | "export_publish"
  | "brand_vault";

export const ONBOARDING_STAGES: readonly OnboardingStage[] = [
  "brief",
  "engine_run",
  "kit_review",
  "sticker_book",
  "first_template",
  "export_publish",
  "brand_vault",
] as const;

export const ONBOARDING_STAGE_LABEL: Record<OnboardingStage, string> = {
  brief: "Welcome and Brief",
  engine_run: "Building workspace",
  kit_review: "Brand Kit Review",
  sticker_book: "Sticker Book Activated",
  first_template: "First Template",
  export_publish: "Export and Publish",
  brand_vault: "Brand Vault Saved",
};

/** 5-question Brand Input Set (+ optional color) */
export type BrandInputSet = {
  brandName: string;
  industry: string;
  audience: string;
  moodWords: string;
  logoStyle: LogoStylePreference;
  colorPreference: ColorPreference;
};

export type BrandKitDraft = {
  paletteLabel: string;
  typographyLabel: string;
  logoLabel: string;
  voiceLabel: string;
  templatePackLabel: string;
  styleGuideLabel: string;
};

export type IdentitySession = {
  input: BrandInputSet;
  kit: BrandKitDraft;
  stage: OnboardingStage;
  approved: boolean;
  vaultSaved: boolean;
  /** Post-kit routing choice (Layer 2) - not part of Brand Input. */
  firstMake?: FirstMakeChoice;
  pickedForYou?: Partial<Record<keyof BrandInputSet | "approval" | "firstMake", boolean>>;
  socialSites?: string[];
  referencePhotos?: [string, string, string];
  savedAt: string;
  activatedAt?: string;
};

export const IDENTITY_STORAGE_KEY = "bf-identity-v1";
export const LEGACY_ONBOARDING_STORAGE_KEY = "bf-onboarding-v1";
export const IDENTITY_ROUTE_AFTER_ACTIVATION = "/you" as const;

export const FIRST_MAKE_DEFAULT: FirstMakeChoice = "social";

export const FIRST_MAKE_OPTIONS: {
  id: FirstMakeChoice;
  label: string;
  cta: string;
  href: "/you" | "/you/posts";
}[] = [
  { id: "logo", label: "Logo", cta: "Continue: Logo", href: "/you" },
  {
    id: "identity_guide",
    label: "Brand Identity Guide",
    cta: "Continue: Brand Identity Guide",
    href: "/you",
  },
  {
    id: "social",
    label: "Social Media Assets",
    cta: "Continue: Social media assets",
    href: "/you/posts",
  },
  {
    id: "website",
    label: "Website Design",
    cta: "Continue: Website design",
    href: "/you",
  },
];

export function routeForFirstMake(firstMake: FirstMakeChoice): "/you" | "/you/posts" {
  const opt = FIRST_MAKE_OPTIONS.find((o) => o.id === firstMake);
  return opt?.href ?? "/you";
}

export function labelForFirstMake(firstMake: FirstMakeChoice): string {
  return FIRST_MAKE_OPTIONS.find((o) => o.id === firstMake)?.label ?? "Your first make";
}

export function ctaForFirstMake(firstMake: FirstMakeChoice): string {
  return (
    FIRST_MAKE_OPTIONS.find((o) => o.id === firstMake)?.cta ??
    "Continue on This is You"
  );
}

export const BRAND_INPUT_PICKS: BrandInputSet = {
  brandName: "Tethered and Truth",
  industry: "Music and personal brand",
  audience:
    "Fans and listeners who want honest music, real stories, and cinematic posts.",
  moodWords: "raw, honest, cinematic, warm, bold",
  logoStyle: "combo",
  colorPreference: "cool",
};

export const LOGO_STYLE_OPTIONS: {
  id: LogoStylePreference;
  label: string;
  detail: string;
}[] = [
  { id: "wordmark", label: "Wordmark", detail: "Name as the mark." },
  { id: "icon", label: "Icon", detail: "Symbol-first mark." },
  { id: "combo", label: "Combo", detail: "Icon + wordmark together." },
];

export const COLOR_PREF_OPTIONS: {
  id: Exclude<ColorPreference, "">;
  label: string;
}[] = [
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "neutral", label: "Neutral" },
  { id: "bold", label: "Bold" },
];

export const IDENTITY_COPY = {
  title: "Brand Onboarding",
  subtitle:
    "Five questions. Then we forge your kit. Stuck? Tap You pick for me.",
  pickForMe: "You pick for me",
  pickAll: "You pick for me on everything",
  continue: "Continue",
  back: "Back",
  brandNameLabel: "1. Brand name",
  industryLabel: "2. Industry / niche",
  audienceLabel: "3. Audience (1-2 sentences)",
  moodLabel: "4. Mood words (3-5 keywords)",
  logoLabel: "5. Logo style preference",
  colorLabel: "Color preference (optional)",
  engineRunTitle: "Building your custom brand workspace...",
  engineRunBody:
    "Hang tight - we're assembling your draft kit from your brief.",
  engineRunProgress: "Generating palette, type, logo set, and voice guide...",
  reviewTitle: "Brand Kit Review",
  reviewHint: "Approve palette, fonts, and logo before stickers activate.",
  approveYes: "Approve kit",
  stickerTitle: "Sticker Book Activated",
  stickerBody:
    "Stickers will auto-skin to your approved tokens. Full canvas ships with the Sticker Book engine.",
  templateTitle: "First Template",
  templateBody:
    "Create your first branded post from palette-locked templates.",
  templateCta: "Open Quick social posts",
  exportTitle: "Export and Publish",
  exportBody:
    "Export Router will send assets to platform destinations after Palette Enforcement.",
  vaultTitle: "Brand Vault Saved",
  vaultBody: "Archive this kit to your Brand Vault and open This is You.",
  firstMakeLabel: "What do you want to make first?",
  firstMakeHint:
    "After your kit is saved, we'll take you to the right place. This is not one of the five Brand Input questions.",
  vaultCta: "Save to Brand Vault",
  saving: "Saving...",
  pipelineNote:
    "Pipeline: Brand Input -> Identity Engine -> Photo Transformation -> Palette Enforcement -> Sticker Book -> Export Router -> Brand Vault",
} as const;

/** Deterministic draft kit until real generation exists - derived from Input Set only. */
export function draftKitFromInput(input: BrandInputSet): BrandKitDraft {
  const mood = input.moodWords.trim() || "clear, confident";
  const color = input.colorPreference || "neutral";
  return {
    paletteLabel: `Draft palette (${color}) for ${input.brandName}`,
    typographyLabel: `Type system tuned to mood: ${mood}`,
    logoLabel: `Logo set - ${input.logoStyle} style`,
    voiceLabel: `Voice guide for ${input.industry} / ${input.audience.slice(0, 80)}`,
    templatePackLabel: "Social template pack (palette-locked)",
    styleGuideLabel: "One-page style guide (PDF pending engine)",
  };
}

export function stageIndex(stage: OnboardingStage): number {
  return ONBOARDING_STAGES.indexOf(stage);
}

export function nextStage(stage: OnboardingStage): OnboardingStage | null {
  const i = stageIndex(stage);
  if (i < 0 || i >= ONBOARDING_STAGES.length - 1) return null;
  return ONBOARDING_STAGES[i + 1]!;
}

export function prevStage(stage: OnboardingStage): OnboardingStage | null {
  const i = stageIndex(stage);
  if (i <= 0) return null;
  return ONBOARDING_STAGES[i - 1]!;
}

export function briefReady(input: BrandInputSet): boolean {
  return (
    input.brandName.trim().length > 0 &&
    input.industry.trim().length > 0 &&
    input.audience.trim().length > 0 &&
    input.moodWords.trim().length > 0 &&
    Boolean(input.logoStyle)
  );
}
