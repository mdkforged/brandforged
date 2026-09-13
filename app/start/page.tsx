"use client";

import {
  FormEvent,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
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
  REFERENCE_PHOTO_COUNT,
  fileToReferenceDataUrl,
} from "@/lib/onboarding/questions";
import {
  SOCIAL_PICK_DEFAULTS,
  SOCIAL_SITES,
  type SocialSiteId,
} from "@/lib/onboarding/social";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

/** Brand Forged marks used when You pick for me / empty photo slots. */
const DEFAULT_REFERENCE_PHOTOS: [string, string, string] = [
  "/brand/logo-forge-green.webp",
  "/brand/logo-lumina-purple.webp",
  "/brand/logo-sapphire-blue-ember.webp",
];

const PHOTO_SLOT_LABELS = ["Photo 1", "Photo 2", "Photo 3"] as const;

type PickedKey =
  | keyof BrandInputSet
  | "approval"
  | "firstMake"
  | "socialSites"
  | "photos";

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
  const [hasExistingLogo, setHasExistingLogo] = useState(false);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [logoUpload, setLogoUpload] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Partial<Record<PickedKey, boolean>>>({});
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
    setPhotos([...DEFAULT_REFERENCE_PHOTOS]);
    setPhotoError(null);
    setPicked({
      brandName: true,
      industry: true,
      audience: true,
      moodWords: true,
      logoStyle: true,
      colorPreference: true,
      socialSites: true,
      photos: true,
    });
  }

  function pickSocials() {
    setSocialSites([...SOCIAL_PICK_DEFAULTS]);
    setPicked((p) => ({ ...p, socialSites: true }));
  }

  function pickPhotos() {
    setPhotos([...DEFAULT_REFERENCE_PHOTOS]);
    setPhotoError(null);
    setPicked((p) => ({ ...p, photos: true }));
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
      photos: true,
    }));
    setStage("kit_review");
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

  async function onLogoUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Use an image file for your logo (JPG, PNG, SVG, etc.).");
      return;
    }
    try {
      setPhotoError(null);
      const dataUrl = await fileToReferenceDataUrl(file);
      setLogoUpload(dataUrl);
      setHasExistingLogo(true);
    } catch {
      setPhotoError("Could not read that logo. Try another file.");
    }
  }

  function clearLogoUpload() {
    setLogoUpload(null);
  }

  function resolveReferencePhotos(): [string, string, string] {
    const filled = photos.map((p, i) =>
      p && p.length > 0 ? p : DEFAULT_REFERENCE_PHOTOS[i],
    ) as [string, string, string];
    const anyUpload = photos.some((p) => Boolean(p && !p.startsWith("/brand/")));
    if (anyUpload || photos.every(Boolean)) {
      return [
        photos[0] || DEFAULT_REFERENCE_PHOTOS[0],
        photos[1] || DEFAULT_REFERENCE_PHOTOS[1],
        photos[2] || DEFAULT_REFERENCE_PHOTOS[2],
      ];
    }
    if (picked.photos) {
      return [...DEFAULT_REFERENCE_PHOTOS];
    }
    return filled;
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
    const referencePhotos = resolveReferencePhotos();
    const payload = {
      input,
      kit,
      stage: "brand_vault" as const,
      approved: true,
      vaultSaved: true,
      firstMake,
      pickedForYou: picked,
      hasExistingLogo,
      logoUpload: logoUpload || undefined,
      // bridge fields for This is You / Quick posts readers
      aboutYou: input.brandName,
      contentStyle: input.moodWords,
      brandName: input.brandName,
      audience: input.audience,
      industry: input.industry,
      referencePhotos,
      socialSites,
      savedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      activated: true,
    };
    try {
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setPending(false);
      setPhotoError(
        "Those photos are a bit large for this device to keep. Try slightly smaller shots — or tap You pick for me on photos.",
      );
      setStage("brief");
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
                <label className="social-chip" style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={hasExistingLogo}
                    onChange={(e) => setHasExistingLogo(e.target.checked)}
                  />
                  <span>Already have a logo</span>
                </label>
                <p className="field-hint">
                  {hasExistingLogo
                    ? "Great — upload it below if you want. You still pick a logo style so we know how to build around it."
                    : "Pick the style you want. You can also upload reference photos and a mark below."}
                </p>
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

                <div className="photo-lockin" style={{ marginTop: 16 }}>
                  <div className="field-head">
                    <p className="photo-lockin-label">Reference photos (lock as you)</p>
                    <button type="button" className="pick-one" onClick={pickPhotos}>
                      {IDENTITY_COPY.pickForMe}
                    </button>
                  </div>
                  <p className="field-hint photo-lockin-hint">
                    {picked.photos
                      ? "We started you with Brand Forged marks. Swap in your photos whenever."
                      : "Up to 3 photos of you / your look. Optional now — empty slots use Brand Forged marks."}
                  </p>
                  <div className="photo-slots">
                    {Array.from({ length: REFERENCE_PHOTO_COUNT }).map((_, index) => {
                      const preview = photos[index];
                      return (
                        <div key={index} className="photo-slot">
                          {preview ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preview} alt="" className="photo-preview" />
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
                              <span>{PHOTO_SLOT_LABELS[index]}</span>
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
                    })}
                  </div>
                </div>

                <div className="photo-lockin" style={{ marginTop: 12 }}>
                  <p className="photo-lockin-label">
                    {hasExistingLogo ? "Your logo / brand mark" : "Logo / brand mark (optional)"}
                  </p>
                  <p className="field-hint">
                    Upload a file if you already have one. We keep it with your kit.
                  </p>
                  {logoUpload ? (
                    <div className="photo-slot" style={{ maxWidth: 160 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUpload} alt="Logo upload preview" className="photo-preview" />
                      <button
                        type="button"
                        className="photo-clear"
                        onClick={clearLogoUpload}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="photo-add" style={{ minHeight: 88 }}>
                      <span>Upload logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onLogoUploadChange}
                      />
                    </label>
                  )}
                </div>
                {photoError ? (
                  <p className="login-alert" role="alert">
                    {photoError}
                  </p>
                ) : null}
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
