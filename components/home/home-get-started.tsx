"use client";

import Link from "next/link";
import { useProfileAccess } from "@/lib/access/use-profile-access";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";

export function HomeGetStarted() {
  const answers = useOnboardingAnswers();
  const { signedIn, onboardingDone, ready } = useProfileAccess();
  const setupDone = hasFinishedStart(answers) || onboardingDone;

  if (!ready) return null;
  if (setupDone) return null;

  return (
    <>
      <p>
        <Link href="/start" className="door-upgrade-btn get-started-btn">
          Get started
        </Link>
      </p>
      {!signedIn ? (
        <p className="intro-copy">
          <Link href="/login?next=/">Sign in first</Link> if you already set up
          on another device
        </p>
      ) : null}
    </>
  );
}
