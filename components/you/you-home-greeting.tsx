"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ctaForFirstMake,
  routeForFirstMake,
} from "@/lib/identity/engine-scaffold";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";

export function YouHomeGreeting() {
  const answers = useOnboardingAnswers();
  const brandName = answers?.brandName?.trim() || answers?.aboutYou?.trim();
  const firstMake = answers?.firstMake;
  const primaryHex = answers?.primaryHex || answers?.kit?.tokens?.primaryHex;
  const socialSites = Array.isArray(answers?.socialSites)
    ? answers.socialSites
    : [];
  const isStarted = hasFinishedStart(answers);
  const missingSocials = isStarted && socialSites.length === 0;

  const energyStyle = primaryHex
    ? ({
        "--energy": primaryHex,
        "--energy-soft": `${primaryHex}33`,
      } as CSSProperties)
    : undefined;

  if (!brandName) {
    return (
      <div className="page-intro">
        <div>
          <p className="eyebrow">This is You</p>
          <h1>Who you are.</h1>
          <p className="intro-copy">
            You haven&apos;t set up your brand yet. Hit Get started to name your
            brand, pick your socials, and unlock your workspace.
          </p>
          <p>
            <Link href="/start" className="door-upgrade-btn">
              Get started
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-intro" style={energyStyle}>
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
        {missingSocials ? (
          <p>
            <Link href="/start" className="new-button">
              Pick your socials
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}