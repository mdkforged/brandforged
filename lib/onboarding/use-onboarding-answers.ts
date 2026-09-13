"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  IDENTITY_STORAGE_KEY,
  LEGACY_ONBOARDING_STORAGE_KEY,
  type IdentityKit,
} from "@/lib/identity/engine-scaffold";
import type { SocialSiteId } from "@/lib/onboarding/social";

export type OnboardingAnswers = {
  aboutYou: string;
  contentStyle: string;
  referencePhotos: [string, string, string];
  socialSites: SocialSiteId[];
  pickedForYou?: Record<string, boolean | undefined>;
  savedAt: string;
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
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
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

function toAnswers(raw: string): OnboardingAnswers | null {
  try {
    const parsed = JSON.parse(raw) as Partial<IdentityKit> &
      Partial<OnboardingAnswers> & { brandName?: string };
    const aboutYou = parsed.brandName || parsed.aboutYou || "";
    const contentStyle = parsed.contentStyle || "";
    const referencePhotos = parsed.referencePhotos;
    const socialSites = parsed.socialSites;
    if (
      !aboutYou ||
      !Array.isArray(referencePhotos) ||
      referencePhotos.length !== 3 ||
      !Array.isArray(socialSites)
    ) {
      return null;
    }
    return {
      aboutYou,
      contentStyle,
      referencePhotos: referencePhotos as [string, string, string],
      socialSites: socialSites as SocialSiteId[],
      pickedForYou: parsed.pickedForYou,
      savedAt: parsed.savedAt || parsed.activatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function useOnboardingAnswers(): OnboardingAnswers | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (raw ? toAnswers(raw) : null), [raw]);
}