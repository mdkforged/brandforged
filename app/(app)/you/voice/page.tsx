"use client";

import Link from "next/link";
import { useProfileAccess } from "@/lib/access/use-profile-access";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";

export default function YouVoicePage() {
  const answers = useOnboardingAnswers();
  const { onboardingDone } = useProfileAccess();
  const setupDone = hasFinishedStart(answers) || onboardingDone;
  const kit = answers?.kit;
  const voiceLabel = kit?.voiceLabel?.trim() || "";
  const voiceTone = kit?.tokens?.voiceTone ?? [];
  const moodTags = kit?.tokens?.moodTags ?? [];
  const moodWords =
    answers?.input?.moodWords?.trim() || answers?.contentStyle?.trim() || "";

  return (
    <div>
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Link href="/you" className="crumb">
              This is You
            </Link>{" "}
            — Voice
          </p>
          <h1>Your voice</h1>
          <p className="intro-copy">
            Locked from your kit. How you sound stays close to you.
          </p>
        </div>
      </div>

      {!kit ? (
        <article className="module-card">
          <h2>No kit yet</h2>
          <p>
            {setupDone
              ? "Your account finished setup, but this device doesn&apos;t have the locked kit yet."
              : (
                <>
                  Go to <Link href="/start">Get started</Link> so we can lock your
                  voice from the brief.
                </>
              )}
          </p>
        </article>
      ) : (
        <article className="module-card look-card">
          <h2>Voice</h2>
          {voiceLabel ? (
            <p>
              <strong>Voice:</strong> {voiceLabel}
            </p>
          ) : null}
          {voiceTone.length > 0 ? (
            <div className="social-checks" role="list">
              {voiceTone.map((tone) => (
                <span key={tone} className="social-chip is-checked" role="listitem">
                  {tone}
                </span>
              ))}
            </div>
          ) : null}
          {moodTags.length > 0 ? (
            <p>
              <strong>Mood:</strong> {moodTags.join(", ")}
            </p>
          ) : null}
          {moodWords ? <p>{moodWords}</p> : null}
        </article>
      )}
    </div>
  );
}
