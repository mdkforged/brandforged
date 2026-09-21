/**
 * Free sound library — user-owned uploads + links to free licensed catalogs.
 * NO YouTube stream scraping / pirate downloaders.
 * Storage: localStorage bf-sound-library-v1
 */
export const SOUND_LIBRARY_STORAGE_KEY = "bf-sound-library-v1";

/** Reject audio uploads over ~6MB with a clear message. */
export const MAX_SOUND_BYTES = 6 * 1024 * 1024;

export type LibrarySound = {
  id: string;
  title: string;
  /** data URL for the uploaded audio file */
  dataUrl: string;
  mimeType: string;
  byteSize: number;
  /** ISO time when user checked the ownership attestation */
  attestedAt: string;
  createdAt: string;
  source: "upload";
};

export type SoundLibraryState = {
  sounds: LibrarySound[];
  selectedId: string | null;
};

export type FreeCatalogLink = {
  id: string;
  title: string;
  href: string;
  blurb: string;
};

/** Outbound links only — never scrape or mirror these catalogs. */
export const FREE_CATALOG_LINKS: readonly FreeCatalogLink[] = [
  {
    id: "youtube-audio-library",
    title: "YouTube Audio Library",
    href: "https://www.youtube.com/audiolibrary",
    blurb: "Free music and sound effects licensed for creators.",
  },
  {
    id: "free-music-archive",
    title: "Free Music Archive",
    href: "https://freemusicarchive.org/",
    blurb: "Curated free and Creative Commons music.",
  },
  {
    id: "ccmixter",
    title: "ccMixter",
    href: "http://ccmixter.org/",
    blurb: "Remixable tracks under Creative Commons licenses.",
  },
] as const;

const EMPTY_STATE: SoundLibraryState = {
  sounds: [],
  selectedId: null,
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sound-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLibrarySound(item: unknown): item is LibrarySound {
  if (!item || typeof item !== "object") return false;
  const s = item as LibrarySound;
  return (
    typeof s.id === "string" &&
    typeof s.title === "string" &&
    typeof s.dataUrl === "string" &&
    typeof s.mimeType === "string" &&
    typeof s.byteSize === "number" &&
    typeof s.attestedAt === "string" &&
    typeof s.createdAt === "string" &&
    s.source === "upload"
  );
}

export function loadSoundLibrary(): SoundLibraryState {
  if (typeof window === "undefined") return { ...EMPTY_STATE };
  try {
    const raw = window.localStorage.getItem(SOUND_LIBRARY_STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_STATE };
    const obj = parsed as Partial<SoundLibraryState>;
    const sounds = Array.isArray(obj.sounds)
      ? obj.sounds.filter(isLibrarySound)
      : [];
    const selectedId =
      typeof obj.selectedId === "string" &&
      sounds.some((s) => s.id === obj.selectedId)
        ? obj.selectedId
        : null;
    return { sounds, selectedId };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function saveSoundLibrary(state: SoundLibraryState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      SOUND_LIBRARY_STORAGE_KEY,
      JSON.stringify(state),
    );
    return true;
  } catch {
    return false;
  }
}

export function getSelectedSound(
  state: SoundLibraryState,
): LibrarySound | null {
  if (!state.selectedId) return null;
  return state.sounds.find((s) => s.id === state.selectedId) || null;
}

export type AddSoundResult =
  | { ok: true; state: SoundLibraryState; sound: LibrarySound }
  | { ok: false; error: string };

/**
 * Add an attested upload. Caller must have checked the ownership checkbox.
 * Rejects files over MAX_SOUND_BYTES (~6MB).
 */
export function addUploadedSound(
  state: SoundLibraryState,
  input: {
    title: string;
    dataUrl: string;
    mimeType: string;
    byteSize: number;
    attestedAt: string;
  },
): AddSoundResult {
  if (input.byteSize > MAX_SOUND_BYTES) {
    return {
      ok: false,
      error: `That file is too large (over ${Math.round(MAX_SOUND_BYTES / (1024 * 1024))}MB). Pick a shorter clip or compress it under ~6MB.`,
    };
  }
  if (!input.dataUrl || !input.mimeType.startsWith("audio/")) {
    return { ok: false, error: "Use an audio file (MP3, WAV, M4A, etc.)." };
  }
  if (!input.attestedAt) {
    return {
      ok: false,
      error:
        "Confirm you own this music or have legal permission before uploading.",
    };
  }
  const sound: LibrarySound = {
    id: newId(),
    title: input.title.trim() || "Untitled sound",
    dataUrl: input.dataUrl,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    attestedAt: input.attestedAt,
    createdAt: new Date().toISOString(),
    source: "upload",
  };
  const next: SoundLibraryState = {
    sounds: [sound, ...state.sounds],
    selectedId: sound.id,
  };
  if (!saveSoundLibrary(next)) {
    return {
      ok: false,
      error:
        "Could not keep that song on this device. Try a smaller file, then save again.",
    };
  }
  return { ok: true, state: next, sound };
}

export function removeSound(
  state: SoundLibraryState,
  id: string,
): SoundLibraryState {
  const sounds = state.sounds.filter((s) => s.id !== id);
  const selectedId =
    state.selectedId === id
      ? sounds[0]?.id || null
      : state.selectedId && sounds.some((s) => s.id === state.selectedId)
        ? state.selectedId
        : null;
  const next = { sounds, selectedId };
  saveSoundLibrary(next);
  return next;
}

export function selectSound(
  state: SoundLibraryState,
  id: string | null,
): SoundLibraryState {
  const selectedId =
    id && state.sounds.some((s) => s.id === id) ? id : null;
  const next = { ...state, selectedId };
  saveSoundLibrary(next);
  return next;
}

export function formatSoundSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readAudioFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
