export type OnboardingGoal = "you" | "world" | "both";

export type OnboardingAnswers = {
  /** Who they are / brand name — plain words. */
  aboutYou: string;
  /** What we should set up for them first. */
  goal: OnboardingGoal;
  /** Content style — photos, quotes, videos, posts (one plain ask). */
  contentStyle: string;
  /** Three reference photos that lock in "as you" (data URLs for v1). */
  referencePhotos: [string, string, string];
  savedAt: string;
};

export const ONBOARDING_STORAGE_KEY = "bf-onboarding-v1";
export const REFERENCE_PHOTO_COUNT = 3;

/**
 * Quick direct questions. Answers make Brand Forged work for the client —
 * we set things up; they don't fill a long form (DR-004).
 */
export const ONBOARDING_COPY = {
  title: "A couple of quick questions",
  subtitle:
    "We'll set things up from your answers. You don't have to figure the rest out.",
  aboutYouLabel: "Who are we building for?",
  aboutYouHint: "Your name, stage name, or business — whatever you call it.",
  aboutYouPlaceholder: "e.g. Tethered & Truth",
  contentStyleLabel: "What's your content style?",
  contentStyleHint:
    "How you show up in photos, quotes, videos, posts — in your words.",
  contentStylePlaceholder:
    "e.g. raw and honest, bright and bold, quiet and cinematic",
  photosLabel: "Lock in as you",
  photosHint: "Upload 3 reference photos. These become your look baseline.",
  photoSlotLabels: ["Photo 1", "Photo 2", "Photo 3"] as const,
  goalLabel: "What should we set up for you first?",
  goals: [
    {
      id: "you" as const,
      label: "This is You",
      detail: "Voice, look, and what you want to say.",
    },
    {
      id: "world" as const,
      label: "Your World",
      detail: "People, work, and running the business side.",
    },
    {
      id: "both" as const,
      label: "Both",
      detail: "We'll open home with both doors ready.",
    },
  ],
  submit: "Set it up for me",
  submitting: "Setting up…",
} as const;

export function pathForGoal(goal: OnboardingGoal): "/" | "/you" | "/world" {
  if (goal === "you") return "/you";
  if (goal === "world") return "/world";
  return "/";
}

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