"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding/questions";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === ONBOARDING_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

/** Read onboarding answers without setState-in-effect (CI lint safe). */
export function useOnboardingAnswers(): Partial<OnboardingAnswers> | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Partial<OnboardingAnswers>;
    } catch {
      return null;
    }
  }, [raw]);
}