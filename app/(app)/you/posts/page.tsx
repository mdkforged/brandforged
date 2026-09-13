"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useProfileAccess } from "@/lib/access/use-profile-access";
import {
  hasFinishedStart,
  isPlaceholderPhoto,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import {
  labelForSite,
  type SocialSiteId,
} from "@/lib/onboarding/social";
import {
  PLATFORM_OPEN_URL,
  fillBrandCaption,
  loadSocialNeeds,
  reachPacksForSites,
  saveSocialNeeds,
  type ReachPackItem,
  type SocialNeedCard,
} from "@/lib/onboarding/reach-packs";
import {
  isTetheredTruthBrand,
  TETHERED_TRUTH_KIT_TOKENS,
} from "@/lib/brand/tethered-truth-palette";
import { SoundDrawer } from "@/components/you/sound-drawer";
import type { LibrarySound } from "@/lib/sounds/sound-library";

/** Forge Green companions when kit tokens are missing (locked-kit COMPANION_HEX). */
const FORGE_FALLBACK = {
  primaryHex: "#b6ff2e",
  secondaryHex: "#1a2e14",
  accentHex: "#e8ffe4",
  neutralHex: "#9aa896",
  backgroundHex: "#070908",
  textHex: "#f4f6f2",
} as const;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `need-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type PackRow = ReachPackItem & { siteId: SocialSiteId };

export default function QuickSocialPostsPage() {
  const answers = useOnboardingAnswers();
  const { onboardingDone } = useProfileAccess();
  const setupDone = hasFinishedStart(answers) || onboardingDone;
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
  const tokens = answers?.kit?.tokens;
  const brandName =
    (typeof answers?.brandName === "string" && answers.brandName.trim()) ||
    (typeof answers?.aboutYou === "string" && answers.aboutYou.trim()) ||
    "your brand";
  const tt = isTetheredTruthBrand(brandName);
  const primaryHex = tt
    ? TETHERED_TRUTH_KIT_TOKENS.primaryHex
    : tokens?.primaryHex || answers?.primaryHex || FORGE_FALLBACK.primaryHex;
  const secondaryHex = tt
    ? TETHERED_TRUTH_KIT_TOKENS.secondaryHex
    : tokens?.secondaryHex || FORGE_FALLBACK.secondaryHex;
  const accentHex = tt
    ? TETHERED_TRUTH_KIT_TOKENS.accentHex
    : tokens?.accentHex || FORGE_FALLBACK.accentHex;
  const backgroundHex = tt
    ? TETHERED_TRUTH_KIT_TOKENS.backgroundHex
    : tokens?.backgroundHex || FORGE_FALLBACK.backgroundHex;
  const textHex = tt
    ? TETHERED_TRUTH_KIT_TOKENS.textHex
    : tokens?.textHex || FORGE_FALLBACK.textHex;
  const neutralHex = tt
    ? TETHERED_TRUTH_KIT_TOKENS.neutralHex
    : tokens?.neutralHex || FORGE_FALLBACK.neutralHex;

  const kitStyle = useMemo(
    () =>
      ({
        "--energy": primaryHex,
        "--energy-soft": `${primaryHex}33`,
        "--kit-primary": primaryHex,
        "--kit-secondary": secondaryHex,
        "--kit-accent": accentHex,
        "--kit-bg": backgroundHex,
        "--kit-text": textHex,
        "--kit-neutral": neutralHex,
      }) as CSSProperties,
    [primaryHex, secondaryHex, accentHex, backgroundHex, textHex, neutralHex],
  );

  const lookPhotos = useMemo(() => {
    const photos = Array.isArray(answers?.referencePhotos)
      ? answers.referencePhotos.filter((p) => typeof p === "string" && p.length > 0)
      : [];
    const real = photos.filter((p) => !isPlaceholderPhoto(p));
    return real.length > 0 ? real : photos;
  }, [answers]);

  const packs = useMemo(() => reachPacksForSites(sites), [sites]);

  const [needText, setNeedText] = useState("");
  const [needs, setNeeds] = useState<SocialNeedCard[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const [selectedSound, setSelectedSound] = useState<LibrarySound | null>(null);

  useEffect(() => {
    setNeeds(loadSocialNeeds());
  }, []);

  const persistNeeds = useCallback((next: SocialNeedCard[]) => {
    setNeeds(next);
    saveSocialNeeds(next);
  }, []);

  const selectedPack: PackRow | null = useMemo(() => {
    if (!selectedKey) return null;
    return packs.find((item) => `${item.siteId}-${item.id}` === selectedKey) || null;
  }, [packs, selectedKey]);

  const previewSrc =
    lookPhotos.length > 0
      ? lookPhotos[Math.min(previewPhotoIndex, lookPhotos.length - 1)]
      : null;

  async function copyText(key: string, text: string) {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.top = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        ok = document.execCommand("copy");
        document.body.removeChild(area);
      } catch {
        ok = false;
      }
    }
    if (!ok && typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        ok = true;
      } catch {
        /* cancelled */
      }
    }
    if (ok) {
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
      return;
    }
    setCopiedKey(`fail-${key}`);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === `fail-${key}` ? null : current));
    }, 8000);
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

  function openPlatform(siteId: SocialSiteId) {
    const url = PLATFORM_OPEN_URL[siteId];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function selectPack(item: PackRow) {
    setSelectedKey(`${item.siteId}-${item.id}`);
  }

  return (
    <div className="posts-enclosure" style={kitStyle}>
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
            Captions you can paste — not homework. Titles say what media you
            actually need (photo, video you film, or text). Free sound drawer for your uploads and licensed catalog links.
            {sites.length > 0
              ? ` Sites: ${sites.map(labelForSite).join(", ")}.`
              : ""}
            {style ? ` Voice: ${style}.` : ""} Preview uses your Look photos and
            locked kit colors from kit review.
          </p>
        </div>
      </div>

      <SoundDrawer
        primaryHex={primaryHex}
        accentHex={accentHex}
        textHex={textHex}
        secondaryHex={secondaryHex}
        onSelectedChange={setSelectedSound}
      />

      <div className="posts-layout">
        <aside className="post-preview-column" aria-label="Phone preview">
          <div
            className="post-phone"
            style={{
              borderColor: primaryHex,
              background: backgroundHex,
              color: textHex,
              boxShadow: `0 0 0 1px ${primaryHex}55, 0 18px 40px ${secondaryHex}cc`,
            }}
          >
            <div
              className="post-phone-notch"
              style={{ background: secondaryHex }}
              aria-hidden
            />
            <div className="post-phone-screen">
              {selectedPack ? (
                <>
                  <p className="post-phone-site" style={{ color: primaryHex }}>
                    {labelForSite(selectedPack.siteId)}
                  </p>
                  <p className="post-phone-title">{selectedPack.title}</p>
                  <p className="post-phone-media" style={{ color: accentHex }}>
                    {selectedPack.mediaLabel}
                  </p>
                  {selectedPack.mediaNeed !== "text-only" ? (
                    previewSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewSrc}
                        alt="Look preview"
                        className="post-phone-photo"
                      />
                    ) : (
                      <div
                        className="post-phone-photo-empty"
                        style={{
                          borderColor: `${primaryHex}66`,
                          background: secondaryHex,
                          color: neutralHex,
                        }}
                      >
                        Add a Look photo on This is You to preview here
                      </div>
                    )
                  ) : (
                    <div
                      className="post-phone-photo-empty is-text"
                      style={{
                        borderColor: `${primaryHex}44`,
                        background: secondaryHex,
                        color: accentHex,
                      }}
                    >
                      Text post — no media required
                    </div>
                  )}
                  <p className="post-phone-caption">
                    {fillBrandCaption(selectedPack.caption, brandName)}
                  </p>
                  <p className="post-phone-when" style={{ color: neutralHex }}>
                    {selectedPack.whenHint}
                  </p>
                
                  {selectedSound ? (
                    <div
                      className="post-phone-sound"
                      style={{
                        borderColor: `${primaryHex}55`,
                        color: accentHex,
                        background: `${secondaryHex}`,
                      }}
                    >
                      <span className="post-phone-sound-icon" aria-hidden>
                        ♪
                      </span>
                      <span>{selectedSound.title}</span>
                    </div>
                  ) : null}
</>
              ) : (
                <div className="post-phone-empty">
                  <p style={{ color: accentHex }}>Select a pack</p>
                  <p style={{ color: neutralHex }}>
                    Tap a card to see a large phone preview with your Look photo
                    and ready caption.
                  </p>
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSrc}
                      alt="Look"
                      className="post-phone-photo"
                    />
                  ) : null}
                </div>
              )}
            </div>
            <div
              className="post-phone-home"
              style={{ background: primaryHex }}
              aria-hidden
            />
          </div>

          {lookPhotos.length > 1 ? (
            <div className="post-photo-picks" role="list" aria-label="Look photos">
              {lookPhotos.map((src, index) => (
                <button
                  key={`look-pick-${index}`}
                  type="button"
                  className={
                    index === previewPhotoIndex
                      ? "post-photo-pick is-active"
                      : "post-photo-pick"
                  }
                  style={
                    index === previewPhotoIndex
                      ? { outlineColor: primaryHex, borderColor: primaryHex }
                      : { borderColor: `${neutralHex}66` }
                  }
                  onClick={() => setPreviewPhotoIndex(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Look ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="posts-main">
          <article className="module-card need-box">
            <h2>What do you need?</h2>
            <p className="need-box-hint">
              Type your own caption if the packs are not enough. Save it, then
              copy when ready.
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
              style={{
                borderColor: primaryHex,
                background: `${primaryHex}29`,
                color: accentHex,
              }}
              onClick={saveNeed}
              disabled={!needText.trim()}
            >
              Save my caption
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
                      style={{ borderColor: `${primaryHex}44` }}
                    >
                      <p className="template-site" style={{ color: primaryHex }}>
                        {siteLabel}
                      </p>
                      <h2>Your caption</h2>
                      <p className="template-format">Saved · ready to copy</p>
                      <p>{card.text}</p>
                      <div className="template-actions">
                        <button
                          type="button"
                          className="door-upgrade-btn"
                          style={{
                            borderColor: primaryHex,
                            background: `${primaryHex}29`,
                            color: accentHex,
                          }}
                          onClick={() => void copyText(key, card.text)}
                        >
                          {copiedKey === key
                            ? "Copied"
                            : copiedKey === `fail-${key}`
                              ? "Could not auto-copy"
                              : "Copy caption"}
                        </button>
                        {copiedKey === `fail-${key}` ? (
                          <label className="copy-fallback">
                            <span className="sr-only">Select and copy</span>
                            <textarea
                              className="copy-fallback-text"
                              readOnly
                              value={card.text}
                              onFocus={(event) => event.currentTarget.select()}
                              rows={4}
                            />
                          </label>
                        ) : null}
                        {card.siteId !== "custom" ? (
                          <button
                            type="button"
                            className="door-upgrade-btn door-upgrade-btn-ghost"
                            style={{ borderColor: `${primaryHex}66`, color: textHex }}
                            onClick={() => openPlatform(card.siteId as SocialSiteId)}
                          >
                            Open {labelForSite(card.siteId as SocialSiteId)}
                          </button>
                        ) : null}
                      </div>
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
                {setupDone
                  ? "Social picks are not on this device yet. Add them on This is You, then come back."
                  : "Check the social sites you use — or tap You pick for me — then come back for ready packs."}
              </p>
              {!setupDone ? (
                <p>
                  <Link href="/start" className="door-upgrade-btn">
                    Get started
                  </Link>
                </p>
              ) : (
                <p>
                  <Link href="/you" className="door-upgrade-btn">
                    This is You
                  </Link>
                </p>
              )}
            </article>
          ) : (
            <section aria-label="Reach-ready packs">
              <h2 className="posts-section-title">Reach-ready for you</h2>
              <div className="enclosed-templates" role="list">
                {packs.map((item) => {
                  const key = `${item.siteId}-${item.id}`;
                  const caption = fillBrandCaption(item.caption, brandName);
                  const isSelected = selectedKey === key;
                  return (
                    <article
                      className={
                        isSelected
                          ? "module-card template-card is-selected"
                          : "module-card template-card"
                      }
                      key={key}
                      role="listitem"
                      style={{
                        borderColor: isSelected ? primaryHex : `${primaryHex}44`,
                        boxShadow: isSelected
                          ? `0 0 0 2px ${primaryHex}55`
                          : undefined,
                      }}
                    >
                      <button
                        type="button"
                        className="template-select"
                        onClick={() => selectPack(item)}
                      >
                        <p className="template-site" style={{ color: primaryHex }}>
                          {labelForSite(item.siteId)}
                        </p>
                        <h2>{item.title}</h2>
                        <p className="template-format">{item.mediaLabel}</p>
                        <p className="template-when">{item.whenHint}</p>
                        <p className="template-caption-preview">{caption}</p>
                      </button>
                      <div className="template-actions">
                        <button
                          type="button"
                          className="door-upgrade-btn"
                          style={{
                            borderColor: primaryHex,
                            background: `${primaryHex}29`,
                            color: accentHex,
                          }}
                          onClick={() => {
                            selectPack(item);
                            void copyText(key, caption);
                          }}
                        >
                          {copiedKey === key
                            ? "Copied"
                            : copiedKey === `fail-${key}`
                              ? "Could not auto-copy"
                              : "Copy caption"}
                        </button>
                        {copiedKey === `fail-${key}` ? (
                          <label className="copy-fallback">
                            <span className="sr-only">Select and copy</span>
                            <textarea
                              className="copy-fallback-text"
                              readOnly
                              value={caption}
                              onFocus={(event) => event.currentTarget.select()}
                              rows={5}
                            />
                          </label>
                        ) : null}
                        <button
                          type="button"
                          className="door-upgrade-btn door-upgrade-btn-ghost"
                          style={{ borderColor: `${primaryHex}66`, color: textHex }}
                          onClick={() => {
                            selectPack(item);
                            openPlatform(item.siteId);
                          }}
                        >
                          Open {labelForSite(item.siteId)}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}