"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOnboardingAnswers } from "@/lib/onboarding/use-onboarding-answers";
import {
  labelForSite,
  templatesForSites,
  type SocialSiteId,
} from "@/lib/onboarding/social";

export default function QuickSocialPostsPage() {
  const answers = useOnboardingAnswers();
  const sites = useMemo(
    () =>
      Array.isArray(answers?.socialSites)
        ? (answers.socialSites as SocialSiteId[])
        : [],
    [answers],
  );
  const style =
    typeof answers?.contentStyle === "string" && answers.contentStyle.trim()
      ? answers.contentStyle.trim()
      : null;
  const templates = useMemo(() => templatesForSites(sites), [sites]);

  return (
    <div className="posts-enclosure">
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Link href="/you" className="crumb">
              This is You
            </Link>{" "}
            · Quick social posts
          </p>
          <h1>Your templates</h1>
          <p className="intro-copy">
            Only the sites you checked
            {sites.length > 0
              ? ` — ${sites.map(labelForSite).join(", ")}`
              : ""}
            .
            {style ? ` Voice: ${style}` : ""}
          </p>
        </div>
      </div>

      {sites.length === 0 ? (
        <article className="module-card">
          <h2>No sites yet</h2>
          <p>
            Go back to <Link href="/start">Get started</Link> and check the
            social sites you use — or tap You pick for me.
          </p>
        </article>
      ) : (
        <div className="enclosed-templates" role="list">
          {templates.map((item) => (
            <article
              className="module-card template-card"
              key={`${item.siteId}-${item.title}`}
              role="listitem"
            >
              <p className="template-site">{labelForSite(item.siteId)}</p>
              <h2>{item.title}</h2>
              <p className="template-format">{item.format}</p>
              <p>{item.prompt}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}