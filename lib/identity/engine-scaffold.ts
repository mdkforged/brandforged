/**
 * Playbook Identity Engine first-session scaffold (DR-2026-09-13-010).
 * Lifecycle from Master Playbook 2.8 — not an invented quiz bank.
 * Detailed Brand Onboarding shelf questions TBD when shelves hydrate.
 */

export type IdentityStage =
  | "discovery"
  | "generation"
  | "review"
  | "approval"
  | "activation";

export const IDENTITY_STAGES: readonly IdentityStage[] = [
  "discovery",
  "generation",
  "review",
  "approval",
  "activation",
] as const;

export const IDENTITY_STAGE_LABEL: Record<IdentityStage, string> = {
  discovery: "Discovery",
  generation: "Generation",
  review: "Review",
  approval: "Approval",
  activation: "Activation",
};

export type IdentityKit = {
  /** Brand Identity — Playbook */
  brandName: string;
  audience: string;
  industry: string;
  /** Communication / visual cues we already collect */
  contentStyle: string;
  referencePhotos: [string, string, string];
  socialSites: string[];
  /** Interim visual defaults until full Identity Engine generation exists */
  interimPalette: "forge-green";
  interimLogo: "/brand/logo-forge-green.webp";
  /** Lifecycle */
  stage: IdentityStage;
  approved: boolean;
  activated: boolean;
  activatedAt?: string;
  pickedForYou?: {
    brandName?: boolean;
    audience?: boolean;
    industry?: boolean;
    contentStyle?: boolean;
    photos?: boolean;
    socialSites?: boolean;
    approval?: boolean;
  };
  savedAt: string;
};

export const IDENTITY_STORAGE_KEY = "bf-identity-v1";
/** Keep reading old onboarding key for one release */
export const LEGACY_ONBOARDING_STORAGE_KEY = "bf-onboarding-v1";

export const IDENTITY_ROUTE_AFTER_ACTIVATION = "/you" as const;
export const REFERENCE_PHOTO_COUNT = 3;

/** You pick for me defaults — plain, reversible, not fake research. */
export const IDENTITY_PICKS = {
  brandName: "Tethered & Truth",
  audience: "Fans and listeners who want honest music and real stories",
  industry: "Music and personal brand",
  contentStyle:
    "Raw and honest - cinematic photos, real quotes, music-led videos, posts that feel like journal pages.",
  referencePhotos: [
    "/brand/logo-forge-green.webp",
    "/brand/logo-lumina-purple.webp",
    "/brand/logo-sapphire-blue-ember.webp",
  ] as [string, string, string],
} as const;

export const IDENTITY_COPY = {
  title: "Identity Engine",
  subtitle:
    "We'll forge your kit in Playbook order. Stuck? Tap You pick for me on any one.",
  pickForMe: "You pick for me",
  pickAll: "You pick for me on everything",
  continue: "Continue",
  back: "Back",
  brandNameLabel: "Brand name",
  brandNameHint: "Your name, stage name, or business - whatever you call it.",
  brandNamePlaceholder: "e.g. Tethered & Truth",
  audienceLabel: "Who is this for?",
  audienceHint: "Audience in plain words - Playbook Brand Identity.",
  audiencePlaceholder: "e.g. fans who want honest music",
  industryLabel: "Industry",
  industryHint: "Where you create and sell - Playbook Brand Identity.",
  industryPlaceholder: "e.g. Music and personal brand",
  contentStyleLabel: "Content style",
  contentStyleHint:
    "How you show up in photos, quotes, videos, posts - in your words.",
  contentStylePlaceholder:
    "e.g. raw and honest, bright and bold, quiet and cinematic",
  photosLabel: "Reference look",
  photosHint:
    "3 reference photos for photography style - or Brand Forged marks until you swap them.",
  photoSlotLabels: ["Photo 1", "Photo 2", "Photo 3"] as const,
  socialLabel: "Social sites",
  socialHint: "Where this identity will post - feeds Quick social templates.",
  reviewTitle: "Your kit (draft)",
  reviewHint:
    "Playbook Review - check the kit before approval. Nothing publishes yet.",
  approveLabel: "Approve this identity kit?",
  approveHint:
    "Playbook Approval - required before Activation. You pick for me = approve.",
  approveYes: "Approve kit",
  activateLabel: "Activate",
  activateHint:
    "Playbook Activation - this becomes the working identity for This is You.",
  activateCta: "Activate and open This is You",
  activating: "Activating...",
  firstSessionNote:
    "First-session promise: kit → approve look → templates → Brand Vault. Full shelf questions land when Brand Onboarding files hydrate.",
} as const;

export function stageIndex(stage: IdentityStage): number {
  return IDENTITY_STAGES.indexOf(stage);
}

export function nextStage(stage: IdentityStage): IdentityStage | null {
  const i = stageIndex(stage);
  if (i < 0 || i >= IDENTITY_STAGES.length - 1) return null;
  return IDENTITY_STAGES[i + 1]!;
}

export function prevStage(stage: IdentityStage): IdentityStage | null {
  const i = stageIndex(stage);
  if (i <= 0) return null;
  return IDENTITY_STAGES[i - 1]!;
}

export async function fileToReferenceDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 720;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare photo");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}