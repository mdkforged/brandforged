"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  const primaryHex =
    answers?.primaryHex || answers?.kit?.tokens?.primaryHex || undefined;
  const templates = useMemo(() => templatesForSites(sites), [sites]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function useTemplate(siteId: SocialSiteId, title: string, prompt: string) {
    const key = `${siteId}-${title}`;
    setDraft(prompt);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1600);
    } catch {
      setCopiedKey(null);
    }
  }

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
            Check the social sites you use — or tap You pick for me — then come
            back for your templates.
          </p>
          <p>
            <Link href="/start" className="door-upgrade-btn">
              Get started
            </Link>
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
              <p
                className="template-site"
                style={primaryHex ? { color: primaryHex } : undefined}
              >
                {labelForSite(item.siteId)}
              </p>
              <h2>{item.title}</h2>
              <p className="template-format">{item.format}</p>
              <p>{item.prompt}</p>
              <button
                type="button"
                className="door-upgrade-btn"
                onClick={() => useTemplate(item.siteId, item.title, item.prompt)}
              >
                {copiedKey === `${item.siteId}-${item.title}` ? "Copied" : "Use this"}
              </button>
            </article>
          ))}
        </div>
      )}
      {draft ? (
        <article className="module-card">
          <h2>Draft</h2>
          <label className="login-field notes-field">
            <span>Use this prompt</span>
            <textarea
              className="notes-textarea"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
            />
          </label>
        </article>
      ) : null}
    </div>
  );
}