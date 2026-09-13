"use client";

import {
  FormEvent,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { getEnergyStrike } from "@/lib/brand/energy-strike";
import {
  IDENTITY_COPY,
  IDENTITY_PICKS,
  IDENTITY_ROUTE_AFTER_ACTIVATION,
  IDENTITY_STAGE_LABEL,
  IDENTITY_STAGES,
  IDENTITY_STORAGE_KEY,
  REFERENCE_PHOTO_COUNT,
  fileToReferenceDataUrl,
  nextStage,
  prevStage,
  stageIndex,
  type IdentityKit,
  type IdentityStage,
} from "@/lib/identity/engine-scaffold";
import { SOCIAL_PICK_DEFAULTS, SOCIAL_SITES } from "@/lib/onboarding/social";
import type { SocialSiteId } from "@/lib/onboarding/social";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

type PickedMap = NonNullable<IdentityKit["pickedForYou"]>;

export default function StartPage() {
  const router = useRouter();
  const [stage, setStage] = useState<IdentityStage>("discovery");
  const [brandName, setBrandName] = useState("");
  const [audience, setAudience] = useState("");
  const [industry, setIndustry] = useState("");
  const [contentStyle, setContentStyle] = useState("");
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [socialSites, setSocialSites] = useState<SocialSiteId[]>([]);
  const [approved, setApproved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedMap>({});
  const [pending, setPending] = useState(false);

  const energyStyle = useMemo(
    () =>
      ({
        "--energy": PLATFORM_STRIKE.hex,
        "--energy-soft": `${PLATFORM_STRIKE.hex}33`,
      }) as CSSProperties,
    [],
  );

  const stepNum = stageIndex(stage) + 1;
  const photosReady = photos.every((p) => Boolean(p));
  const discoveryReady =
    brandName.trim().length > 0 &&
    audience.trim().length > 0 &&
    industry.trim().length > 0;
  const generationReady =
    contentStyle.trim().length > 0 &&
    photosReady &&
    socialSites.length > 0;

  function pickDiscovery() {
    setBrandName(IDENTITY_PICKS.brandName);
    setAudience(IDENTITY_PICKS.audience);
    setIndustry(IDENTITY_PICKS.industry);
    setPicked((p) => ({
      ...p,
      brandName: true,
      audience: true,
      industry: true,
    }));
  }

  function pickGeneration() {
    setContentStyle(IDENTITY_PICKS.contentStyle);
    setPhotos([...IDENTITY_PICKS.referencePhotos]);
    setSocialSites([...SOCIAL_PICK_DEFAULTS]);
    setPhotoError(null);
    setPicked((p) => ({
      ...p,
      contentStyle: true,
      photos: true,
      socialSites: true,
    }));
  }

  function pickEverything() {
    pickDiscovery();
    pickGeneration();
    setApproved(true);
    setPicked((p) => ({ ...p, approval: true }));
    setStage("review");
  }

  function toggleSocial(id: SocialSiteId) {
    setSocialSites((current) =>
      current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id],
    );
    setPicked((p) => ({ ...p, socialSites: false }));
  }

  async function onPhotoChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Use a photo file (JPG, PNG, etc.).");
      return;
    }
    try {
      setPhotoError(null);
      const dataUrl = await fileToReferenceDataUrl(file);
      setPhotos((current) => {
        const next = [...current];
        next[index] = dataUrl;
        return next;
      });
      setPicked((p) => ({ ...p, photos: false }));
    } catch {
      setPhotoError("Could not read that photo. Try another.");
    }
  }

  function clearPhoto(index: number) {
    setPhotos((current) => {
      const next = [...current];
      next[index] = null;
      return next;
    });
    setPicked((p) => ({ ...p, photos: false }));
  }

  function buildKit(activated: boolean): IdentityKit {
    return {
      brandName: brandName.trim(),
      audience: audience.trim(),
      industry: industry.trim(),
      contentStyle: contentStyle.trim(),
      referencePhotos: photos as [string, string, string],
      socialSites,
      interimPalette: "forge-green",
      interimLogo: "/brand/logo-forge-green.webp",
      stage: activated ? "activation" : stage,
      approved,
      activated,
      activatedAt: activated ? new Date().toISOString() : undefined,
      pickedForYou: picked,
      savedAt: new Date().toISOString(),
    };
  }

  function goNext() {
    if (stage === "discovery" && !discoveryReady) return;
    if (stage === "generation" && !generationReady) return;
    if (stage === "approval" && !approved) return;
    const n = nextStage(stage);
    if (n) setStage(n);
  }

  function goBack() {
    const p = prevStage(stage);
    if (p) setStage(p);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage !== "activation") {
      goNext();
      return;
    }
    if (!discoveryReady || !generationReady || !approved) return;
    setPending(true);
    const kit = buildKit(true);
    try {
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(kit));
    } catch {
      setPending(false);
      setPhotoError(
        "Those photos are a bit large for this device. Try smaller shots - or You pick for me on photos.",
      );
      setStage("generation");
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
          Step {stepNum} of {IDENTITY_STAGES.length}
          {" · "}
          {IDENTITY_STAGE_LABEL[stage]}
        </p>
        <h1>{IDENTITY_COPY.title}</h1>
        <p className="login-copy">{IDENTITY_COPY.subtitle}</p>
        <p className="field-hint">{IDENTITY_COPY.firstSessionNote}</p>

        <button type="button" className="pick-all" onClick={pickEverything}>
          {IDENTITY_COPY.pickAll}
        </button>

        <form className="login-form" onSubmit={onSubmit}>
          {stage === "discovery" ? (
            <>
              <div className="field-head">
                <span>Discovery</span>
                <button type="button" className="pick-one" onClick={pickDiscovery}>
                  {IDENTITY_COPY.pickForMe}
                </button>
              </div>
              <div className="login-field">
                <span>{IDENTITY_COPY.brandNameLabel}</span>
                <input
                  type="text"
                  required
                  placeholder={IDENTITY_COPY.brandNamePlaceholder}
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value);
                    setPicked((p) => ({ ...p, brandName: false }));
                  }}
                />
                <small className="field-hint">
                  {picked.brandName
                    ? `We picked "${IDENTITY_PICKS.brandName}."`
                    : IDENTITY_COPY.brandNameHint}
                </small>
              </div>
              <div className="login-field">
                <span>{IDENTITY_COPY.audienceLabel}</span>
                <input
                  type="text"
                  required
                  placeholder={IDENTITY_COPY.audiencePlaceholder}
                  value={audience}
                  onChange={(e) => {
                    setAudience(e.target.value);
                    setPicked((p) => ({ ...p, audience: false }));
                  }}
                />
                <small className="field-hint">{IDENTITY_COPY.audienceHint}</small>
              </div>
              <div className="login-field">
                <span>{IDENTITY_COPY.industryLabel}</span>
                <input
                  type="text"
                  required
                  placeholder={IDENTITY_COPY.industryPlaceholder}
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    setPicked((p) => ({ ...p, industry: false }));
                  }}
                />
                <small className="field-hint">{IDENTITY_COPY.industryHint}</small>
              </div>
              <button
                className="login-submit"
                type="submit"
                disabled={!discoveryReady}
              >
                {IDENTITY_COPY.continue}
              </button>
            </>
          ) : null}

          {stage === "generation" ? (
            <>
              <div className="field-head">
                <span>Generation</span>
                <button
                  type="button"
                  className="pick-one"
                  onClick={pickGeneration}
                >
                  {IDENTITY_COPY.pickForMe}
                </button>
              </div>
              <div className="login-field">
                <span>{IDENTITY_COPY.contentStyleLabel}</span>
                <input
                  type="text"
                  required
                  placeholder={IDENTITY_COPY.contentStylePlaceholder}
                  value={contentStyle}
                  onChange={(e) => {
                    setContentStyle(e.target.value);
                    setPicked((p) => ({ ...p, contentStyle: false }));
                  }}
                />
                <small className="field-hint">
                  {IDENTITY_COPY.contentStyleHint}
                </small>
              </div>
              <div className="photo-lockin">
                <p className="photo-lockin-label">{IDENTITY_COPY.photosLabel}</p>
                <p className="field-hint photo-lockin-hint">
                  {IDENTITY_COPY.photosHint}
                </p>
                <div className="photo-slots">
                  {Array.from({ length: REFERENCE_PHOTO_COUNT }).map(
                    (_, index) => {
                      const preview = photos[index];
                      return (
                        <div key={index} className="photo-slot">
                          {preview ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preview}
                                alt=""
                                className="photo-preview"
                              />
                              <button
                                type="button"
                                className="photo-clear"
                                onClick={() => clearPhoto(index)}
                              >
                                Replace
                              </button>
                            </>
                          ) : (
                            <label className="photo-add">
                              <span>
                                {IDENTITY_COPY.photoSlotLabels[index]}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => onPhotoChange(index, e)}
                              />
                            </label>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
                {photoError ? (
                  <p className="login-alert" role="alert">
                    {photoError}
                  </p>
                ) : null}
              </div>
              <div className="social-checklist">
                <p className="photo-lockin-label">{IDENTITY_COPY.socialLabel}</p>
                <p className="field-hint">{IDENTITY_COPY.socialHint}</p>
                <div className="social-checks" role="group">
                  {SOCIAL_SITES.map((site) => {
                    const checked = socialSites.includes(site.id);
                    return (
                      <button
                        key={site.id}
                        type="button"
                        className={
                          checked ? "social-chip is-checked" : "social-chip"
                        }
                        aria-pressed={checked}
                        onClick={() => toggleSocial(site.id)}
                      >
                        <span className="social-chip-mark" aria-hidden>
                          {checked ? "✓" : ""}
                        </span>
                        {site.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button
                  className="login-submit"
                  type="submit"
                  disabled={!generationReady}
                >
                  {IDENTITY_COPY.continue}
                </button>
              </div>
            </>
          ) : null}

          {stage === "review" ? (
            <>
              <h2 className="review-heading">{IDENTITY_COPY.reviewTitle}</h2>
              <p className="field-hint">{IDENTITY_COPY.reviewHint}</p>
              <article className="module-card look-card">
                <p>
                  <strong>Brand:</strong> {brandName}
                </p>
                <p>
                  <strong>Audience:</strong> {audience}
                </p>
                <p>
                  <strong>Industry:</strong> {industry}
                </p>
                <p>
                  <strong>Style:</strong> {contentStyle}
                </p>
                <p>
                  <strong>Social:</strong>{" "}
                  {socialSites
                    .map(
                      (id) =>
                        SOCIAL_SITES.find((s) => s.id === id)?.label ?? id,
                    )
                    .join(", ")}
                </p>
                <p>
                  <strong>Interim look:</strong> Forge Green marks (until full
                  palette generation)
                </p>
                <div className="locked-you-grid" style={{ marginTop: 12 }}>
                  {photos.map((src, i) =>
                    src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="locked-you-photo"
                      />
                    ) : null,
                  )}
                </div>
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

          {stage === "approval" ? (
            <>
              <div className="field-head">
                <span>{IDENTITY_COPY.approveLabel}</span>
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
              <p className="field-hint">{IDENTITY_COPY.approveHint}</p>
              <button
                type="button"
                className={
                  approved ? "goal-option is-active" : "goal-option"
                }
                onClick={() => {
                  setApproved(true);
                  setPicked((p) => ({ ...p, approval: false }));
                }}
              >
                <strong>{IDENTITY_COPY.approveYes}</strong>
                <span>User approval required before Activation (Playbook).</span>
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

          {stage === "activation" ? (
            <>
              <p className="field-hint">{IDENTITY_COPY.activateHint}</p>
              <article className="module-card">
                <h2>{brandName}</h2>
                <p>Approved kit ready. Activate to open This is You.</p>
              </article>
              <div className="step-actions">
                <button type="button" className="step-back" onClick={goBack}>
                  {IDENTITY_COPY.back}
                </button>
                <button
                  className="login-submit"
                  type="submit"
                  disabled={pending}
                >
                  {pending
                    ? IDENTITY_COPY.activating
                    : IDENTITY_COPY.activateCta}
                </button>
              </div>
            </>
          ) : null}
        </form>
      </div>
    </main>
  );
}