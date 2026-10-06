"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";

const noopSubscribe = () => () => {};

/**
 * Setup questions are only for an account with no kit. A saved kit on this
 * device sends her home (Change answers uses /start?edit=1 and still works).
 * Guests never get here: the middleware sends them to /login first.
 */
export function StartGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "1";
  const answers = useOnboardingAnswers();
  // false on the server and during hydration, true after (no setState).
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const blocked = hydrated && !isEdit && hasFinishedStart(answers);

  useEffect(() => {
    if (blocked) router.replace("/");
  }, [blocked, router]);

  if (blocked) return null;
  return <>{children}</>;
}
