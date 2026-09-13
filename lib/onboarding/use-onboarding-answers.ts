"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  IDENTITY_STORAGE_KEY,
  LEGACY_ONBOARDING_STORAGE_KEY,
  type BrandInputSet,
  type BrandKitDraft,
  type IdentitySession,
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
  input?: BrandInputSet;
  kit?: BrandKitDraft;
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

type StoredBlob = Partial<IdentitySession> &
  Partial<OnboardingAnswers> & {
    brandName?: string;
    input?: BrandInputSet;
    kit?: BrandKitDraft;
    activatedAt?: string;
  };

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
    const referencePhotos = parsed.referencePhotos;
    const socialSites = parsed.socialSites;
    if (!aboutYou.trim()) return null;
    if (!Array.isArray(referencePhotos) || referencePhotos.length !== 3) {
      return null;
    }
    if (!Array.isArray(socialSites)) return null;

    const session: IdentitySession | undefined =
      input && parsed.kit && parsed.stage
        ? {
            input,
            kit: parsed.kit,
            stage: parsed.stage,
            approved: Boolean(parsed.approved),
            vaultSaved: Boolean(parsed.vaultSaved),
            pickedForYou: parsed.pickedForYou as IdentitySession["pickedForYou"],
            socialSites: socialSites as string[],
            referencePhotos: referencePhotos as [string, string, string],
            savedAt: parsed.savedAt || parsed.activatedAt || new Date().toISOString(),
            activatedAt: parsed.activatedAt,
          }
        : undefined;

    return {
      aboutYou,
      contentStyle,
      referencePhotos: referencePhotos as [string, string, string],
      socialSites: socialSites as SocialSiteId[],
      pickedForYou: parsed.pickedForYou as OnboardingAnswers["pickedForYou"],
      savedAt: parsed.savedAt || parsed.activatedAt || new Date().toISOString(),
      brandName: brandName || undefined,
      input: input,
      kit: parsed.kit,
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
