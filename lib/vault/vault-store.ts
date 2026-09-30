/**
 * Vault: a small on-device shelf of saved stills (max 12).
 * Image bytes live in IndexedDB (own db, mirroring the song blob store) and
 * never in kit localStorage. A tiny external store feeds React through
 * useSyncExternalStore, so loading never sets state inside an effect.
 */
import { useSyncExternalStore } from "react";

export const VAULT_MAX = 12;
export const VAULT_FULL_MESSAGE =
  "Vault is full (12). Remove one to add another.";
export const VAULT_UNAVAILABLE_MESSAGE =
  "The Vault can't save on this device (on-device storage isn't available here). Nothing was added.";
export const VAULT_QUOTA_MESSAGE =
  "This device is out of room for the Vault. Nothing was added \u2014 remove a still or free up space, then try again.";
const VAULT_LOAD_ERROR =
  "The Vault can't open on this device (on-device storage isn't available here).";

const DB_NAME = "bf-vault";
const DB_VERSION = 1;
const STORE = "stills";
/** Client-side compression for stills: long edge and JPEG quality. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

type StoredStill = {
  id: string;
  type: string;
  bytes: ArrayBuffer;
  createdAt: string;
};

export type VaultItem = { id: string; url: string; createdAt: string };
export type VaultState = {
  status: "idle" | "loading" | "ready" | "error";
  items: VaultItem[];
  error: string | null;
};
export type VaultResult = { ok: true } | { ok: false; message: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    req.onblocked = () => reject(new Error("IndexedDB blocked"));
  });
}

async function runTx<T>(
  mode: IDBTransactionMode,
  fn: (
    store: IDBObjectStore,
    abortWith: (v: T) => void,
    set: (v: T) => void,
  ) => void,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    let result: T | undefined;
    // Only an abort we asked for resolves; a quota/storage abort rejects.
    let selfAborted = false;
    let tx: IDBTransaction;
    try {
      tx = db.transaction(STORE, mode);
    } catch (err) {
      db.close();
      reject(err);
      return;
    }
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("IndexedDB write failed"));
    };
    tx.onabort = () => {
      db.close();
      if (selfAborted) resolve(result);
      else reject(tx.error || new Error("IndexedDB aborted"));
    };
    fn(
      tx.objectStore(STORE),
      (v) => {
        result = v;
        selfAborted = true;
        tx.abort();
      },
      (v) => {
        result = v;
      },
    );
  });
}

function isStoredStill(v: unknown): v is StoredStill {
  if (!v || typeof v !== "object") return false;
  const s = v as Partial<StoredStill>;
  return (
    typeof s.id === "string" &&
    s.bytes instanceof ArrayBuffer &&
    typeof s.createdAt === "string"
  );
}

async function listStills(): Promise<StoredStill[]> {
  const all = await runTx<unknown[]>("readonly", (store, _abort, set) => {
    const req = store.getAll();
    req.onsuccess = () => set(req.result as unknown[]);
  });
  return (all || []).filter(isStoredStill);
}

/** Put only if there is room: the cap is checked inside the same transaction. */
async function putStillIfRoom(record: StoredStill): Promise<"ok" | "full"> {
  const out = await runTx<"ok" | "full">("readwrite", (store, abortWith, set) => {
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result >= VAULT_MAX) {
        abortWith("full");
        return;
      }
      set("ok");
      store.put(record);
    };
  });
  return out === "full" ? "full" : "ok";
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: unknown; message?: unknown };
  return (
    e.name === "QuotaExceededError" ||
    (typeof e.message === "string" && /quota/i.test(e.message))
  );
}

function newId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/** Compress a still on the client: max 1600px long edge, JPEG 0.85. */
export async function compressStill(source: Blob): Promise<Blob> {
  const img = await loadImageFromBlob(source);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) throw new Error("empty image");
  const scale = Math.min(1, MAX_EDGE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#0c0c0d";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

// ---- external store (useSyncExternalStore) ----

const SERVER_STATE: VaultState = { status: "idle", items: [], error: null };
let state: VaultState = SERVER_STATE;
const listeners = new Set<() => void>();
const urls = new Map<string, string>();
let chain: Promise<void> = Promise.resolve();

function emit(next: VaultState) {
  state = next;
  listeners.forEach((l) => l());
}

function toItems(records: StoredStill[]): VaultItem[] {
  const keep = new Set(records.map((r) => r.id));
  urls.forEach((url, id) => {
    if (!keep.has(id)) {
      URL.revokeObjectURL(url);
      urls.delete(id);
    }
  });
  return records
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r) => {
      let url = urls.get(r.id);
      if (!url) {
        url = URL.createObjectURL(
          new Blob([r.bytes], { type: r.type || "image/jpeg" }),
        );
        urls.set(r.id, url);
      }
      return { id: r.id, url, createdAt: r.createdAt };
    });
}

/** Re-read the Vault from IndexedDB (queued after any in-flight read). */
export function refreshVault(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (state.status === "idle") emit({ ...state, status: "loading" });
  chain = chain.then(() =>
    listStills()
      .then((records) => {
        emit({ status: "ready", items: toItems(records), error: null });
      })
      .catch(() => {
        emit({ status: "error", items: state.items, error: VAULT_LOAD_ERROR });
      }),
  );
  return chain;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (state.status === "idle") void refreshVault();
  return () => {
    listeners.delete(listener);
  };
}

export function useVault(): VaultState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

// ---- actions ----

/** Compress and add a still. Refuses (with a visible message) when full or storage fails. */
export async function addToVault(source: Blob): Promise<VaultResult> {
  if (typeof indexedDB === "undefined") {
    return { ok: false, message: VAULT_UNAVAILABLE_MESSAGE };
  }
  if (state.status === "ready" && state.items.length >= VAULT_MAX) {
    return { ok: false, message: VAULT_FULL_MESSAGE };
  }
  let record: StoredStill;
  try {
    const still = await compressStill(source);
    record = {
      id: newId(),
      type: still.type || "image/jpeg",
      bytes: await still.arrayBuffer(),
      createdAt: new Date().toISOString(),
    };
  } catch {
    return {
      ok: false,
      message: "Could not read that image. Nothing was added.",
    };
  }
  try {
    const put = await putStillIfRoom(record);
    await refreshVault();
    if (put === "full") return { ok: false, message: VAULT_FULL_MESSAGE };
    return { ok: true };
  } catch (err) {
    await refreshVault();
    return {
      ok: false,
      message: isQuotaError(err) ? VAULT_QUOTA_MESSAGE : VAULT_UNAVAILABLE_MESSAGE,
    };
  }
}

/** Save an image data URL (e.g. the Make this edited result) to the Vault. */
export async function addDataUrlToVault(dataUrl: string): Promise<VaultResult> {
  let blob: Blob;
  try {
    blob = await (await fetch(dataUrl)).blob();
  } catch {
    return { ok: false, message: "Could not read that image. Nothing was added." };
  }
  return addToVault(blob);
}

export async function getVaultBlob(id: string): Promise<Blob | null> {
  try {
    const value = await runTx<unknown>("readonly", (store, _abort, set) => {
      const req = store.get(id);
      req.onsuccess = () => set(req.result ?? null);
    });
    if (!isStoredStill(value)) return null;
    return new Blob([value.bytes], { type: value.type || "image/jpeg" });
  } catch {
    return null;
  }
}

export async function removeFromVault(id: string): Promise<VaultResult> {
  try {
    await runTx<true>("readwrite", (store, _abort, set) => {
      set(true);
      store.delete(id);
    });
    await refreshVault();
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Could not remove that still on this device. Try again.",
    };
  }
}
