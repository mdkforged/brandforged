"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { getEnergyStrike } from "@/lib/brand/energy-strike";
import {
  ONBOARDING_COPY,
  ONBOARDING_STORAGE_KEY,
  pathForGoal,
  type OnboardingGoal,
} from "@/lib/onboarding/questions";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

export default function StartPage() {
  const router = useRouter();
  const [aboutYou, setAboutYou] = useState("");
  const [contentStyle, setContentStyle] = useState("");
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

  const canSubmit =
    Boolean(goal) && aboutYou.trim().length > 0 && contentStyle.trim().length > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goal || !aboutYou.trim() || !contentStyle.trim()) return;
    setPending(true);
    const payload = {
      aboutYou: aboutYou.trim(),
      contentStyle: contentStyle.trim(),
      goal,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore — still route them */
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