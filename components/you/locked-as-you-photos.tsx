"use client";

import { useOnboardingAnswers } from "@/lib/onboarding/use-onboarding-answers";

export function LockedAsYouPhotos() {
  const answers = useOnboardingAnswers();
  const photos =
    Array.isArray(answers?.referencePhotos) &&
    answers.referencePhotos.length === 3 &&
    answers.referencePhotos.every((p) => typeof p === "string" && p.length > 0)
      ? answers.referencePhotos
      : null;
  const label =
    typeof answers?.aboutYou === "string" && answers.aboutYou.trim()
      ? answers.aboutYou.trim()
      : null;
  const pickedForYou = Boolean(answers?.pickedForYou?.photos);

  if (!photos) {
    return (
      <p>
        Upload 3 reference photos on Get started to lock in as you — or tap You
        pick for me there. Nothing here yet.
      </p>
    );
  }

  return (
    <div className="locked-you">
      <p className="locked-you-copy">
        {label ? `Locked in as ${label}.` : "Locked in as you."}{" "}
        {pickedForYou
          ? "We started you with Brand Forged marks — swap in your photos whenever."
          : "These three photos are your look baseline."}
      </p>
      <div className="locked-you-grid">
        {photos.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={index}
            src={src}
            alt={`Reference ${index + 1}`}
            className="locked-you-photo"
          />
        ))}
      </div>
    </div>
  );
}