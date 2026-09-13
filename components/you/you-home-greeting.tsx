"use client";

import Link from "next/link";
import {
  ctaForFirstMake,
  routeForFirstMake,
} from "@/lib/identity/engine-scaffold";
import { useOnboardingAnswers } from "@/lib/onboarding/use-onboarding-answers";

export function YouHomeGreeting() {
  const answers = useOnboardingAnswers();
  const brandName = answers?.brandName?.trim() || answers?.aboutYou?.trim();
  const firstMake = answers?.firstMake;

  if (!brandName) {
    return (
      <div className="page-intro">
        <div>
          <p className="eyebrow">This is You</p>
          <h1>Who you are.</h1>
          <p className="intro-copy">
            Your voice, your look, your ideas. Nothing to set up. We&apos;ll gather
            this as we go so you can stay with the work that matters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">This is You</p>
        <h1>{brandName}</h1>
        <p className="intro-copy">
          Your brand workspace is ready. Your voice, your look, your ideas - all in
          one place.
        </p>
        {firstMake ? (
          <p>
            <Link
              href={routeForFirstMake(firstMake)}
              className="door-upgrade-btn"
            >
              {ctaForFirstMake(firstMake)}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}