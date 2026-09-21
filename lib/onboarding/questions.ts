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

/** Primary look slots shown first; array may hold more via Look + Add photo. */
export const REFERENCE_PHOTO_COUNT = 3 as const;

/** Resize look photos before save so phone uploads fit in localStorage. */
export async function fileToReferenceDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image load failed"));
      image.src = objectUrl;
    });
    const maxWidth = 1200;
    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
  referencePhotos: string[];
  socialSites: import("@/lib/onboarding/social").SocialSiteId[];
  pickedForYou?: Record<string, boolean | undefined>;
  savedAt: string;
  /** DR-011 fields when present */
  brandName?: string;
  input?: import("@/lib/identity/engine-scaffold").BrandInputSet;
  kit?: import("@/lib/identity/engine-scaffold").LockedBrandKit;
};
