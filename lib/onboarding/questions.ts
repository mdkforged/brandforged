export type OnboardingGoal = "you" | "world" | "both";

export type { SocialSiteId } from "@/lib/onboarding/social";
import type { SocialSiteId } from "@/lib/onboarding/social";
import { SOCIAL_PICK_DEFAULTS } from "@/lib/onboarding/social";

export type OnboardingAnswers = {
  /** Who they are / brand name — plain words. */
  aboutYou: string;
  /** Why they're here / what they're looking to do. */
  whyHere: string;
  /**
   * Where we open after setup — Brand Forged chooses this (never a user pick).
   * Always both doors / home for v1.
   */
  goal: OnboardingGoal;
  /** Content style — photos, quotes, videos, posts (one plain ask). */
  contentStyle: string;
  /**
   * Three reference photos that lock in "as you".
   * Data URLs for uploads, or /brand/... paths when we pick for them.
   */
  referencePhotos: [string, string, string];
  /** Social sites they'll post to — drives Quick social posts templates. */
  socialSites: SocialSiteId[];
  /** Which fields Brand Forged chose (DR-004: we work for the user). */
  pickedForYou?: {
    aboutYou?: boolean;
    whyHere?: boolean;
    contentStyle?: boolean;
    photos?: boolean;
    socialSites?: boolean;
  };
  savedAt: string;
};

export const ONBOARDING_STORAGE_KEY = "bf-onboarding-v1";
export const REFERENCE_PHOTO_COUNT = 3;

/**
 * Brand Forged chooses setup order — not the user.
 * After /start we always open home with both doors ready.
 */
export const ONBOARDING_ROUTE_AFTER_SETUP = "/" as const;
export const ONBOARDING_LOCKED_GOAL: OnboardingGoal = "both";

/** Solid defaults when they tap "You pick for me" on any ask. */
export const ONBOARDING_PICKS = {
  aboutYou: "Tethered & Truth",
  whyHere:
    "Lock in my look and voice, post without the overwhelm, and keep the business side moving — in one place.",
  contentStyle:
    "Raw and honest — cinematic photos, real quotes, music-led videos, posts that feel like journal pages.",
  referencePhotos: [
    "/brand/logo-forge-green.webp",
    "/brand/logo-lumina-purple.webp",
    "/brand/logo-sapphire-blue-ember.webp",
  ] as [string, string, string],
  socialSites: SOCIAL_PICK_DEFAULTS as SocialSiteId[],
} as const;

/**
 * Quick direct questions. Answers make Brand Forged work for the client —
 * we set things up; they don't fill a long form (DR-004).
 * Every ask has "You pick for me" so they are never stuck without an answer.
 * Setup order is ours — never offered as a choice.
 */
export const ONBOARDING_COPY = {
  title: "A couple of quick questions",
  subtitle:
    "We'll set things up from your answers. Stuck? Tap You pick for me on any one.",
  pickForMe: "You pick for me",
  pickAll: "You pick for me on everything",
  aboutYouLabel: "Who are we building for?",
  aboutYouHint: "Your name, stage name, or business — whatever you call it.",
  aboutYouPlaceholder: "e.g. Tethered & Truth",
  whyHereLabel: "Why are you here?",
  whyHereHint: "What are you looking to do — in plain words.",
  whyHerePlaceholder:
    "e.g. lock in my look, post faster, run the business side",
  contentStyleLabel: "What's your content style?",
  contentStyleHint:
    "How you show up in photos, quotes, videos, posts — in your words.",
  contentStylePlaceholder:
    "e.g. raw and honest, bright and bold, quiet and cinematic",
  photosLabel: "Lock in as you",
  photosHint:
    "Upload 3 reference photos — or let us start you with Brand Forged marks until you swap them.",
  photoSlotLabels: ["Photo 1", "Photo 2", "Photo 3"] as const,
  socialLabel: "What social sites will you be using?",
  socialHint:
    "Check the ones you post on. Quick social posts will open templates for each.",
  submit: "Set it up for me",
  submitting: "Setting up…",
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