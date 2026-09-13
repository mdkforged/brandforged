"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEnergyStrike } from "@/lib/brand/energy-strike";
import {
  BRAND_INPUT_PICKS,
  COLOR_PREF_OPTIONS,
  IDENTITY_COPY,
  IDENTITY_ROUTE_AFTER_ACTIVATION,
  IDENTITY_STORAGE_KEY,
  LOGO_STYLE_OPTIONS,
  ONBOARDING_STAGE_LABEL,
  ONBOARDING_STAGES,
  briefReady,
  draftKitFromInput,
  nextStage,
  prevStage,
  stageIndex,
  type BrandInputSet,
  type ColorPreference,
  type LogoStylePreference,
  type OnboardingStage,
} from "@/lib/identity/engine-scaffold";

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
  const [picked, setPicked] = useState<
    Partial<Record<keyof BrandInputSet | "approval", boolean>>
  >({});
  const [pending, setPending] = useState(false);

  const energyStyle = useMemo(
    () =>
      ({
        "--energy": PLATFORM_STRIKE.hex,
        "--energy-soft": `${PLATFORM_STRIKE.hex}33`,
      }) as CSSProperties,
    [],
  );

  const kit = useMemo(() => draftKitFromInput(input), [input]);
  const stepNum = stageIndex(stage) + 1;
  const ready = briefReady(input);

  function patch<K extends keyof BrandInputSet>(key: K, value: BrandInputSet[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setPicked((p) => ({ ...p, [key]: false }));
  }

  function pickBrief() {
    setInput({ ...BRAND_INPUT_PICKS });
    setPicked({
      brandName: true,
      industry: true,
      audience: true,
      moodWords: true,
      logoStyle: true,
      colorPreference: true,
    });
  }

  function pickEverything() {
    pickBrief();
    setApproved(true);
    setPicked((p) => ({ ...p, approval: true }));
    setStage("kit_review");
  }

  function goNext() {
    if (stage === "brief" && !ready) return;
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
    if (!ready || !approved) return;
    setPending(true);
    const payload = {
      input,
      kit,
      stage: "brand_vault" as const,
      approved: true,
      vaultSaved: true,
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
      socialSites: ["instagram", "tiktok", "youtube", "threads"],
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
    router.replace(IDENTITY_ROUTE_AFTER_ACTIVATION);
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
          {" · "}
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
              <button className="login-submit" type="submit" disabled={!ready}>
                {IDENTITY_COPY.continue}
              </button>
            </>
          ) : null}

          {stage === "engine_run" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.engineRunTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.engineRunBody}</p>
              <article className="module-card">
                <p>Building kit for <strong>{input.brandName}</strong>…</p>
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
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button className="login-submit" type="submit" disabled={pending}>
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
