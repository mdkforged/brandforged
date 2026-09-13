export type OnboardingGoal = "you" | "world" | "both";

export type OnboardingAnswers = {
  /** Who they are / brand name — plain words. */
  aboutYou: string;
  /** What we should set up for them first. */
  goal: OnboardingGoal;
  /** Content style — photos, quotes, videos, posts (one plain ask). */
  contentStyle: string;
  savedAt: string;
};

export const ONBOARDING_STORAGE_KEY = "bf-onboarding-v1";

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
  contentStyleHint: "How you show up in photos, quotes, videos, posts — in your words.",
  contentStylePlaceholder: "e.g. raw and honest, bright and bold, quiet and cinematic",
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