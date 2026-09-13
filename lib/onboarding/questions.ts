/**
 * Compatibility shim - Identity Engine scaffold lives in lib/identity/engine-scaffold.ts.
 * Social + legacy onboarding readers still import from here.
 *
 * Canon DR-011 Brand Input Set (5 + optional color):
 * brandName, industry, audience, moodWords, logoStyle; colorPreference optional.
 */
export type { SocialSiteId } from "@/lib/onboarding/social";
export { SOCIAL_PICK_DEFAULTS } from "@/lib/onboarding/social";
export {
  IDENTITY_STORAGE_KEY as ONBOARDING_STORAGE_KEY,
  LEGACY_ONBOARDING_STORAGE_KEY,
  IDENTITY_ROUTE_AFTER_ACTIVATION as ONBOARDING_ROUTE_AFTER_SETUP,
  BRAND_INPUT_PICKS,
  type BrandInputSet,
  type BrandKitDraft,
  type IdentitySession,
  type LockedBrandKit,
  type OnboardingStage,
} from "@/lib/identity/engine-scaffold";

/** Legacy alias - prefer BRAND_INPUT_PICKS */
export { BRAND_INPUT_PICKS as IDENTITY_PICKS } from "@/lib/identity/engine-scaffold";

/** @deprecated photos no longer collected in DR-011 brief; bridge keeps 3 placeholders */
export const REFERENCE_PHOTO_COUNT = 3 as const;

/** @deprecated kept for any leftover upload helpers */
export async function fileToReferenceDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Bridge shape for LockedAsYouPhotos / Quick posts.
 * Prefer IdentitySession.input.brandName + kit from engine-scaffold.
 */
export type OnboardingAnswers = {
  aboutYou: string;
  whyHere?: string;
  goal?: "you" | "world" | "both";
  contentStyle: string;
  referencePhotos: [string, string, string];
  socialSites: import("@/lib/onboarding/social").SocialSiteId[];
  pickedForYou?: Record<string, boolean | undefined>;
  savedAt: string;
  /** DR-011 fields when present */
  brandName?: string;
  input?: import("@/lib/identity/engine-scaffold").BrandInputSet;
  kit?: import("@/lib/identity/engine-scaffold").LockedBrandKit;
};
