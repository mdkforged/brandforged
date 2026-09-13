export type OnboardingGoal = "you" | "world" | "both";

export type { SocialSiteId } from "@/lib/onboarding/social";
import type { SocialSiteId } from "@/lib/onboarding/social";
import { SOCIAL_PICK_DEFAULTS } from "@/lib/onboarding/social";

export type OnboardingAnswers = {
  /** Who they are / brand name - plain words. */
  aboutYou: string;
  /**
   * Intent is captured at signup (branding vs all-in-one).
   * Kept optional for older local payloads only.
   */
  whyHere?: string;
  /**
   * Where we open after setup - Brand Forged chooses this (never a user pick).
   * Always This is You for v1 signup access.
   */
  goal: OnboardingGoal;
  /** Content style - photos, quotes, videos, posts (one plain ask). */
  contentStyle: string;
  /**
   * Three reference photos that lock in "as you".
   * Data URLs for uploads, or /brand/... paths when we pick for them.
   */
  referencePhotos: [string, string, string];
  /** Social sites they'll post to - drives Quick social posts templates. */
  socialSites: SocialSiteId[];
  /** Which fields Brand Forged chose (DR-004: we work for the user). */
  pickedForYou?: {
    aboutYou?: boolean;
    contentStyle?: boolean;
    photos?: boolean;
    socialSites?: boolean;
  };
  savedAt: string;
};

export const ONBOARDING_STORAGE_KEY = "bf-onboarding-v1";
export const REFERENCE_PHOTO_COUNT = 3;

/**
 * Brand Forged chooses setup order - not the user.
 * After /start we open This is You (Your World is an upgrade).
 */
export const ONBOARDING_ROUTE_AFTER_SETUP = "/you" as const;
export const ONBOARDING_LOCKED_GOAL: OnboardingGoal = "you";

/** Solid defaults when they tap "You pick for me" on any ask. */
export const ONBOARDING_PICKS = {
  aboutYou: "Tethered & Truth",
  contentStyle:
    "Raw and honest - cinematic photos, real quotes, music-led videos, posts that feel like journal pages.",
  referencePhotos: [
    "/brand/logo-forge-green.webp",
    "/brand/logo-lumina-purple.webp",
    "/brand/logo-sapphire-blue-ember.webp",
  ] as [string, string, string],
  socialSites: SOCIAL_PICK_DEFAULTS as SocialSiteId[],
} as const;

/**
 * Identity-only questions after signup packaging.
 * Intent (why / branding vs business) lives on Create account - not repeated here.
 * Every ask has You pick for me (DR-004).
 */
export const ONBOARDING_COPY = {
  title: "A couple of quick questions",
  subtitle:
    "We'll set up how you look and post. Stuck? Tap You pick for me on any one.",
  stepOf: (n: number, total: number) => "Step " + n + " of " + total,
  step1Label: "Who you are",
  step2Label: "Look and posts",
  continue: "Continue",
  back: "Back",
  pickForMe: "You pick for me",
  pickAll: "You pick for me on everything",
  aboutYouLabel: "Who are we building for?",
  aboutYouHint: "Your name, stage name, or business - whatever you call it.",
  aboutYouPlaceholder: "e.g. Tethered & Truth",
  contentStyleLabel: "What's your content style?",
  contentStyleHint:
    "How you show up in photos, quotes, videos, posts - in your words.",
  contentStylePlaceholder:
    "e.g. raw and honest, bright and bold, quiet and cinematic",
  photosLabel: "Lock in as you",
  photosHint:
    "Upload 3 reference photos - or let us start you with Brand Forged marks until you swap them.",
  photoSlotLabels: ["Photo 1", "Photo 2", "Photo 3"] as const,
  socialLabel: "What social sites will you be using?",
  socialHint:
    "Check the ones you post on. Quick social posts will open templates for each.",
  submit: "Set it up for me",
  submitting: "Setting up...",
} as const;

/** Shrink a photo for local lock-in storage (v1). */
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
  if (!ctx) {
    throw new Error("Could not prepare photo");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}