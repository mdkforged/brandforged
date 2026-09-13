"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  IDENTITY_STORAGE_KEY,
  LEGACY_ONBOARDING_STORAGE_KEY,
  type BrandInputSet,
  type FirstMakeChoice,
  type IdentitySession,
  type LockedBrandKit,
} from "@/lib/identity/engine-scaffold";
import type { SocialSiteId } from "@/lib/onboarding/social";

/** Bridge answers for This is You / Quick posts (aboutYou + contentStyle still written by /start). */
export type OnboardingAnswers = {
  aboutYou: string;
  contentStyle: string;
  referencePhotos: [string, string, string];
  socialSites: SocialSiteId[];
  pickedForYou?: Record<string, boolean | undefined>;
  savedAt: string;
  brandName?: string;
  firstMake?: FirstMakeChoice;
  input?: BrandInputSet;
  kit?: LockedBrandKit;
  /** Convenience: locked primary hex when kit tokens present. */
  primaryHex?: string;
  session?: IdentitySession;
};

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === IDENTITY_STORAGE_KEY ||
      event.key === LEGACY_ONBOARDING_STORAGE_KEY ||
      event.key === null
    ) {
      onStoreChange();
    }
  };
  const onFocus = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
  };
}

function getSnapshot() {
  try {
    return (
      window.localStorage.getItem(IDENTITY_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_ONBOARDING_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

type StoredBlob = Partial<IdentitySession> &
  Partial<OnboardingAnswers> & {
    brandName?: string;
    firstMake?: FirstMakeChoice;
    input?: BrandInputSet;
    kit?: LockedBrandKit;
    activatedAt?: string;
  };

const FIRST_MAKE_IDS: FirstMakeChoice[] = [
  "logo",
  "identity_guide",
  "social",
  "website",
];

function parseFirstMake(value: unknown): FirstMakeChoice | undefined {
  if (typeof value !== "string") return undefined;
  return FIRST_MAKE_IDS.includes(value as FirstMakeChoice)
    ? (value as FirstMakeChoice)
    : undefined;
}

function normalizeReferencePhotos(value: unknown): [string, string, string] {
  if (!Array.isArray(value)) return ["", "", ""];
  const asStrings = value.map((item) =>
    typeof item === "string" ? item : "",
  );
  return [asStrings[0] || "", asStrings[1] || "", asStrings[2] || ""];
}

function toAnswers(raw: string): OnboardingAnswers | null {
  try {
    const parsed = JSON.parse(raw) as StoredBlob;
    const input = parsed.input;
    const brandName =
      (input && input.brandName) ||
      parsed.brandName ||
      parsed.aboutYou ||
      "";
    const aboutYou = brandName || parsed.aboutYou || "";
    const contentStyle =
      parsed.contentStyle ||
      (input && input.moodWords) ||
      "";
    const referencePhotos = normalizeReferencePhotos(parsed.referencePhotos);
    const socialSites = Array.isArray(parsed.socialSites)
      ? (parsed.socialSites as SocialSiteId[])
      : [];
    const firstMake = parseFirstMake(parsed.firstMake);
    const kit = parsed.kit;
    const activated = Boolean(parsed.activatedAt || parsed.vaultSaved);

    const hasSomething =
      Boolean(aboutYou.trim()) ||
      Boolean(input) ||
      Boolean(kit) ||
      socialSites.length > 0 ||
      activated;

    if (!hasSomething) return null;

    const session: IdentitySession | undefined =
      input && parsed.kit && parsed.stage
        ? {
            input,
            kit: parsed.kit,
            stage: parsed.stage,
            approved: Boolean(parsed.approved),
            vaultSaved: Boolean(parsed.vaultSaved),
            firstMake,
            pickedForYou: parsed.pickedForYou as IdentitySession["pickedForYou"],
            socialSites: socialSites as string[],
            referencePhotos,
            savedAt: parsed.savedAt || parsed.activatedAt || new Date().toISOString(),
            activatedAt: parsed.activatedAt,
          }
        : undefined;

    const primaryHex =
      kit && kit.tokens && typeof kit.tokens.primaryHex === "string"
        ? kit.tokens.primaryHex
        : undefined;

    return {
      aboutYou,
      contentStyle,
      referencePhotos,
      socialSites,
      pickedForYou: parsed.pickedForYou as OnboardingAnswers["pickedForYou"],
      savedAt: parsed.savedAt || parsed.activatedAt || new Date().toISOString(),
      brandName: brandName || undefined,
      firstMake,
      input: input,
      kit,
      primaryHex,
      session,
    };
  } catch {
    return null;
  }
}

export function useOnboardingAnswers(): OnboardingAnswers | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (raw ? toAnswers(raw) : null), [raw]);
}