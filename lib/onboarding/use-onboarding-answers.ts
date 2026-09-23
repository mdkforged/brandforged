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

export const IDENTITY_UPDATED_EVENT = "bf-identity-updated";
export const IDENTITY_DONE_KEY = "bf-identity-done";

/** Bridge answers for This is You / Quick posts (aboutYou + contentStyle still written by /start). */
export type OnboardingAnswers = {
  aboutYou: string;
  contentStyle: string;
  /** Look + social photos; first 3 kept as primary look for older readers. */
  referencePhotos: string[];
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
  /** True when vault was saved / session activated from /start. */
  activated: boolean;
  vaultSaved: boolean;
  hasExistingLogo?: boolean;
  logoUpload?: string;
};

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === IDENTITY_STORAGE_KEY ||
      event.key === LEGACY_ONBOARDING_STORAGE_KEY ||
      event.key === IDENTITY_DONE_KEY ||
      event.key === null
    ) {
      onStoreChange();
    }
  };
  const onFocus = () => onStoreChange();
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  window.addEventListener(IDENTITY_UPDATED_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener(IDENTITY_UPDATED_EVENT, onCustom);
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
    activated?: boolean;
    hasExistingLogo?: boolean;
    logoUpload?: string;
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

/** Brand Forged logo marks used as temporary stand-ins — never "your look". */
export function isPlaceholderPhoto(src: string): boolean {
  if (!src) return true;
  if (src.startsWith("data:")) return false;
  return (
    src.startsWith("/brand/logo-") ||
    src.includes("/brand/logo-") ||
    /\/brand\/logo-[^/?#]+\.webp(?:\?|$)/i.test(src)
  );
}

function normalizeReferencePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : ""))
    .filter((item) => item.length > 0);
}

/**
 * Finished /start when vault was saved / activated, OR brand name + socials + kit
 * are present from a completed setup.
 */
export function hasFinishedStart(
  answers: OnboardingAnswers | null | undefined,
): boolean {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(IDENTITY_DONE_KEY) === "1") return true;
    } catch {
      /* ignore */
    }
  }
  if (!answers) return false;
  if (answers.vaultSaved || answers.activated) return true;
  const brand =
    (answers.brandName && answers.brandName.trim()) ||
    (answers.aboutYou && answers.aboutYou.trim()) ||
    "";
  const socialOk =
    Array.isArray(answers.socialSites) && answers.socialSites.length > 0;
  const kitOk = Boolean(answers.kit);
  return Boolean(brand) && socialOk && kitOk;
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
    const vaultSaved = Boolean(parsed.vaultSaved);
    const activated = Boolean(
      parsed.activated || parsed.activatedAt || vaultSaved,
    );

    const hasSomething =
      Boolean(aboutYou.trim()) ||
      Boolean(input) ||
      Boolean(kit) ||
      socialSites.length > 0 ||
      activated ||
      vaultSaved;

    if (!hasSomething) return null;

    const session: IdentitySession | undefined =
      input && parsed.kit && parsed.stage
        ? {
            input,
            kit: parsed.kit,
            stage: parsed.stage,
            approved: Boolean(parsed.approved),
            vaultSaved,
            firstMake,
            pickedForYou: parsed.pickedForYou as IdentitySession["pickedForYou"],
            socialSites: socialSites as string[],
            referencePhotos,
            savedAt: parsed.savedAt || parsed.activatedAt || new Date().toISOString(),
            activatedAt: parsed.activatedAt,
            hasExistingLogo: Boolean(parsed.hasExistingLogo),
            logoUpload:
              typeof parsed.logoUpload === "string" ? parsed.logoUpload : undefined,
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
      activated,
      vaultSaved,
      hasExistingLogo: Boolean(parsed.hasExistingLogo) || undefined,
      logoUpload:
        typeof parsed.logoUpload === "string" ? parsed.logoUpload : undefined,
    };
  } catch {
    return null;
  }
}

export function useOnboardingAnswers(): OnboardingAnswers | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (raw ? toAnswers(raw) : null), [raw]);
}

/** Convenience: isStarted === hasFinishedStart(answers). */
export function useIsStarted(): boolean {
  const answers = useOnboardingAnswers();
  return hasFinishedStart(answers);
}

function notifyIdentityUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(IDENTITY_UPDATED_EVENT));
}

/**
 * Persist look / social photos to bf-identity-v1 and refresh listeners.
 * Allows 0+ photos; clears pickedForYou.photos when uploads replace placeholders.
 */
export function updateReferencePhotos(
  photos: string[],
  options?: { clearPickedPhotos?: boolean },
): boolean {
  if (typeof window === "undefined") return false;
  const cleaned = photos.filter((p) => typeof p === "string" && p.length > 0);
  let raw: string | null = null;
  try {
    raw =
      window.localStorage.getItem(IDENTITY_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_ONBOARDING_STORAGE_KEY);
  } catch {
    return false;
  }
  let blob: Record<string, unknown> = {};
  if (raw) {
    try {
      blob = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      blob = {};
    }
  }
  blob.referencePhotos = cleaned;
  if (options?.clearPickedPhotos) {
    const picked =
      blob.pickedForYou && typeof blob.pickedForYou === "object"
        ? { ...(blob.pickedForYou as Record<string, unknown>) }
        : {};
    picked.photos = false;
    blob.pickedForYou = picked;
  }
  blob.savedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(blob));
  } catch {
    return false;
  }
  notifyIdentityUpdated();
  return true;
}
