"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEnergyStrike } from "@/lib/brand/energy-strike";
import {
  BRAND_INPUT_PICKS,
  COLOR_PREF_OPTIONS,
  FIRST_MAKE_DEFAULT,
  FIRST_MAKE_OPTIONS,
  IDENTITY_COPY,
  IDENTITY_STORAGE_KEY,
  LOGO_STYLE_OPTIONS,
  ONBOARDING_STAGE_LABEL,
  ONBOARDING_STAGES,
  briefReady,
  generateLockedKit,
  nextStage,
  prevStage,
  routeForFirstMake,
  stageIndex,
  type BrandInputSet,
  type ColorPreference,
  type FirstMakeChoice,
  type OnboardingStage,
} from "@/lib/identity/engine-scaffold";
import {
  SOCIAL_PICK_DEFAULTS,
  SOCIAL_SITES,
  type SocialSiteId,
} from "@/lib/onboarding/social";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

export default function StartPage() {
  const router = useRouter();
  const [stage, setStage] = useState<OnboardingStage>("brief");
  const [input, setInput] = useState<BrandInputSet>({
    brandName: "",
    industry: "",
    audience: "",
    moodWords: "",
    logoStyle: "combo",
    colorPreference: "",
  });
  const [approved, setApproved] = useState(false);
  const [firstMake, setFirstMake] = useState<FirstMakeChoice>(FIRST_MAKE_DEFAULT);
  const [socialSites, setSocialSites] = useState<SocialSiteId[]>([]);
  const [picked, setPicked] = useState<
    Partial<Record<keyof BrandInputSet | "approval" | "firstMake" | "socialSites", boolean>>
  >({});
  const [pending, setPending] = useState(false);

  const kit = useMemo(() => generateLockedKit(input), [input]);

  const energyStyle = useMemo(
    () =>
      ({
        "--energy": kit.tokens.primaryHex || PLATFORM_STRIKE.hex,
        "--energy-soft": `${kit.tokens.primaryHex || PLATFORM_STRIKE.hex}33`,
      }) as CSSProperties,
    [kit.tokens.primaryHex],
  );
  const stepNum = stageIndex(stage) + 1;
  const ready = briefReady(input);

  function patch<K extends keyof BrandInputSet>(key: K, value: BrandInputSet[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setPicked((p) => ({ ...p, [key]: false }));
  }

  function pickBrief() {
    setInput({ ...BRAND_INPUT_PICKS });
    setSocialSites([...SOCIAL_PICK_DEFAULTS]);
    setPicked({
      brandName: true,
      industry: true,
      audience: true,
      moodWords: true,
      logoStyle: true,
      colorPreference: true,
      socialSites: true,
    });
  }

  function pickSocials() {
    setSocialSites([...SOCIAL_PICK_DEFAULTS]);
    setPicked((p) => ({ ...p, socialSites: true }));
  }

  function toggleSocial(id: SocialSiteId) {
    setSocialSites((current) =>
      current.includes(id) ? current.filter((site) => site !== id) : [...current, id],
    );
    setPicked((p) => ({ ...p, socialSites: false }));
  }

  function pickFirstMake() {
    setFirstMake(FIRST_MAKE_DEFAULT);
    setPicked((p) => ({ ...p, firstMake: true }));
  }

  function pickEverything() {
    pickBrief();
    setApproved(true);
    setFirstMake(FIRST_MAKE_DEFAULT);
    setPicked((p) => ({
      ...p,
      approval: true,
      firstMake: true,
      socialSites: true,
    }));
    setStage("kit_review");
  }

  function goNext() {
    if (stage === "brief" && (!ready || socialSites.length === 0)) return;
    if (stage === "kit_review" && !approved) return;
    const n = nextStage(stage);
    if (n) setStage(n);
  }

  function goBack() {
    const p = prevStage(stage);
    if (p) setStage(p);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage !== "brand_vault") {
      goNext();
      return;
    }
    if (!ready || !approved || !firstMake) return;
    setPending(true);
    const payload = {
      input,
      kit,
      stage: "brand_vault" as const,
      approved: true,
      vaultSaved: true,
      firstMake,
      pickedForYou: picked,
      // bridge fields for This is You / Quick posts readers
      aboutYou: input.brandName,
      contentStyle: input.moodWords,
      brandName: input.brandName,
      audience: input.audience,
      industry: input.industry,
      referencePhotos: [
        "/brand/logo-forge-green.webp",
        "/brand/logo-lumina-purple.webp",
        "/brand/logo-sapphire-blue-ember.webp",
      ] as [string, string, string],
      socialSites,
      savedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      activated: true,
    };
    try {
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setPending(false);
      return;
    }
    router.replace(routeForFirstMake(firstMake));
  }

  return (
    <main className="login-page" style={energyStyle}>
      <div className="login-aura" aria-hidden />
      <div className="login-card start-card">
        <div className="login-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login-logo"
            src="/brand/logo-forge-green.webp"
            alt="Brand Forged"
            width={200}
            height={200}
          />
          <p className="login-wordmark">
            <span>Brand</span> <strong>Forged</strong>
          </p>
        </div>

        <p className="step-pill">
          Step {stepNum} of {ONBOARDING_STAGES.length}
          {" - "}
          {ONBOARDING_STAGE_LABEL[stage]}
        </p>
        <h1>{IDENTITY_COPY.title}</h1>
        <p className="login-copy">{IDENTITY_COPY.subtitle}</p>
        <p className="field-hint">{IDENTITY_COPY.pipelineNote}</p>

        <button type="button" className="pick-all" onClick={pickEverything}>
          {IDENTITY_COPY.pickAll}
        </button>

        <form className="login-form" onSubmit={onSubmit}>
          {stage === "brief" ? (
            <>
              <div className="field-head">
                <span>5-question Brand Input Set</span>
                <button type="button" className="pick-one" onClick={pickBrief}>
                  {IDENTITY_COPY.pickForMe}
                </button>
              </div>
              <label className="login-field">
                <span>{IDENTITY_COPY.brandNameLabel}</span>
                <input
                  required
                  value={input.brandName}
                  onChange={(e) => patch("brandName", e.target.value)}
                />
              </label>
              <label className="login-field">
                <span>{IDENTITY_COPY.industryLabel}</span>
                <input
                  required
                  value={input.industry}
                  onChange={(e) => patch("industry", e.target.value)}
                />
              </label>
              <label className="login-field">
                <span>{IDENTITY_COPY.audienceLabel}</span>
                <input
                  required
                  value={input.audience}
                  onChange={(e) => patch("audience", e.target.value)}
                />
              </label>
              <label className="login-field">
                <span>{IDENTITY_COPY.moodLabel}</span>
                <input
                  required
                  value={input.moodWords}
                  onChange={(e) => patch("moodWords", e.target.value)}
                />
              </label>
              <div className="login-field">
                <span>{IDENTITY_COPY.logoLabel}</span>
                <div className="goal-options" role="radiogroup">
                  {LOGO_STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={input.logoStyle === opt.id}
                      className={
                        input.logoStyle === opt.id
                          ? "goal-option is-active"
                          : "goal-option"
                      }
                      onClick={() => patch("logoStyle", opt.id)}
                    >
                      <strong>{opt.label}</strong>
                      <span>{opt.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="login-field">
                <span>{IDENTITY_COPY.colorLabel}</span>
                <div className="social-checks" role="group">
                  {COLOR_PREF_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={
                        input.colorPreference === opt.id
                          ? "social-chip is-checked"
                          : "social-chip"
                      }
                      onClick={() =>
                        patch(
                          "colorPreference",
                          (input.colorPreference === opt.id
                            ? ""
                            : opt.id) as ColorPreference,
                        )
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="login-field">
                <div className="field-head">
                  <span>Social sites for posts</span>
                  <button type="button" className="pick-one" onClick={pickSocials}>
                    {IDENTITY_COPY.pickForMe}
                  </button>
                </div>
                <p className="field-hint">
                  Check the places you already post. This is not one of the five Brand Input questions — it just routes your templates.
                </p>
                <div className="social-checks" role="group" aria-label="Social sites for posts">
                  {SOCIAL_SITES.map((site) => {
                    const checked = socialSites.includes(site.id);
                    return (
                      <button
                        key={site.id}
                        type="button"
                        className={checked ? "social-chip is-checked" : "social-chip"}
                        aria-pressed={checked}
                        onClick={() => toggleSocial(site.id)}
                      >
                        {site.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                className="login-submit"
                type="submit"
                disabled={!ready || socialSites.length === 0}
              >
                {IDENTITY_COPY.continue}
              </button>
            </>
          ) : null}

          {stage === "engine_run" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.engineRunTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.engineRunBody}</p>
              <p className="field-hint" aria-live="polite">
                {IDENTITY_COPY.engineRunProgress}
              </p>
              <article className="module-card">
                <p>
                  Building kit for <strong>{input.brandName || "your brand"}</strong>
                  ...
                </p>
                <ul>
                  <li>{kit.paletteLabel}</li>
                  <li>{kit.typographyLabel}</li>
                  <li>{kit.logoLabel}</li>
                  <li>{kit.voiceLabel}</li>
                  <li>{kit.templatePackLabel}</li>
                </ul>
              </article>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button className="login-submit" type="submit">
                  {IDENTITY_COPY.continue}
                </button>
              </div>
            </>
          ) : null}

          {stage === "kit_review" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.reviewTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.reviewHint}</p>
              <article className="module-card look-card">
                <p><strong>Palette:</strong> {kit.paletteLabel}</p>
                <div className="token-swatches" aria-label="Color tokens">
                  {(
                    [
                      ["Primary", kit.tokens.primaryHex],
                      ["Secondary", kit.tokens.secondaryHex],
                      ["Accent", kit.tokens.accentHex],
                    ] as const
                  ).map(([label, hex]) => (
                    <span key={label} className="token-swatch">
                      <span
                        className="token-swatch-chip"
                        style={{ background: hex }}
                        title={hex}
                        aria-hidden
                      />
                      <span className="token-swatch-meta">
                        {label}
                        <code>{hex}</code>
                      </span>
                    </span>
                  ))}
                </div>
                <p><strong>Typography:</strong> {kit.typographyLabel}</p>
                <p><strong>Logo:</strong> {kit.logoLabel}</p>
                <p><strong>Voice:</strong> {kit.voiceLabel}</p>
                <p><strong>Templates:</strong> {kit.templatePackLabel}</p>
                <p><strong>Style guide:</strong> {kit.styleGuideLabel}</p>
              </article>
              <div className="field-head">
                <span>Approve palette, fonts, and logo?</span>
                <button
                  type="button"
                  className="pick-one"
                  onClick={() => {
                    setApproved(true);
                    setPicked((p) => ({ ...p, approval: true }));
                  }}
                >
                  {IDENTITY_COPY.pickForMe}
                </button>
              </div>
              <button
                type="button"
                className={approved ? "goal-option is-active" : "goal-option"}
                onClick={() => setApproved(true)}
              >
                <strong>{IDENTITY_COPY.approveYes}</strong>
                <span>Required before Sticker Book activates.</span>
              </button>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button
                  className="login-submit"
                  type="submit"
                  disabled={!approved}
                >
                  {IDENTITY_COPY.continue}
                </button>
              </div>
            </>
          ) : null}

          {stage === "sticker_book" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.stickerTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.stickerBody}</p>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button className="login-submit" type="submit">
                  {IDENTITY_COPY.continue}
                </button>
              </div>
            </>
          ) : null}

          {stage === "first_template" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.templateTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.templateBody}</p>
              <p>
                <Link href="/you/posts" className="door-upgrade-btn">
                  {IDENTITY_COPY.templateCta}
                </Link>
              </p>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button className="login-submit" type="submit">
                  {IDENTITY_COPY.continue}
                </button>
              </div>
            </>
          ) : null}

          {stage === "export_publish" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.exportTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.exportBody}</p>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button className="login-submit" type="submit">
                  {IDENTITY_COPY.continue}
                </button>
              </div>
            </>
          ) : null}

          {stage === "brand_vault" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.vaultTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.vaultBody}</p>
              <article className="module-card">
                <h2>{input.brandName}</h2>
                <p>{input.industry}</p>
                <p>{input.moodWords}</p>
              </article>
              <div className="field-head">
                <span>{IDENTITY_COPY.firstMakeLabel}</span>
                <button type="button" className="pick-one" onClick={pickFirstMake}>
                  {IDENTITY_COPY.pickForMe}
                </button>
              </div>
              <p className="field-hint">{IDENTITY_COPY.firstMakeHint}</p>
              <div className="goal-options" role="radiogroup" aria-label={IDENTITY_COPY.firstMakeLabel}>
                {FIRST_MAKE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={firstMake === opt.id}
                    className={
                      firstMake === opt.id ? "goal-option is-active" : "goal-option"
                    }
                    onClick={() => {
                      setFirstMake(opt.id);
                      setPicked((p) => ({ ...p, firstMake: false }));
                    }}
                  >
                    <strong>{opt.label}</strong>
                  </button>
                ))}
              </div>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button
                  className="login-submit"
                  type="submit"
                  disabled={pending || !firstMake}
                >
                  {pending ? IDENTITY_COPY.saving : IDENTITY_COPY.vaultCta}
                </button>
              </div>
            </>
          ) : null}
        </form>
      </div>
    </main>
  );
}
