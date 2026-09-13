"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  FREE_CATALOG_LINKS,
  MAX_SOUND_BYTES,
  addUploadedSound,
  formatSoundSize,
  getSelectedSound,
  loadSoundLibrary,
  readAudioFileAsDataUrl,
  removeSound,
  selectSound,
  type LibrarySound,
  type SoundLibraryState,
} from "@/lib/sounds/sound-library";

const ATTESTATION_LABEL =
  "I own this music, or I have legal permission to use it in Brand Forged.";

type SoundDrawerProps = {
  primaryHex?: string;
  accentHex?: string;
  textHex?: string;
  secondaryHex?: string;
  onSelectedChange?: (sound: LibrarySound | null) => void;
};

export function SoundDrawer({
  primaryHex = "#b6ff2e",
  accentHex = "#e8ffe4",
  textHex = "#f4f6f2",
  secondaryHex = "#1a2e14",
  onSelectedChange,
}: SoundDrawerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<SoundLibraryState>({
    sounds: [],
    selectedId: null,
  });
  const [attested, setAttested] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const loaded = loadSoundLibrary();
    setLibrary(loaded);
    onSelectedChange?.(getSelectedSound(loaded));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const selected = useMemo(() => getSelectedSound(library), [library]);

  const canUpload = Boolean(attested && pendingFile && !busy);

  const persist = useCallback(
    (next: SoundLibraryState) => {
      setLibrary(next);
      onSelectedChange?.(getSelectedSound(next));
    },
    [onSelectedChange],
  );

  function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setError(null);
    if (!file) {
      setPendingFile(null);
      return;
    }
    if (!file.type.startsWith("audio/")) {
      setPendingFile(null);
      setError("Use an audio file (MP3, WAV, M4A, etc.).");
      return;
    }
    if (file.size > MAX_SOUND_BYTES) {
      setPendingFile(null);
      setError(
        `That file is too large (over ${Math.round(MAX_SOUND_BYTES / (1024 * 1024))}MB). Pick a shorter clip or compress it under ~6MB.`,
      );
      return;
    }
    setPendingFile(file);
  }

  async function onUpload() {
    if (!canUpload || !pendingFile) return;
    setBusy(true);
    setError(null);
    try {
      if (pendingFile.size > MAX_SOUND_BYTES) {
        setError(
          `That file is too large (over ${Math.round(MAX_SOUND_BYTES / (1024 * 1024))}MB). Pick a shorter clip or compress it under ~6MB.`,
        );
        return;
      }
      if (!attested) {
        setError(ATTESTATION_LABEL);
        return;
      }
      const dataUrl = await readAudioFileAsDataUrl(pendingFile);
      const result = addUploadedSound(library, {
        title: pendingFile.name.replace(/\.[^.]+$/, "") || pendingFile.name,
        dataUrl,
        mimeType: pendingFile.type || "audio/mpeg",
        byteSize: pendingFile.size,
        attestedAt: new Date().toISOString(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      persist(result.state);
      setPendingFile(null);
      setAttested(false);
    } catch {
      setError("Could not read that audio file. Try another clip.");
    } finally {
      setBusy(false);
    }
  }

  function onSelect(id: string) {
    persist(selectSound(library, id));
  }

  function onClearSelected() {
    persist(selectSound(library, null));
  }

  function onRemove(id: string) {
    persist(removeSound(library, id));
  }

  const kitBtn: CSSProperties = {
    borderColor: primaryHex,
    background: `${primaryHex}29`,
    color: accentHex,
  };

  return (
    <section className="sound-drawer" aria-label="Free sound drawer">
      <div className="sound-drawer-head">
        <div>
          <p className="sound-drawer-kicker" style={{ color: primaryHex }}>
            Free sound
          </p>
          <h2 className="sound-drawer-title">Sound drawer</h2>
          <p className="sound-drawer-lede">
            Your uploads (you attest you own or license them) plus links to free
            licensed catalogs. No stream scraping. No pirate downloaders.
          </p>
        </div>
        <button
          type="button"
          className="door-upgrade-btn door-upgrade-btn-ghost sound-drawer-toggle"
          style={{ borderColor: `${primaryHex}66`, color: textHex }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open ? (
        <div className="sound-drawer-body">
          <div className="sound-section">
            <h3 className="sound-section-title">Selected</h3>
            {selected ? (
              <div
                className="sound-selected-card"
                style={{ borderColor: `${primaryHex}66` }}
              >
                <div className="sound-selected-meta">
                  <strong>{selected.title}</strong>
                  <span>{formatSoundSize(selected.byteSize)}</span>
                </div>
                <audio
                  className="sound-audio"
                  controls
                  preload="metadata"
                  src={selected.dataUrl}
                />
                <button
                  type="button"
                  className="door-upgrade-btn door-upgrade-btn-ghost"
                  style={{ borderColor: `${primaryHex}66`, color: textHex }}
                  onClick={onClearSelected}
                >
                  Clear selection
                </button>
              </div>
            ) : (
              <p className="sound-empty">
                No sound selected yet. Add one below or pick from Your songs.
              </p>
            )}
          </div>

          <div className="sound-section">
            <h3 className="sound-section-title">Your songs</h3>
            {library.sounds.length === 0 ? (
              <p className="sound-empty">
                Nothing saved yet. Free catalog links are below if you need
                licensed tracks first.
              </p>
            ) : (
              <ul className="sound-song-list" role="list">
                {library.sounds.map((song) => {
                  const isActive = library.selectedId === song.id;
                  return (
                    <li
                      key={song.id}
                      className={
                        isActive
                          ? "sound-song-row is-selected"
                          : "sound-song-row"
                      }
                      style={{
                        borderColor: isActive
                          ? primaryHex
                          : `${primaryHex}33`,
                        background: isActive
                          ? `${primaryHex}14`
                          : secondaryHex,
                      }}
                    >
                      <button
                        type="button"
                        className="sound-song-pick"
                        onClick={() => onSelect(song.id)}
                      >
                        <strong style={{ color: textHex }}>{song.title}</strong>
                        <span style={{ color: accentHex }}>
                          {formatSoundSize(song.byteSize)}
                          {isActive ? " · selected" : ""}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="sound-song-remove"
                        aria-label={`Remove ${song.title}`}
                        onClick={() => onRemove(song.id)}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="sound-section">
            <h3 className="sound-section-title">Free catalogs</h3>
            <p className="sound-empty">
              Open a catalog, download a track you are allowed to use, then
              add it here with the attestation checked.
            </p>
            <ul className="sound-catalog-list" role="list">
              {FREE_CATALOG_LINKS.map((link) => (
                <li key={link.id} className="sound-catalog-card">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sound-catalog-link"
                    style={{ borderColor: `${primaryHex}55`, color: accentHex }}
                  >
                    <strong style={{ color: primaryHex }}>{link.title}</strong>
                    <span>{link.blurb}</span>
                    <span className="sound-catalog-cta">Open catalog →</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="sound-section sound-upload">
            <h3 className="sound-section-title">Upload</h3>
            <label className="sound-file-label">
              <span className="sr-only">Choose audio file</span>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                className="sound-file-input"
                onChange={onFileChosen}
              />
              <button
                type="button"
                className="door-upgrade-btn door-upgrade-btn-ghost sound-file-btn"
                style={{ borderColor: `${primaryHex}66`, color: textHex }}
                onClick={() => fileRef.current?.click()}
              >
                {pendingFile ? pendingFile.name : "Choose audio file"}
              </button>
            </label>
            {pendingFile ? (
              <p className="sound-file-meta">
                {formatSoundSize(pendingFile.size)} · max ~
                {Math.round(MAX_SOUND_BYTES / (1024 * 1024))}MB
              </p>
            ) : (
              <p className="sound-file-meta">
                Audio only. Max ~{Math.round(MAX_SOUND_BYTES / (1024 * 1024))}MB.
              </p>
            )}

            <label className="sound-attest">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
              />
              <span>{ATTESTATION_LABEL}</span>
            </label>

            <button
              type="button"
              className="door-upgrade-btn"
              style={kitBtn}
              disabled={!canUpload}
              onClick={() => void onUpload()}
            >
              {busy ? "Saving…" : "Add to Your songs"}
            </button>

            {error ? (
              <p className="sound-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
