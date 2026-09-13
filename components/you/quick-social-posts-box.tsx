"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding/questions";
import { labelForSite, type SocialSiteId } from "@/lib/onboarding/social";

export function QuickSocialPostsBox() {
  const [sites, setSites] = useState<SocialSiteId[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<OnboardingAnswers>;
      if (Array.isArray(parsed.socialSites) && parsed.socialSites.length > 0) {
        setSites(parsed.socialSites as SocialSiteId[]);
      }
    } catch {
      // ignore
    }
  }, []);

  const labels =
    sites.length > 0
      ? sites.map(labelForSite).join(" · ")
      : "Pick your sites on Get started first";

  return (
    <Link href="/you/posts" className="quick-posts-box">
      <p className="quick-posts-kicker">Quick social posts</p>
      <strong>Click here</strong>
      <span className="quick-posts-sites">{labels}</span>
    </Link>
  );
}