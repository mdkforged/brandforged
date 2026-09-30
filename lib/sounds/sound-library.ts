/**
 * Free sound library — user-owned uploads + links to free licensed catalogs.
 * NO YouTube stream scraping / pirate downloaders.
 * Storage: metadata in localStorage bf-sound-library-v1; song bytes in
 * IndexedDB (see sound-blob-store.ts) so files up to 25MB fit.
 */
import {
  deleteSoundBlob,
  getSoundBlob,
  putSoundBlob,
} from "@/lib/sounds/sound-blob-store";

export const SOUND_LIBRARY_STORAGE_KEY = "bf-sound-library-v1";

/** Max audio upload size, shown on the upload buttons. */
export const MAX_SOUND_MB = 25;
export const MAX_SOUND_BYTES = MAX_SOUND_MB * 1024 * 1024;

/** Only used when IndexedDB is unavailable: small files can ride in localStorage. */
const LOCAL_DATA_URL_MAX_BYTES = 3 * 1024 * 1024;

function formatMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const rounded = Math.round(mb * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** e.g. "That file is 31MB. Max is 25MB." */
export function soundTooLargeMessage(bytes: number): string {
  return `That file is ${formatMb(bytes)}MB. Max is ${MAX_SOUND_MB}MB.`;
}

/** Returns a visible error string, or null when the file is OK to add. */
export function validateSoundFile(file: { size: number; type: string }): string | null {
  if (!file.type.startsWith("audio/")) {
    return "Use an audio file (MP3, WAV, M4A, etc.).";
  }
  if (file.size > MAX_SOUND_BYTES) {
    return soundTooLargeMessage(file.size);
  }
  return null;
}

export type LibrarySound = {
  id: string;
  title: string;
  /** data URL for older small uploads; empty when bytes live in IndexedDB */
  dataUrl: string;
  /** "idb" when the audio bytes are stored in IndexedDB under this id */
  storage?: "idb";
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
 * Rejects files over MAX_SOUND_BYTES (25MB) with a message stating the max.
 * Bytes go to IndexedDB; only metadata is written to localStorage.
 */
export async function addUploadedSoundFile(
  state: SoundLibraryState,
  file: File,
  attestedAt: string,
): Promise<AddSoundResult> {
  const invalid = validateSoundFile(file);
  if (invalid) return { ok: false, error: invalid };
  if (!attestedAt) {
    return {
      ok: false,
      error:
        "Confirm you own this music or have legal permission before uploading.",
    };
  }
  const id = newId();
  let storedInIdb = false;
  let dataUrl = "";
  try {
    await putSoundBlob(id, file);
    storedInIdb = true;
  } catch {
    if (file.size <= LOCAL_DATA_URL_MAX_BYTES) {
      try {
        dataUrl = await readAudioFileAsDataUrl(file);
      } catch {
        dataUrl = "";
      }
    }
    if (!dataUrl) {
      return {
        ok: false,
        error: `Could not keep that song on this device (browser storage is full or blocked). Max is ${MAX_SOUND_MB}MB.`,
      };
    }
  }
  const sound: LibrarySound = {
    id,
    title: file.name.replace(/\.[^.]+$/, "") || file.name || "Untitled sound",
    dataUrl,
    mimeType: file.type || "audio/mpeg",
    byteSize: file.size,
    attestedAt,
    createdAt: new Date().toISOString(),
    source: "upload",
    ...(storedInIdb ? { storage: "idb" as const } : {}),
  };
  const next: SoundLibraryState = {
    sounds: [sound, ...state.sounds],
    selectedId: sound.id,
  };
  if (!saveSoundLibrary(next)) {
    if (storedInIdb) void deleteSoundBlob(id).catch(() => undefined);
    return {
      ok: false,
      error:
        "Could not keep that song on this device. Free some space, then save again.",
    };
  }
  return { ok: true, state: next, sound };
}

/**
 * Playable src for a sound: its data URL, or an object URL from IndexedDB
 * (caller revokes blob: URLs). Null when the bytes are gone.
 */
export async function resolveSoundSrc(sound: LibrarySound): Promise<string | null> {
  if (sound.dataUrl) return sound.dataUrl;
  if (sound.storage !== "idb") return null;
  try {
    const blob = await getSoundBlob(sound.id);
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    return null;
  }
}

export function removeSound(
  state: SoundLibraryState,
  id: string,
): SoundLibraryState {
  const removed = state.sounds.find((s) => s.id === id);
  if (removed?.storage === "idb") {
    void deleteSoundBlob(id).catch(() => undefined);
  }
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
