"use client";

import Link from "next/link";
import { useProfileAccess } from "@/lib/access/use-profile-access";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import { labelForSite, type SocialSiteId } from "@/lib/onboarding/social";

export function QuickSocialPostsBox() {
  const answers = useOnboardingAnswers();
  const { onboardingDone } = useProfileAccess();
  const isStarted = hasFinishedStart(answers) || onboardingDone;
  const sites =
    Array.isArray(answers?.socialSites) && answers.socialSites.length > 0
      ? (answers.socialSites as SocialSiteId[])
      : [];
  const primaryHex =
    answers?.primaryHex || answers?.kit?.tokens?.primaryHex || undefined;
  const energyStyle = primaryHex
    ? {
        borderColor: `${primaryHex}59`,
        ["--energy" as string]: primaryHex,
        cursor: "pointer" as const,
      }
    : { cursor: "pointer" as const };

  if (!isStarted) {
    return (
      <Link href="/start" className="quick-posts-box" style={energyStyle}>
        <p className="quick-posts-kicker">Get started</p>
        <strong>Set up your brand</strong>
        <span className="quick-posts-sites">
          Five questions, then your workspace
        </span>
      </Link>
    );
  }

  return (
    <Link href="/you/posts" className="quick-posts-box" style={energyStyle}>
      <p className="quick-posts-kicker">Quick social posts</p>
      <strong>Open quick posts</strong>
      <span className="quick-posts-sites">
        {sites.length > 0
          ? sites.map(labelForSite).join(" · ")
          : "Your ready packs for the sites you checked"}
      </span>
    </Link>
  );
}
