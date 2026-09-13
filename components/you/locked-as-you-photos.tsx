"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  isPlaceholderPhoto,
  updateReferencePhotos,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import { fileToReferenceDataUrl } from "@/lib/onboarding/questions";

export function LockedAsYouPhotos() {
  const answers = useOnboardingAnswers();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photos = Array.isArray(answers?.referencePhotos)
    ? answers.referencePhotos.filter((p) => typeof p === "string" && p.length > 0)
    : [];
  const brandName =
    (typeof answers?.brandName === "string" && answers.brandName.trim()) ||
    (typeof answers?.aboutYou === "string" && answers.aboutYou.trim()) ||
    null;
  const placeholders =
    photos.length === 0 ||
    Boolean(answers?.pickedForYou?.photos) ||
    photos.every(isPlaceholderPhoto);
  const lookPhotos = photos.slice(0, Math.max(photos.length, 0));
  const socialPhotos = lookPhotos;

  async function onAddPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const additions: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError("Use photo files (JPG, PNG, etc.).");
          continue;
        }
        additions.push(await fileToReferenceDataUrl(file));
      }
      if (additions.length === 0) return;
      const base = placeholders ? [] : photos;
      const next = [...base, ...additions];
      updateReferencePhotos(next, { clearPickedPhotos: true });
    } catch {
      setError("Could not read one of those photos. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="locked-you">
        <p className="locked-you-copy">
          Placeholder marks for now — upload your photos to lock your look.
        </p>
        <div className="locked-you-actions">
          <button
            type="button"
            className="locked-you-add"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            + Add photo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="locked-you-file"
            onChange={onAddPhotos}
          />
        </div>
        {error ? (
          <p className="locked-you-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="locked-you">
      <p className="locked-you-copy">
        {placeholders
          ? "Placeholder marks for now — upload your photos to lock your look."
          : brandName
            ? `Locked in as ${brandName}.`
            : "Locked in as you."}
      </p>

      <div className="locked-you-group">
        <p className="locked-you-group-label">Look</p>
        <div className="locked-you-grid">
          {lookPhotos.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`look-${index}`}
              src={src}
              alt={placeholders ? `Placeholder mark ${index + 1}` : `Look ${index + 1}`}
              className="locked-you-photo"
            />
          ))}
        </div>
      </div>

      <div className="locked-you-group">
        <p className="locked-you-group-label">Social set</p>
        <div className="locked-you-grid">
          {socialPhotos.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`social-${index}`}
              src={src}
              alt={
                placeholders
                  ? `Social placeholder ${index + 1}`
                  : `Social photo ${index + 1}`
              }
              className="locked-you-photo"
            />
          ))}
          <button
            type="button"
            className="locked-you-add-tile"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            aria-label="Add photo"
          >
            <span>+</span>
            <small>Add photo</small>
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="locked-you-file"
        onChange={onAddPhotos}
      />
      {error ? (
        <p className="locked-you-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
