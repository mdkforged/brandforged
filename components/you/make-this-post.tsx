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
import { requestAiCaption, selectNotesForBrief } from "@/lib/you/make-caption";
import { loadNotes } from "@/lib/you/notes";
import { classifyBrief } from "@/lib/you/make-order";
import { downloadNameForImage, requestImageEdit } from "@/lib/you/make-image";
import {
  isTetheredTruthBrand,
  TETHERED_TRUTH_KIT_TOKENS,
} from "@/lib/brand/tethered-truth-palette";
import {
  BRAND_SLOTS,
  loadBrandMasters,
  loadBrandPick,
  masterToPalette,
  saveBrandPick,
  type BrandMasters,
  type BrandSlot,
} from "@/lib/brand/brand-masters";
import { BrandMastersPocket } from "@/components/you/brand-masters-pocket";
import { addDataUrlToVault } from "@/lib/vault/vault-store";

const MAKE_DESTINATIONS: SocialSiteId[] = [
  "instagram",
  "tiktok",
  "youtube",
  "threads",
];

type MakeResult = {
  caption: string;
  photoSrc: string;
  source: "ai" | "local";
  /** "edit" = new image returned by the image edit API from the selected photo. */
  imageKind: "original" | "edit";
};

export function MakeThisPost() {
  const answers = useOnboardingAnswers();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);
  const [oneLiner, setOneLiner] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Making...");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<MakeResult | null>(null);
  // Brand masters + picked brand: lazy reads from this device (no effects).
  const [masters, setMasters] = useState<BrandMasters>(loadBrandMasters);
  const [brandPick, setBrandPick] = useState<BrandSlot>(() =>
    loadBrandPick(loadBrandMasters()),
  );
  const [brandMsg, setBrandMsg] = useState<string | null>(null);
  const [pocketOpen, setPocketOpen] = useState(false);
  const [pocketSlot, setPocketSlot] = useState<BrandSlot>(1);
  const pocketRef = useRef<HTMLDivElement>(null);
  // The optional one-off upload never blocks Make this with the Look photo.
  const [uploading, setUploading] = useState(false);
  // Bumped when she taps a Look thumb so a late upload never overrides it.
  const uploadTokenRef = useRef(0);
  const [vaultSaving, setVaultSaving] = useState(false);
  const [vaultNote, setVaultNote] = useState<{
    src: string;
    ok: boolean;
    text: string;
  } | null>(null);

  const lookPhotos = useMemo(() => {
    const photos = Array.isArray(answers?.referencePhotos)
      ? answers.referencePhotos.filter(
          (p) => typeof p === "string" && p.length > 0 && !isPlaceholderPhoto(p),
        )
      : [];
    return photos;
  }, [answers]);

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

  // Always one highlighted Look photo when any exist (default: the first).
  const lookIndex =
    lookPhotos.length > 0 ? Math.min(selectedIndex, lookPhotos.length - 1) : -1;
  const selectedPhoto = uploadSrc
    ? uploadSrc
    : lookIndex >= 0
      ? lookPhotos[lookIndex]
      : null;

  const paletteStyle = {
    "--make-primary": primaryHex,
    "--make-bg": backgroundHex,
    "--make-accent": accentHex,
    "--make-text": textHex,
  } as CSSProperties;

  function onPickBrand(slot: BrandSlot) {
    if (!masters[slot]) {
      // Never invent a palette: ask her to save the empty brand first.
      setBrandMsg(
        `Brand ${slot} is empty. Save Brand ${slot} first - add its name and colors below.`,
      );
      setPocketSlot(slot);
      setPocketOpen(true);
      window.setTimeout(() => {
        pocketRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
      return;
    }
    setBrandMsg(null);
    setBrandPick(slot);
    saveBrandPick(slot);
    setResult(null);
  }

  function onMastersSaved(next: BrandMasters) {
    setMasters(next);
    setBrandMsg(null);
    setResult(null);
    if (!next[brandPick]) {
      setBrandPick(1);
      saveBrandPick(1);
    }
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a photo file (JPG, PNG, etc.).");
      return;
    }
    const token = uploadTokenRef.current + 1;
    uploadTokenRef.current = token;
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await fileToReferenceDataUrl(file);
      if (uploadTokenRef.current !== token) return;
      setUploadSrc(dataUrl);
      setResult(null);
    } catch {
      if (uploadTokenRef.current === token) {
        setError("Could not read that photo. Try again.");
      }
    } finally {
      if (uploadTokenRef.current === token) setUploading(false);
    }
  }

  function pickLook(index: number) {
    // Tapping a Look thumb clears the one-off upload override.
    uploadTokenRef.current += 1;
    setUploading(false);
    setUploadSrc(null);
    setSelectedIndex(index);
    setResult(null);
  }

  async function onMake() {
    setError(null);
    setCopied(false);
    const photo = selectedPhoto;
    if (!photo) {
      setError("Add a Look photo above first.");
      return;
    }
    const line = oneLiner.trim();
    if (!line) {
      setError("Add one sentence about what this post is.");
      return;
    }
    // Only the applied brand's master - no mixing, no fallback to T&T tokens.
    const master = masters[brandPick];
    if (!master) {
      setError(`Save Brand ${brandPick} first.`);
      return;
    }
    const useKitVoice = brandPick === 1;
    const kind = classifyBrief(line);
    const captionInput = {
      brandName: master.name,
      oneLiner: line,
      voiceLabel: useKitVoice ? kit?.voiceLabel : undefined,
      voiceTone: useKitVoice ? tokens?.voiceTone : undefined,
      moodTags: useKitVoice ? tokens?.moodTags : undefined,
      // Notes read at click time (no effect): her own words about the release.
      notes: selectNotesForBrief(loadNotes(), line),
      brand: master,
    };
    setBusyLabel(kind === "visual" ? "Editing image..." : "Making...");
    setBusy(true);
    setResult(null);
    try {
      if (kind === "visual") {
        // The brief is an order about the selected photo: edit the image.
        const [edit, cap] = await Promise.all([
          requestImageEdit({
            order: line,
            photoSrc: photo,
            brandName: master.name,
            palette: masterToPalette(master),
            brand: master,
          }),
          requestAiCaption(captionInput),
        ]);
        if (!edit.ok) {
          // Never show the original photo as if it were the result.
          setError(edit.message);
          return;
        }
        setResult({
          caption: cap.caption,
          photoSrc: edit.image,
          source: cap.source,
          imageKind: "edit",
        });
        return;
      }
      const { caption, source } = await requestAiCaption(captionInput);
      setResult({ caption, photoSrc: photo, source, imageKind: "original" });
    } catch {
      setError("Could not make the caption. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveResultToVault() {
    if (!result || result.imageKind !== "edit") return;
    const src = result.photoSrc;
    setVaultSaving(true);
    try {
      const res = await addDataUrlToVault(src);
      setVaultNote({
        src,
        ok: res.ok,
        text: res.ok ? "Saved to the Vault." : res.message,
      });
    } finally {
      setVaultSaving(false);
    }
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
        this. Give an order like &quot;Make into album art - title: Moment To
        Rise&quot; to edit the photo. Nothing is posted for you.
      </p>

      <div className="make-this-photos" role="listbox" aria-label="Look photo">
        {lookPhotos.map((src, index) => {
          const selected = !uploadSrc && lookIndex === index;
          return (
            <button
              key={`make-look-${index}`}
              type="button"
              role="option"
              aria-selected={selected}
              className={
                selected ? "make-this-thumb is-selected" : "make-this-thumb"
              }
              onClick={() => pickLook(index)}
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
          disabled={busy || uploading}
          title="Optional: use a different photo for this post only"
        >
          {uploadSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={uploadSrc} alt="Uploaded for this post" />
          ) : (
            <span>{uploading ? "Reading..." : "+ Upload"}</span>
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
      <p className="make-this-using">
        {uploadSrc
          ? "Using your one-off upload. Tap a Look photo to go back."
          : `Using Look photo ${lookIndex + 1}.`}
      </p>

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

      <div className="make-this-brands" role="group" aria-label="Apply brand">
        {BRAND_SLOTS.map((slot) => {
          const m = masters[slot];
          const on = brandPick === slot;
          const cls = ["make-this-brand", on ? "is-on" : "", m ? "" : "is-empty"]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={`apply-brand-${slot}`}
              type="button"
              className={cls}
              aria-pressed={on}
              title={m ? m.name : `Brand ${slot} is empty - save it first`}
              onClick={() => onPickBrand(slot)}
            >
              Apply Brand {slot}
              {m ? (
                <span className="make-this-brand-swatches" aria-hidden>
                  {[m.backgroundHex, m.primaryHex, m.accentHex, m.textHex].map(
                    (hex, i) => (
                      <span key={`swatch-${slot}-${i}`} style={{ background: hex }} />
                    ),
                  )}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="make-this-brand-meta">
        <span>
          Using Brand {brandPick}: {masters[brandPick]?.name || masters[1].name}
        </span>
        <button
          type="button"
          className="make-this-brand-edit"
          aria-expanded={pocketOpen}
          onClick={() => setPocketOpen((v) => !v)}
        >
          {pocketOpen ? "Hide brand masters" : "Edit brand masters"}
        </button>
      </div>
      {brandMsg ? (
        <p className="locked-you-error" role="alert">
          {brandMsg}
        </p>
      ) : null}
      {pocketOpen ? (
        <div ref={pocketRef}>
          <BrandMastersPocket
            masters={masters}
            slot={pocketSlot}
            onSlotChange={setPocketSlot}
            onSaved={onMastersSaved}
          />
        </div>
      ) : null}

      <button
        type="button"
        className="door-upgrade-btn make-this-go"
        disabled={busy}
        onClick={() => void onMake()}
      >
        {busy ? busyLabel : "Make this"}
      </button>

      {error ? (
        <p className="locked-you-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="make-this-result">
          <div className="make-this-result-head">
            <p className="make-this-result-label">Ready to copy - not posted</p>
            <span className="make-this-badges">
              {result.imageKind === "edit" ? (
                <span
                  className="make-this-image-source"
                  title="New image from the image edit API, made from your selected Look photo"
                >
                  Edited from your Look photo
                </span>
              ) : null}
              <span
                className={
                  result.source === "ai"
                    ? "make-this-source is-ai"
                    : "make-this-source is-local"
                }
                title={
                  result.source === "ai"
                    ? "Caption from Grok"
                    : "Caption from local voice (AI unavailable)"
                }
              >
                {result.source === "ai" ? "AI" : "Local"}
              </span>
            </span>
          </div>
          <div className="make-this-preview">
            <div className="make-this-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.photoSrc}
                alt={
                  result.imageKind === "edit"
                    ? "Edited image from your order"
                    : "Post preview"
                }
              />
            </div>
            <pre className="make-this-caption">{result.caption}</pre>
          </div>
          <div className="make-this-actions">
            <button type="button" className="new-button" onClick={() => void copyCaption()}>
              {copied ? "Copied" : "Copy caption"}
            </button>
            {result.imageKind === "edit" ? (
              <a
                className="new-button"
                href={result.photoSrc}
                download={downloadNameForImage(result.photoSrc)}
              >
                Download / Save image
              </a>
            ) : null}
            {result.imageKind === "edit" ? (
              <button
                type="button"
                className="new-button"
                disabled={
                  vaultSaving ||
                  (vaultNote?.ok === true && vaultNote.src === result.photoSrc)
                }
                onClick={() => void saveResultToVault()}
              >
                {vaultSaving
                  ? "Saving..."
                  : vaultNote?.ok === true && vaultNote.src === result.photoSrc
                    ? "Saved to Vault"
                    : "Save to Vault"}
              </button>
            ) : null}
          </div>
          {vaultNote && vaultNote.src === result.photoSrc ? (
            <p
              className={vaultNote.ok ? "vault-notice" : "locked-you-error"}
              role={vaultNote.ok ? "status" : "alert"}
            >
              {vaultNote.text}
            </p>
          ) : null}
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
