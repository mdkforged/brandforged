"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ctaForFirstMake,
  routeForFirstMake,
} from "@/lib/identity/engine-scaffold";
import { useProfileAccess } from "@/lib/access/use-profile-access";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import { labelForSite, type SocialSiteId } from "@/lib/onboarding/social";

export function YouHomeGreeting() {
  const answers = useOnboardingAnswers();
  const { signedIn, onboardingDone } = useProfileAccess();
  const brandName = answers?.brandName?.trim() || answers?.aboutYou?.trim();
  const firstMake = answers?.firstMake;
  const primaryHex = answers?.primaryHex || answers?.kit?.tokens?.primaryHex;
  const socialSites = Array.isArray(answers?.socialSites)
    ? answers.socialSites
    : [];
  const isStarted = hasFinishedStart(answers) || onboardingDone;
  const missingSocials = isStarted && socialSites.length === 0;

  const energyStyle = primaryHex
    ? ({
        "--energy": primaryHex,
        "--energy-soft": `${primaryHex}33`,
      } as CSSProperties)
    : undefined;

  if (!brandName) {
    const showGetStarted = !onboardingDone;
    return (
      <div className="page-intro">
        <div>
          <p className="eyebrow">This is You</p>
          <h1>Who you are.</h1>
          <p className="intro-copy">
            {onboardingDone
              ? "Your account already finished setup on another device. Local brand details aren&apos;t on this phone or browser yet."
              : "You haven&apos;t set up your brand yet. Hit Get started to name your brand, pick your socials, and unlock your workspace."}
          </p>
          {showGetStarted ? (
            <>
              <p>
                <Link href="/start" className="door-upgrade-btn get-started-btn">
                  Get started
                </Link>
              </p>
              {!signedIn ? (
                <p className="intro-copy">
                  <Link href="/login?next=/">Sign in first</Link> if you already
                  set up on another device
                </p>
              ) : null}
            </>
          ) : null}
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
        {!missingSocials && socialSites.length > 0 ? (
          <div className="social-checks" role="list" aria-label="Your socials" style={{ marginTop: 12 }}>
            {(socialSites as SocialSiteId[]).map((id) => (
              <span key={id} className="social-chip is-checked" role="listitem">
                {labelForSite(id)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}