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
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
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
  const lookPhotos = placeholders
    ? []
    : photos.filter((p) => !isPlaceholderPhoto(p));

  async function persistPhotos(next: string[]): Promise<boolean> {
    const ok = updateReferencePhotos(next, { clearPickedPhotos: true });
    if (!ok) {
      setError(
        "Could not save photos on this device. Try a smaller photo, then try again.",
      );
    }
    return ok;
  }

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
      const base = lookPhotos;
      const next = [...base, ...additions];
      await persistPhotos(next);
    } catch {
      setError("Could not read one of those photos. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onReplacePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const index = replaceIndex;
    setReplaceIndex(null);
    if (!file || index === null) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a photo file (JPG, PNG, etc.).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToReferenceDataUrl(file);
      const next = [...lookPhotos];
      if (index >= 0 && index < next.length) {
        next[index] = dataUrl;
      } else {
        next.push(dataUrl);
      }
      await persistPhotos(next);
    } catch {
      setError("Could not read that photo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function startReplace(index: number) {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  }

  if (lookPhotos.length === 0) {
    return (
      <div className="locked-you">
        <p className="locked-you-copy">
          {placeholders
            ? "Upload your photos to lock your look. Brand marks are only stand-ins until you do."
            : "No look photos yet. Add one to get started."}
        </p>
        <div className="locked-you-actions">
          <button
            type="button"
            className="locked-you-add"
            disabled={busy}
            onClick={() => addInputRef.current?.click()}
          >
            + Add photo
          </button>
          <input
            ref={addInputRef}
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
        {brandName ? `Locked in as ${brandName}.` : "Locked in as you."} Tap a
        photo to replace it. Add more anytime.
      </p>

      <div className="locked-you-group">
        <p className="locked-you-group-label">Look</p>
        <div className="locked-you-grid">
          {lookPhotos.map((src, index) => (
            <button
              key={`look-${index}`}
              type="button"
              className="locked-you-photo-btn"
              disabled={busy}
              onClick={() => startReplace(index)}
              aria-label={`Replace look photo ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Look ${index + 1}`}
                className="locked-you-photo"
              />
              <span className="locked-you-replace-hint">Replace</span>
            </button>
          ))}
          <button
            type="button"
            className="locked-you-add-tile"
            disabled={busy}
            onClick={() => addInputRef.current?.click()}
            aria-label="Add photo"
          >
            <span>+</span>
            <small>Add photo</small>
          </button>
        </div>
      </div>

      <input
        ref={addInputRef}
        type="file"
        accept="image/*"
        multiple
        className="locked-you-file"
        onChange={onAddPhotos}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="locked-you-file"
        onChange={onReplacePhoto}
      />
      {error ? (
        <p className="locked-you-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
