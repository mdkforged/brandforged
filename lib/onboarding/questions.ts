/**
 * Compatibility shim — Identity Engine scaffold lives in lib/identity/engine-scaffold.ts.
 * Social + legacy onboarding readers still import from here.
 */
export type { SocialSiteId } from "@/lib/onboarding/social";
export { SOCIAL_PICK_DEFAULTS } from "@/lib/onboarding/social";
export {
  IDENTITY_STORAGE_KEY as ONBOARDING_STORAGE_KEY,
  LEGACY_ONBOARDING_STORAGE_KEY,
  IDENTITY_ROUTE_AFTER_ACTIVATION as ONBOARDING_ROUTE_AFTER_SETUP,
  REFERENCE_PHOTO_COUNT,
  fileToReferenceDataUrl,
  IDENTITY_PICKS,
} from "@/lib/identity/engine-scaffold";

/** @deprecated use IdentityKit — kept for LockedAsYouPhotos readers */
export type OnboardingAnswers = {
  aboutYou: string;
  whyHere?: string;
  goal?: "you" | "world" | "both";
  contentStyle: string;
  referencePhotos: [string, string, string];
  socialSites: import("@/lib/onboarding/social").SocialSiteId[];
  pickedForYou?: Record<string, boolean | undefined>;
  savedAt: string;
};