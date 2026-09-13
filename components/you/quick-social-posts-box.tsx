"use client";

import Link from "next/link";
import { useOnboardingAnswers } from "@/lib/onboarding/use-onboarding-answers";
import { labelForSite, type SocialSiteId } from "@/lib/onboarding/social";

export function QuickSocialPostsBox() {
  const answers = useOnboardingAnswers();
  const sites =
    Array.isArray(answers?.socialSites) && answers.socialSites.length > 0
      ? (answers.socialSites as SocialSiteId[])
      : [];
  const primaryHex =
    answers?.primaryHex || answers?.kit?.tokens?.primaryHex || undefined;

  const labels =
    sites.length > 0
      ? sites.map(labelForSite).join(" · ")
      : "Pick your sites on Get started first";

  return (
    <Link
      href="/you/posts"
      className="quick-posts-box"
      style={
        primaryHex
          ? {
              borderColor: `${primaryHex}59`,
              ["--energy" as string]: primaryHex,
            }
          : undefined
      }
    >
      <p className="quick-posts-kicker">Quick social posts</p>
      <strong>Click here</strong>
      <span className="quick-posts-sites">{labels}</span>
    </Link>
  );
}
