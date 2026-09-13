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
  ONBOARDING_STORAGE_KEY,
  REFERENCE_PHOTO_COUNT,
  fileToReferenceDataUrl,
  pathForGoal,
  type OnboardingGoal,
} from "@/lib/onboarding/questions";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

export default function StartPage() {
  const router = useRouter();
  const [aboutYou, setAboutYou] = useState("");
  const [contentStyle, setContentStyle] = useState("");
  const [photos, setPhotos] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
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
  const canSubmit =
    Boolean(goal) &&
    aboutYou.trim().length > 0 &&
    contentStyle.trim().length > 0 &&
    photosReady;

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
    } catch {
      setPhotoError("Couldn’t read that photo. Try another.");
    }
  }

  function clearPhoto(index: number) {
    setPhotos((current) => {
      const next = [...current];
      next[index] = null;
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goal || !aboutYou.trim() || !contentStyle.trim() || !photosReady) {
      return;
    }
    setPending(true);
    const referencePhotos = photos as [string, string, string];
    const payload = {
      aboutYou: aboutYou.trim(),
      contentStyle: contentStyle.trim(),
      referencePhotos,
      goal,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setPending(false);
      setPhotoError(
        "Those photos are a bit large for this device to keep. Try slightly smaller shots.",
      );
      return;
    }
    router.replace(pathForGoal(goal));
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

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span>{ONBOARDING_COPY.aboutYouLabel}</span>
            <input
              type="text"
              required
              autoComplete="organization"
              placeholder={ONBOARDING_COPY.aboutYouPlaceholder}
              value={aboutYou}
              onChange={(e) => setAboutYou(e.target.value)}
            />
            <small className="field-hint">{ONBOARDING_COPY.aboutYouHint}</small>
          </label>

          <label className="login-field">
            <span>{ONBOARDING_COPY.contentStyleLabel}</span>
            <input
              type="text"
              required
              placeholder={ONBOARDING_COPY.contentStylePlaceholder}
              value={contentStyle}
              onChange={(e) => setContentStyle(e.target.value)}
            />
            <small className="field-hint">{ONBOARDING_COPY.contentStyleHint}</small>
          </label>

          <div className="photo-lockin">
            <p className="photo-lockin-label">{ONBOARDING_COPY.photosLabel}</p>
            <p className="field-hint photo-lockin-hint">
              {ONBOARDING_COPY.photosHint}
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

          <fieldset className="goal-fieldset">
            <legend>{ONBOARDING_COPY.goalLabel}</legend>
            <div
              className="goal-options"
              role="radiogroup"
              aria-label={ONBOARDING_COPY.goalLabel}
            >
              {ONBOARDING_COPY.goals.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={goal === option.id}
                  className={
                    goal === option.id ? "goal-option is-active" : "goal-option"
                  }
                  onClick={() => setGoal(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

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