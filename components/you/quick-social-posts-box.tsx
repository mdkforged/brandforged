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
  const needsSetup = !answers || sites.length === 0;

  return (
    <Link
      href={needsSetup ? "/start" : "/you/posts"}
      className="quick-posts-box"
      style={
        primaryHex
          ? {
              borderColor: `${primaryHex}59`,
              ["--energy" as string]: primaryHex,
              cursor: "pointer",
            }
          : { cursor: "pointer" }
      }
    >
      <p className="quick-posts-kicker">Quick social posts</p>
      <strong>{needsSetup ? "Get started" : "Open quick posts"}</strong>
      <span className="quick-posts-sites">
        {needsSetup
          ? "Check the socials you use — then your templates open here"
          : sites.map(labelForSite).join(" · ")}
      </span>
    </Link>
  );
}