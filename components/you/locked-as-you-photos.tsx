"use client";

import { useEffect, useState } from "react";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingAnswers,
} from "@/lib/onboarding/questions";

export function LockedAsYouPhotos() {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<OnboardingAnswers>;
      if (
        Array.isArray(parsed.referencePhotos) &&
        parsed.referencePhotos.length === 3 &&
        parsed.referencePhotos.every((p) => typeof p === "string" && p.length > 0)
      ) {
        setPhotos(parsed.referencePhotos);
      }
      if (typeof parsed.aboutYou === "string" && parsed.aboutYou.trim()) {
        setLabel(parsed.aboutYou.trim());
      }
    } catch {
      // ignore bad local payload
    }
  }, []);

  if (!photos) {
    return (
      <p>
        Upload 3 reference photos on Get started to lock in as you. Nothing here
        yet.
      </p>
    );
  }

  return (
    <div className="locked-you">
      <p className="locked-you-copy">
        {label ? `Locked in as ${label}.` : "Locked in as you."} These three
        photos are your look baseline.
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