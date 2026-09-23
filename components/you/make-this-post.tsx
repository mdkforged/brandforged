"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  isPlaceholderPhoto,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import { fileToReferenceDataUrl } from "@/lib/onboarding/questions";
import {
  labelForSite,
  type SocialSiteId,
} from "@/lib/onboarding/social";
import { PLATFORM_OPEN_URL } from "@/lib/onboarding/reach-packs";
import { localOnBrandCaption } from "@/lib/you/make-caption";
import {
  isTetheredTruthBrand,
  TETHERED_TRUTH_KIT_TOKENS,
} from "@/lib/brand/tethered-truth-palette";

const MAKE_DESTINATIONS: SocialSiteId[] = [
  "instagram",
  "tiktok",
  "youtube",
  "threads",
];

type MakeResult = {
  caption: string;
  photoSrc: string;
  source: "local";
};

export function MakeThisPost() {
  const answers = useOnboardingAnswers();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);
  const [oneLiner, setOneLiner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<MakeResult | null>(null);

  const lookPhotos = useMemo(() => {
    const photos = Array.isArray(answers?.referencePhotos)
      ? answers.referencePhotos.filter(
          (p) => typeof p === "string" && p.length > 0 && !isPlaceholderPhoto(p),
        )
      : [];
    return photos;
  }, [answers]);

  const brandName =
    (typeof answers?.brandName === "string" && answers.brandName.trim()) ||
    (typeof answers?.aboutYou === "string" && answers.aboutYou.trim()) ||
    "your brand";

  const kit = answers?.kit;
  const tokens = kit?.tokens;
  const brandForPalette =
    answers?.brandName?.trim() || answers?.aboutYou?.trim() || "";
  const primaryHex = isTetheredTruthBrand(brandForPalette)
    ? TETHERED_TRUTH_KIT_TOKENS.primaryHex
    : tokens?.primaryHex || "#ad885d";
  const backgroundHex = isTetheredTruthBrand(brandForPalette)
    ? TETHERED_TRUTH_KIT_TOKENS.backgroundHex
    : tokens?.backgroundHex || "#0c0c0d";
  const accentHex = isTetheredTruthBrand(brandForPalette)
    ? TETHERED_TRUTH_KIT_TOKENS.accentHex
    : tokens?.accentHex || "#8a8179";
  const textHex = isTetheredTruthBrand(brandForPalette)
    ? TETHERED_TRUTH_KIT_TOKENS.textHex
    : tokens?.textHex || "#f4f6f2";

  const destinations = useMemo(() => {
    const picked = Array.isArray(answers?.socialSites)
      ? (answers.socialSites as SocialSiteId[])
      : [];
    const set = new Set(picked);
    return MAKE_DESTINATIONS.filter((id) => set.has(id));
  }, [answers]);

  const selectedPhoto = uploadSrc
    ? uploadSrc
    : lookPhotos[Math.min(selectedIndex, Math.max(lookPhotos.length - 1, 0))] ||
      null;

  const paletteStyle = {
    "--make-primary": primaryHex,
    "--make-bg": backgroundHex,
    "--make-accent": accentHex,
    "--make-text": textHex,
  } as CSSProperties;

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a photo file (JPG, PNG, etc.).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToReferenceDataUrl(file);
      setUploadSrc(dataUrl);
      setResult(null);
    } catch {
      setError("Could not read that photo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function onMake() {
    setError(null);
    setCopied(false);
    const photo = selectedPhoto;
    if (!photo) {
      setError("Pick a Look photo or upload one first.");
      return;
    }
    const line = oneLiner.trim();
    if (!line) {
      setError("Add one sentence about what this post is.");
      return;
    }
    // Local kit voice only for now (no Grok/API route in this app yet).
    const caption = localOnBrandCaption({
      brandName,
      oneLiner: line,
      voiceLabel: kit?.voiceLabel,
      voiceTone: tokens?.voiceTone,
      moodTags: tokens?.moodTags,
    });
    setResult({ caption, photoSrc: photo, source: "local" });
  }

  async function copyCaption() {
    if (!result) return;
    setCopied(false);
    try {
      await navigator.clipboard.writeText(result.caption);
      setCopied(true);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = result.caption;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
      } catch {
        setError("Could not copy. Select the caption and copy manually.");
      }
    }
  }

  function openDestination(id: SocialSiteId) {
    const url = PLATFORM_OPEN_URL[id];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  if (lookPhotos.length === 0 && !uploadSrc) {
    return (
      <article className="module-card make-this-card" style={paletteStyle}>
        <h2>Make this</h2>
        <p className="make-this-hint">
          Add a Look photo above, then come back to make a post from it.
        </p>
      </article>
    );
  }

  return (
    <article className="module-card make-this-card" style={paletteStyle}>
      <h2>Make this</h2>
      <p className="make-this-hint">
        Pick one Look photo, say what the post is in one sentence, then Make
        this. Caption stays on this page — nothing is posted for you.
      </p>

      <div className="make-this-photos" role="listbox" aria-label="Look photo">
        {lookPhotos.map((src, index) => {
          const selected = !uploadSrc && selectedIndex === index;
          return (
            <button
              key={`make-look-${index}`}
              type="button"
              role="option"
              aria-selected={selected}
              className={
                selected ? "make-this-thumb is-selected" : "make-this-thumb"
              }
              onClick={() => {
                setUploadSrc(null);
                setSelectedIndex(index);
                setResult(null);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Look ${index + 1}`} />
            </button>
          );
        })}
        <button
          type="button"
          className={
            uploadSrc ? "make-this-thumb is-selected make-this-upload" : "make-this-thumb make-this-upload"
          }
          onClick={() => uploadRef.current?.click()}
          disabled={busy}
        >
          {uploadSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={uploadSrc} alt="Uploaded for this post" />
          ) : (
            <span>+ Upload</span>
          )}
        </button>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="locked-you-file"
          onChange={onUpload}
        />
      </div>

      <label className="make-this-line">
        <span>What this post is</span>
        <input
          type="text"
          value={oneLiner}
          maxLength={160}
          placeholder="One sentence — the point of this post"
          onChange={(e) => {
            setOneLiner(e.target.value);
            setResult(null);
          }}
        />
      </label>

      <button
        type="button"
        className="door-upgrade-btn make-this-go"
        disabled={busy}
        onClick={onMake}
      >
        Make this
      </button>

      {error ? (
        <p className="locked-you-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="make-this-result">
          <p className="make-this-result-label">Ready to copy — not posted</p>
          <div className="make-this-preview">
            <div className="make-this-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.photoSrc} alt="Post preview" />
            </div>
            <pre className="make-this-caption">{result.caption}</pre>
          </div>
          <div className="make-this-actions">
            <button type="button" className="new-button" onClick={() => void copyCaption()}>
              {copied ? "Copied" : "Copy caption"}
            </button>
          </div>
          {destinations.length > 0 ? (
            <div className="make-this-destinations" role="group" aria-label="Open destination">
              <p className="make-this-result-label">Open to paste</p>
              <div className="make-this-chips">
                {destinations.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="social-chip is-checked"
                    onClick={() => openDestination(id)}
                  >
                    {labelForSite(id)}
                  </button>
                ))}
              </div>
              <p className="make-this-hint">
                Opens the app or site so you can paste. Nothing is published from
                here.
              </p>
            </div>
          ) : (
            <p className="make-this-hint">
              No IG / TikTok / YouTube / Threads picked yet. Add them in Change
              answers when you want destination chips here.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
