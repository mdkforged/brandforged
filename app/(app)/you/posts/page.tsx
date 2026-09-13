"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOnboardingAnswers } from "@/lib/onboarding/use-onboarding-answers";
import {
  labelForSite,
  type SocialSiteId,
} from "@/lib/onboarding/social";
import {
  loadSocialNeeds,
  reachPacksForSites,
  saveSocialNeeds,
  type SocialNeedCard,
} from "@/lib/onboarding/reach-packs";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `need-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  const packs = useMemo(() => reachPacksForSites(sites), [sites]);

  const [needText, setNeedText] = useState("");
  const [needs, setNeeds] = useState<SocialNeedCard[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dupOpenFor, setDupOpenFor] = useState<string | null>(null);
  const [dupTargets, setDupTargets] = useState<SocialSiteId[]>([]);

  useEffect(() => {
    setNeeds(loadSocialNeeds());
  }, []);

  const persistNeeds = useCallback((next: SocialNeedCard[]) => {
    setNeeds(next);
    saveSocialNeeds(next);
  }, []);

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1600);
    } catch {
      setCopiedKey(null);
    }
  }

  function saveNeed() {
    const text = needText.trim();
    if (!text) return;
    const card: SocialNeedCard = {
      id: newId(),
      text,
      siteId: sites[0] || "custom",
      createdAt: new Date().toISOString(),
    };
    persistNeeds([card, ...needs]);
    setNeedText("");
  }

  function openDuplicate(cardId: string, fromSite?: SocialSiteId | "custom") {
    setDupOpenFor(cardId);
    const others = sites.filter((s) => s !== fromSite);
    setDupTargets(others);
  }

  function duplicateNeed(card: SocialNeedCard) {
    const targets =
      dupTargets.length > 0
        ? dupTargets
        : sites.filter((s) => s !== card.siteId);
    if (targets.length === 0) {
      setDupOpenFor(null);
      return;
    }
    const copies: SocialNeedCard[] = targets.map((siteId) => ({
      id: newId(),
      text: card.text,
      siteId,
      createdAt: new Date().toISOString(),
      sourceId: card.id,
    }));
    persistNeeds([...copies, ...needs]);
    setDupOpenFor(null);
    setDupTargets([]);
  }

  function duplicatePackItem(
    siteId: SocialSiteId,
    title: string,
    caption: string,
    whenHint: string,
  ) {
    const key = `${siteId}-${title}`;
    const text = `${title}\n${whenHint}\n\n${caption}`;
    const targets =
      dupTargets.length > 0 ? dupTargets : sites.filter((s) => s !== siteId);
    if (dupOpenFor !== key) {
      openDuplicate(key, siteId);
      return;
    }
    const copies: SocialNeedCard[] = targets.map((target) => ({
      id: newId(),
      text,
      siteId: target,
      createdAt: new Date().toISOString(),
      sourceId: key,
    }));
    persistNeeds([...copies, ...needs]);
    setDupOpenFor(null);
    setDupTargets([]);
  }

  function selectAllDupTargets(except?: SocialSiteId | "custom") {
    setDupTargets(sites.filter((s) => s !== except));
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
          <h1>Ready to post</h1>
          <p className="intro-copy">
            Reach-ready picks for the sites you use
            {sites.length > 0
              ? ` — ${sites.map(labelForSite).join(", ")}`
              : ""}
            .
            {style ? ` Voice: ${style}` : ""} No research — copy and go.
          </p>
        </div>
      </div>

      <article className="module-card need-box">
        <h2>What do you need?</h2>
        <p className="need-box-hint">
          Type exactly what you want to post. Save it, then duplicate to your
          other socials.
        </p>
        <label className="login-field notes-field">
          <span className="sr-only">What do you need?</span>
          <textarea
            className="notes-textarea"
            value={needText}
            onChange={(event) => setNeedText(event.target.value)}
            rows={4}
            placeholder="e.g. Announce the new single with a soft listen link…"
          />
        </label>
        <button
          type="button"
          className="door-upgrade-btn"
          onClick={saveNeed}
          disabled={!needText.trim()}
        >
          Generate / Save
        </button>
      </article>

      {needs.length > 0 ? (
        <section className="need-cards" aria-label="Your saved needs">
          <h2 className="posts-section-title">Your cards</h2>
          <div className="enclosed-templates" role="list">
            {needs.map((card) => {
              const key = card.id;
              const siteLabel =
                card.siteId === "custom"
                  ? "Your words"
                  : labelForSite(card.siteId);
              return (
                <article
                  className="module-card template-card"
                  key={card.id}
                  role="listitem"
                >
                  <p
                    className="template-site"
                    style={primaryHex ? { color: primaryHex } : undefined}
                  >
                    {siteLabel}
                  </p>
                  <h2>Your need</h2>
                  <p className="template-format">Saved · ready to copy</p>
                  <p>{card.text}</p>
                  <div className="template-actions">
                    <button
                      type="button"
                      className="door-upgrade-btn"
                      onClick={() => void copyText(key, card.text)}
                    >
                      {copiedKey === key ? "Copied" : "Use this"}
                    </button>
                    <button
                      type="button"
                      className="door-upgrade-btn door-upgrade-btn-ghost"
                      onClick={() =>
                        dupOpenFor === key
                          ? duplicateNeed(card)
                          : openDuplicate(key, card.siteId)
                      }
                    >
                      {dupOpenFor === key
                        ? "Confirm duplicate"
                        : "Duplicate to other socials"}
                    </button>
                  </div>
                  {dupOpenFor === key ? (
                    <div className="dup-picker">
                      <p className="dup-picker-label">Copy to:</p>
                      <div className="dup-chips">
                        {sites
                          .filter((s) => s !== card.siteId)
                          .map((siteId) => {
                            const checked = dupTargets.includes(siteId);
                            return (
                              <label key={siteId} className="dup-chip">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setDupTargets((current) =>
                                      checked
                                        ? current.filter((id) => id !== siteId)
                                        : [...current, siteId],
                                    )
                                  }
                                />
                                {labelForSite(siteId)}
                              </label>
                            );
                          })}
                      </div>
                      <button
                        type="button"
                        className="pick-all"
                        onClick={() => selectAllDupTargets(card.siteId)}
                      >
                        All my socials
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {sites.length === 0 ? (
        <article className="module-card">
          <h2>No sites yet</h2>
          <p>
            Check the social sites you use — or tap You pick for me — then come
            back for your ready packs.
          </p>
          <p>
            <Link href="/start" className="door-upgrade-btn">
              Get started
            </Link>
          </p>
        </article>
      ) : (
        <section aria-label="Reach-ready packs">
          <h2 className="posts-section-title">Reach-ready for you</h2>
          <div className="enclosed-templates" role="list">
            {packs.map((item) => {
              const key = `${item.siteId}-${item.title}`;
              const copyBody = `${item.title}\n${item.whenHint}\n\n${item.caption}`;
              return (
                <article
                  className="module-card template-card"
                  key={key}
                  role="listitem"
                >
                  <p
                    className="template-site"
                    style={primaryHex ? { color: primaryHex } : undefined}
                  >
                    {labelForSite(item.siteId)}
                  </p>
                  <h2>{item.title}</h2>
                  <p className="template-format">{item.whenHint}</p>
                  <p>{item.caption}</p>
                  <div className="template-actions">
                    <button
                      type="button"
                      className="door-upgrade-btn"
                      onClick={() => void copyText(key, copyBody)}
                    >
                      {copiedKey === key ? "Copied" : "Use this"}
                    </button>
                    <button
                      type="button"
                      className="door-upgrade-btn door-upgrade-btn-ghost"
                      onClick={() =>
                        duplicatePackItem(
                          item.siteId,
                          item.title,
                          item.caption,
                          item.whenHint,
                        )
                      }
                    >
                      {dupOpenFor === key
                        ? "Confirm duplicate"
                        : "Duplicate to other socials"}
                    </button>
                  </div>
                  {dupOpenFor === key ? (
                    <div className="dup-picker">
                      <p className="dup-picker-label">Copy to:</p>
                      <div className="dup-chips">
                        {sites
                          .filter((s) => s !== item.siteId)
                          .map((siteId) => {
                            const checked = dupTargets.includes(siteId);
                            return (
                              <label key={siteId} className="dup-chip">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setDupTargets((current) =>
                                      checked
                                        ? current.filter((id) => id !== siteId)
                                        : [...current, siteId],
                                    )
                                  }
                                />
                                {labelForSite(siteId)}
                              </label>
                            );
                          })}
                      </div>
                      <button
                        type="button"
                        className="pick-all"
                        onClick={() => selectAllDupTargets(item.siteId)}
                      >
                        All my socials
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
