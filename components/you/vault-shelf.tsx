"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  isPlaceholderPhoto,
  updateReferencePhotos,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import { fileToReferenceDataUrl } from "@/lib/onboarding/questions";
import {
  addToVault,
  getVaultBlob,
  removeFromVault,
  useVault,
  VAULT_FULL_MESSAGE,
  VAULT_MAX,
} from "@/lib/vault/vault-store";

/** Vault: a small shelf of saved stills on this device (IndexedDB, max 12). */
export function VaultShelf() {
  const answers = useOnboardingAnswers();
  const vault = useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Same Look set as LockedAsYouPhotos (placeholders don't count).
  const photos = Array.isArray(answers?.referencePhotos)
    ? answers.referencePhotos.filter((p) => typeof p === "string" && p.length > 0)
    : [];
  const placeholders =
    photos.length === 0 ||
    Boolean(answers?.pickedForYou?.photos) ||
    photos.every(isPlaceholderPhoto);
  const lookPhotos = placeholders
    ? []
    : photos.filter((p) => !isPlaceholderPhoto(p));

  const items = vault.items;
  const full = items.length >= VAULT_MAX;
  const selected = items.find((i) => i.id === selectedId) || null;

  function selectItem(id: string) {
    setSelectedId((cur) => (cur === id ? null : id));
    setPicking(false);
    setConfirmDelete(false);
    setNotice(null);
    setError(null);
  }

  function onAddClick() {
    setNotice(null);
    if (full) {
      setError(VAULT_FULL_MESSAGE);
      return;
    }
    setError(null);
    fileRef.current?.click();
  }

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    let added = 0;
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setError("Use image files (JPG, PNG, etc.).");
          continue;
        }
        const res = await addToVault(file);
        if (!res.ok) {
          // Full, no storage, or quota: say so and refuse the rest.
          setError(res.message);
          break;
        }
        added += 1;
      }
      if (added > 0) {
        setNotice(
          added === 1 ? "Saved to the Vault." : `Saved ${added} stills to the Vault.`,
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function applyToLook(index: number) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const blob = await getVaultBlob(selected.id);
      if (!blob) {
        setError("That still is no longer in the Vault. Nothing was changed.");
        return;
      }
      // Compressed exactly like other Look photos.
      const dataUrl = await fileToReferenceDataUrl(
        new File([blob], "vault-still.jpg", { type: blob.type || "image/jpeg" }),
      );
      const next = [...lookPhotos];
      if (index >= 0 && index < next.length) {
        next[index] = dataUrl;
      } else if (next.length === 0 && index === 0) {
        next.push(dataUrl);
      } else {
        return;
      }
      const ok = updateReferencePhotos(next, { clearPickedPhotos: true });
      if (!ok) {
        setError(
          "Could not save that Look photo on this device. Nothing was changed.",
        );
        return;
      }
      setPicking(false);
      setNotice(`Look photo ${index + 1} replaced from the Vault.`);
    } catch {
      setError("Could not read that still. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!selected) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await removeFromVault(selected.id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSelectedId(null);
      setPicking(false);
      setConfirmDelete(false);
      setNotice("Removed from the Vault.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="module-card vault-card">
      <h2>Vault</h2>
      <p className="vault-copy">
        Saved stills, kept on this device only (up to {VAULT_MAX}). Tap one to
        use it on your Look or delete it.
      </p>
      {vault.status === "error" && vault.error ? (
        <p className="locked-you-error" role="alert">
          {vault.error}
        </p>
      ) : null}

      <div className="vault-shelf" role="listbox" aria-label="Vault stills">
        {items.map((item, index) => {
          const on = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={on}
              className={on ? "vault-thumb is-selected" : "vault-thumb"}
              disabled={busy}
              onClick={() => selectItem(item.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={`Vault still ${index + 1}`} />
            </button>
          );
        })}
        <button
          type="button"
          className="vault-thumb vault-add-tile"
          disabled={busy || vault.status === "error"}
          onClick={onAddClick}
          aria-label="Add to Vault"
        >
          <span>+</span>
          <small>Add</small>
        </button>
      </div>
      <p className="vault-count">
        {vault.status === "loading"
          ? "Opening the Vault..."
          : `${items.length} / ${VAULT_MAX}`}
      </p>
      {full ? (
        <p className="vault-full" role="status">
          {VAULT_FULL_MESSAGE}
        </p>
      ) : null}

      {selected ? (
        <div className="vault-actions">
          <button
            type="button"
            className="new-button"
            disabled={busy}
            aria-expanded={picking}
            onClick={() => {
              setPicking((v) => !v);
              setConfirmDelete(false);
            }}
          >
            Use on Look
          </button>
          <button
            type="button"
            className="new-button vault-delete"
            disabled={busy}
            onClick={() => void onDelete()}
          >
            {confirmDelete ? "Tap again to delete" : "Delete"}
          </button>
        </div>
      ) : null}

      {selected && picking ? (
        <div className="vault-replace">
          <p className="vault-copy">
            {lookPhotos.length > 0
              ? "Replace which Look photo?"
              : "No Look photos yet \u2014 this still becomes Look photo 1."}
          </p>
          <div className="vault-shelf">
            {lookPhotos.length > 0 ? (
              lookPhotos.map((src, i) => (
                <button
                  key={`vault-look-${i}`}
                  type="button"
                  className="vault-thumb vault-look-tile"
                  disabled={busy}
                  onClick={() => void applyToLook(i)}
                  aria-label={`Replace Look photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Look ${i + 1}`} />
                  <span className="vault-replace-hint">Replace {i + 1}</span>
                </button>
              ))
            ) : (
              <button
                type="button"
                className="new-button"
                disabled={busy}
                onClick={() => void applyToLook(0)}
              >
                Use as Look photo 1
              </button>
            )}
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="vault-notice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="locked-you-error" role="alert">
          {error}
        </p>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="locked-you-file"
        onChange={(e) => void onFiles(e)}
      />
    </article>
  );
}
