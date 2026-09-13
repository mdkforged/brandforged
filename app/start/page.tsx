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
  ONBOARDING_COPY,
  ONBOARDING_LOCKED_GOAL,
  ONBOARDING_PICKS,
  ONBOARDING_ROUTE_AFTER_SETUP,
  ONBOARDING_STORAGE_KEY,
  REFERENCE_PHOTO_COUNT,
  fileToReferenceDataUrl,
  type SocialSiteId,
} from "@/lib/onboarding/questions";
import { SOCIAL_SITES } from "@/lib/onboarding/social";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

type PickedMap = {
  aboutYou: boolean;
  whyHere: boolean;
  contentStyle: boolean;
  photos: boolean;
  socialSites: boolean;
};

export default function StartPage() {
  const router = useRouter();
  const [aboutYou, setAboutYou] = useState("");
  const [whyHere, setWhyHere] = useState("");
  const [contentStyle, setContentStyle] = useState("");
  const [photos, setPhotos] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [socialSites, setSocialSites] = useState<SocialSiteId[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedMap>({
    aboutYou: false,
    whyHere: false,
    contentStyle: false,
    photos: false,
    socialSites: false,
  });
  const [pending, setPending] = useState(false);

  const energyStyle = useMemo(
    () =>
      ({
        "--energy": PLATFORM_STRIKE.hex,
        "--energy-soft": `${PLATFORM_STRIKE.hex}33`,
      }) as CSSProperties,
    [],
  );

  const photosReady = photos.every((p) => Boolean(p));
  const socialReady = socialSites.length > 0;
  const canSubmit =
    aboutYou.trim().length > 0 &&
    whyHere.trim().length > 0 &&
    contentStyle.trim().length > 0 &&
    photosReady &&
    socialReady;

  function pickAboutYou() {
    setAboutYou(ONBOARDING_PICKS.aboutYou);
    setPicked((p) => ({ ...p, aboutYou: true }));
  }

  function pickWhyHere() {
    setWhyHere(ONBOARDING_PICKS.whyHere);
    setPicked((p) => ({ ...p, whyHere: true }));
  }

  function pickContentStyle() {
    setContentStyle(ONBOARDING_PICKS.contentStyle);
    setPicked((p) => ({ ...p, contentStyle: true }));
  }

  function pickPhotos() {
    setPhotos([...ONBOARDING_PICKS.referencePhotos]);
    setPhotoError(null);
    setPicked((p) => ({ ...p, photos: true }));
  }

  function pickSocialSites() {
    setSocialSites([...ONBOARDING_PICKS.socialSites]);
    setPicked((p) => ({ ...p, socialSites: true }));
  }

  function pickEverything() {
    setAboutYou(ONBOARDING_PICKS.aboutYou);
    setWhyHere(ONBOARDING_PICKS.whyHere);
    setContentStyle(ONBOARDING_PICKS.contentStyle);
    setPhotos([...ONBOARDING_PICKS.referencePhotos]);
    setSocialSites([...ONBOARDING_PICKS.socialSites]);
    setPhotoError(null);
    setPicked({
      aboutYou: true,
      whyHere: true,
      contentStyle: true,
      photos: true,
      socialSites: true,
    });
  }

  function toggleSocial(id: SocialSiteId) {
    setSocialSites((current) => {
      if (current.includes(id)) {
        return current.filter((s) => s !== id);
      }
      return [...current, id];
    });
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
      setPhotoError("Couldn't read that photo. Try another.");
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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !aboutYou.trim() ||
      !whyHere.trim() ||
      !contentStyle.trim() ||
      !photosReady ||
      !socialReady
    ) {
      return;
    }
    setPending(true);
    const referencePhotos = photos as [string, string, string];
    const payload = {
      aboutYou: aboutYou.trim(),
      whyHere: whyHere.trim(),
      contentStyle: contentStyle.trim(),
      referencePhotos,
      socialSites,
      goal: ONBOARDING_LOCKED_GOAL,
      pickedForYou: picked,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setPending(false);
      setPhotoError(
        "Those photos are a bit large for this device to keep. Try slightly smaller shots — or tap You pick for me on photos.",
      );
      return;
    }
    router.replace(ONBOARDING_ROUTE_AFTER_SETUP);
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

        <h1>{ONBOARDING_COPY.title}</h1>
        <p className="login-copy">{ONBOARDING_COPY.subtitle}</p>

        <button type="button" className="pick-all" onClick={pickEverything}>
          {ONBOARDING_COPY.pickAll}
        </button>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-field">
            <div className="field-head">
              <span>{ONBOARDING_COPY.aboutYouLabel}</span>
              <button type="button" className="pick-one" onClick={pickAboutYou}>
                {ONBOARDING_COPY.pickForMe}
              </button>
            </div>
            <input
              type="text"
              required
              autoComplete="organization"
              placeholder={ONBOARDING_COPY.aboutYouPlaceholder}
              value={aboutYou}
              onChange={(e) => {
                setAboutYou(e.target.value);
                setPicked((p) => ({ ...p, aboutYou: false }));
              }}
            />
            <small className="field-hint">
              {picked.aboutYou
                ? `We picked “${ONBOARDING_PICKS.aboutYou}.” Change it anytime.`
                : ONBOARDING_COPY.aboutYouHint}
            </small>
          </div>

          <div className="login-field">
            <div className="field-head">
              <span>{ONBOARDING_COPY.whyHereLabel}</span>
              <button type="button" className="pick-one" onClick={pickWhyHere}>
                {ONBOARDING_COPY.pickForMe}
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={ONBOARDING_COPY.whyHerePlaceholder}
              value={whyHere}
              onChange={(e) => {
                setWhyHere(e.target.value);
                setPicked((p) => ({ ...p, whyHere: false }));
              }}
            />
            <small className="field-hint">
              {picked.whyHere
                ? "We filled a starting intent for you. Edit freely."
                : ONBOARDING_COPY.whyHereHint}
            </small>
          </div>

          <div className="login-field">
            <div className="field-head">
              <span>{ONBOARDING_COPY.contentStyleLabel}</span>
              <button
                type="button"
                className="pick-one"
                onClick={pickContentStyle}
              >
                {ONBOARDING_COPY.pickForMe}
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={ONBOARDING_COPY.contentStylePlaceholder}
              value={contentStyle}
              onChange={(e) => {
                setContentStyle(e.target.value);
                setPicked((p) => ({ ...p, contentStyle: false }));
              }}
            />
            <small className="field-hint">
              {picked.contentStyle
                ? "We filled a starting style for you. Edit freely."
                : ONBOARDING_COPY.contentStyleHint}
            </small>
          </div>

          <div className="photo-lockin">
            <div className="field-head">
              <p className="photo-lockin-label">{ONBOARDING_COPY.photosLabel}</p>
              <button type="button" className="pick-one" onClick={pickPhotos}>
                {ONBOARDING_COPY.pickForMe}
              </button>
            </div>
            <p className="field-hint photo-lockin-hint">
              {picked.photos
                ? "We started you with Brand Forged marks. Swap in your photos whenever."
                : ONBOARDING_COPY.photosHint}
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
                        <span>{ONBOARDING_COPY.photoSlotLabels[index]}</span>
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
            {photoError ? (
              <p className="login-alert" role="alert">
                {photoError}
              </p>
            ) : null}
          </div>

          <div className="social-checklist">
            <div className="field-head">
              <p className="photo-lockin-label">{ONBOARDING_COPY.socialLabel}</p>
              <button
                type="button"
                className="pick-one"
                onClick={pickSocialSites}
              >
                {ONBOARDING_COPY.pickForMe}
              </button>
            </div>
            <p className="field-hint photo-lockin-hint">
              {picked.socialSites
                ? "We checked Instagram, TikTok, YouTube, and Threads. Adjust anytime."
                : ONBOARDING_COPY.socialHint}
            </p>
            <div
              className="social-checks"
              role="group"
              aria-label={ONBOARDING_COPY.socialLabel}
            >
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

          <button
            className="login-submit"
            type="submit"
            disabled={pending || !canSubmit}
          >
            {pending ? ONBOARDING_COPY.submitting : ONBOARDING_COPY.submit}
          </button>
        </form>
      </div>
    </main>
  );
}