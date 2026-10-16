/**
 * Vault: a small shelf of saved stills (max 12).
 * Image bytes live in IndexedDB (own db, mirroring the song blob store) and
 * never in kit localStorage. When signed in, the Vault follows the account:
 * a private Supabase Storage bucket ("vault", {user_id}/...) plus the
 * vault_items table. On sign-in device stills merge into the account
 * (deduped by content hash, never wiped) and account stills are pulled down.
 * Signed out, it works local-only. React reads it via useSyncExternalStore,
 * so loading never sets state inside an effect.
 */
import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";
import { planVaultMerge, type RemoteStillRef } from "@/lib/vault/vault-merge";

export const VAULT_MAX = 12;
export const VAULT_FULL_MESSAGE =
  "Vault is full (12). Remove one to add another.";
export const VAULT_UNAVAILABLE_MESSAGE =
  "The Vault can't save on this device (on-device storage isn't available here). Nothing was added.";
export const VAULT_QUOTA_MESSAGE =
  "This device is out of room for the Vault. Nothing was added \u2014 remove a still or free up space, then try again.";
const VAULT_LOAD_ERROR =
  "The Vault can't open on this device (on-device storage isn't available here).";
const SYNC_FAILED_NOTE =
  "Couldn't reach your account Vault right now. Your stills are safe on this device and will sync next time.";

const DB_NAME = "bf-vault";
const DB_VERSION = 1;
const STORE = "stills";
/** Client-side compression for stills: long edge and JPEG quality. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

const BUCKET = "vault";
const TABLE = "vault_items";

type StoredStill = {
  id: string;
  type: string;
  bytes: ArrayBuffer;
  createdAt: string;
  /** SHA-256 of the stored bytes (dedupe across devices). */
  hash?: string;
  width?: number;
  height?: number;
  /** Supabase user id that owns the synced copy; unset = never synced. */
  ownerId?: string;
  remoteId?: string;
  remotePath?: string;
};

export type VaultItem = { id: string; url: string; createdAt: string };
export type VaultState = {
  status: "idle" | "loading" | "ready" | "error";
  items: VaultItem[];
  error: string | null;
  /** True when the Vault is following a signed-in account. */
  signedIn: boolean;
  syncing: boolean;
  /** Small note after a sync (extras kept on this device, offline, ...). */
  note: string | null;
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

async function getStill(id: string): Promise<StoredStill | null> {
  const value = await runTx<unknown>("readonly", (store, _abort, set) => {
    const req = store.get(id);
    req.onsuccess = () => set(req.result ?? null);
  });
  return isStoredStill(value) ? value : null;
}

/** Plain put (sync bookkeeping and pulled stills; no cap). */
async function putStill(record: StoredStill): Promise<void> {
  await runTx<true>("readwrite", (store, _abort, set) => {
    set(true);
    store.put(record);
  });
}

async function deleteStill(id: string): Promise<void> {
  await runTx<true>("readwrite", (store, _abort, set) => {
    set(true);
    store.delete(id);
  });
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

async function sha256Hex(bytes: ArrayBuffer): Promise<string | undefined> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
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

async function compressStillSized(
  source: Blob,
): Promise<{ blob: Blob; width: number; height: number }> {
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
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
  return { blob, width: w, height: h };
}

/** Compress a still on the client: max 1600px long edge, JPEG 0.85. */
export async function compressStill(source: Blob): Promise<Blob> {
  return (await compressStillSized(source)).blob;
}

// ---- account (Supabase) ----

type SupabaseBrowser = ReturnType<typeof createClient>;
let client: SupabaseBrowser | null = null;

function getClient(): SupabaseBrowser | null {
  if (typeof window === "undefined" || !isAuthConfigured()) return null;
  if (client) return client;
  try {
    client = createClient();
  } catch {
    client = null;
  }
  return client;
}

async function currentUserId(c: SupabaseBrowser): Promise<string | null> {
  try {
    const { data } = await c.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

type RemoteRow = RemoteStillRef & {
  created_at: string;
  width: number | null;
  height: number | null;
};

type UploadOutcome =
  | { status: "ok"; row: { id: string; path: string } }
  | { status: "full" }
  | { status: "error" };

async function uploadStill(
  c: SupabaseBrowser,
  userId: string,
  rec: StoredStill,
): Promise<UploadOutcome> {
  if (!rec.hash) return { status: "error" };
  const path = `${userId}/${rec.hash}.jpg`;
  const blob = new Blob([rec.bytes], { type: rec.type || "image/jpeg" });
  const up = await c.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (up.error && !/exist|duplicate/i.test(up.error.message || "")) {
    return { status: "error" };
  }
  const ins = await c
    .from(TABLE)
    .insert({
      user_id: userId,
      path,
      content_hash: rec.hash,
      width: rec.width ?? null,
      height: rec.height ?? null,
      created_at: rec.createdAt,
    })
    .select("id, path")
    .single();
  if (!ins.error && ins.data) {
    return { status: "ok", row: ins.data as { id: string; path: string } };
  }
  if (ins.error?.code === "23505") {
    const existing = await c
      .from(TABLE)
      .select("id, path")
      .eq("content_hash", rec.hash)
      .maybeSingle();
    if (existing.data) {
      return { status: "ok", row: existing.data as { id: string; path: string } };
    }
  }
  if (/vault_full/i.test(ins.error?.message || "")) {
    // We uploaded the object for nothing: remove it so the bucket stays tidy.
    if (!up.error) await c.storage.from(BUCKET).remove([path]);
    return { status: "full" };
  }
  return { status: "error" };
}

// ---- external store (useSyncExternalStore) ----

const SERVER_STATE: VaultState = {
  status: "idle",
  items: [],
  error: null,
  signedIn: false,
  syncing: false,
  note: null,
};
let state: VaultState = SERVER_STATE;
const listeners = new Set<() => void>();
const urls = new Map<string, string>();
let chain: Promise<void> = Promise.resolve();
let syncing: Promise<void> | null = null;
let authWatching = false;

function emit(patch: Partial<VaultState>) {
  state = { ...state, ...patch };
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
  if (state.status === "idle") emit({ status: "loading" });
  chain = chain.then(() =>
    listStills()
      .then((records) => {
        emit({ status: "ready", items: toItems(records), error: null });
      })
      .catch(() => {
        emit({ status: "error", error: VAULT_LOAD_ERROR });
      }),
  );
  return chain;
}

async function runSync(): Promise<void> {
  const c = getClient();
  if (!c || typeof indexedDB === "undefined") return;
  const userId = await currentUserId(c);
  if (!userId) {
    emit({ signedIn: false, syncing: false });
    return;
  }
  emit({ signedIn: true, syncing: true });
  let note: string | null = null;
  try {
    // Hash anything saved before sync existed (kept, never replaced).
    const before = await listStills();
    for (const rec of before) {
      if (rec.hash) continue;
      const hash = await sha256Hex(rec.bytes);
      if (hash) await putStill({ ...rec, hash });
    }
    const locals = await listStills();

    const { data, error } = await c
      .from(TABLE)
      .select("id, path, content_hash, created_at, width, height")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const remote = (data ?? []) as RemoteRow[];

    const plan = planVaultMerge(locals, remote, userId, VAULT_MAX);
    const byId = new Map(locals.map((r) => [r.id, r]));
    let failed = false;
    let extra = plan.keepLocal.length;

    // Deleted from the account on another device.
    for (const id of plan.drop) await deleteStill(id);

    for (const { localId, remote: row } of plan.link) {
      const rec = byId.get(localId);
      if (rec) {
        await putStill({
          ...rec,
          ownerId: userId,
          remoteId: row.id,
          remotePath: row.path,
        });
      }
    }

    // Merge device stills into the account (newest first, up to the cap).
    for (const id of plan.upload) {
      const rec = byId.get(id);
      if (!rec) continue;
      const res = await uploadStill(c, userId, rec);
      if (res.status === "ok") {
        await putStill({
          ...rec,
          ownerId: userId,
          remoteId: res.row.id,
          remotePath: res.row.path,
        });
      } else if (res.status === "full") {
        extra += 1;
      } else {
        failed = true;
      }
    }

    // Pull account stills this device doesn't have yet.
    for (const ref of plan.pull) {
      const row = ref as RemoteRow;
      const dl = await c.storage.from(BUCKET).download(row.path);
      if (dl.error || !dl.data) {
        failed = true;
        continue;
      }
      await putStill({
        id: row.id,
        type: dl.data.type || "image/jpeg",
        bytes: await dl.data.arrayBuffer(),
        createdAt: row.created_at,
        hash: row.content_hash,
        width: row.width ?? undefined,
        height: row.height ?? undefined,
        ownerId: userId,
        remoteId: row.id,
        remotePath: row.path,
      });
    }

    if (extra > 0) {
      note = `${extra} ${extra === 1 ? "still stays" : "stills stay"} on this device only \u2014 your account Vault holds ${VAULT_MAX}.`;
    } else if (failed) {
      note = SYNC_FAILED_NOTE;
    }
  } catch {
    note = SYNC_FAILED_NOTE;
  }
  emit({ syncing: false, note });
  await refreshVault();
}

/** Merge this device with the signed-in account's Vault (one run at a time). */
export function syncVault(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (syncing) return syncing;
  syncing = runSync()
    .catch(() => {
      emit({ syncing: false, note: SYNC_FAILED_NOTE });
    })
    .finally(() => {
      syncing = null;
    });
  return syncing;
}

function watchAuth() {
  if (authWatching) return;
  const c = getClient();
  if (!c) return;
  authWatching = true;
  c.auth.onAuthStateChange((event, session) => {
    if (!session) {
      // Signed out: keep every still on this device; just stop syncing.
      emit({ signedIn: false, syncing: false, note: null });
      return;
    }
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
      // Outside the auth callback (Supabase recommends no awaits inside it).
      window.setTimeout(() => {
        void syncVault();
      }, 0);
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (state.status === "idle") void refreshVault();
  watchAuth();
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
    const still = await compressStillSized(source);
    const bytes = await still.blob.arrayBuffer();
    record = {
      id: newId(),
      type: still.blob.type || "image/jpeg",
      bytes,
      createdAt: new Date().toISOString(),
      hash: await sha256Hex(bytes),
      width: still.width,
      height: still.height,
    };
  } catch {
    return {
      ok: false,
      message: "Could not read that image. Nothing was added.",
    };
  }
  try {
    if (record.hash) {
      const existing = await listStills();
      if (existing.some((r) => r.hash === record.hash)) {
        return { ok: false, message: "That still is already in the Vault." };
      }
    }
    const put = await putStillIfRoom(record);
    await refreshVault();
    if (put === "full") return { ok: false, message: VAULT_FULL_MESSAGE };
    // Signed in: send it to the account too (no-op when signed out).
    void syncVault();
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
    const value = await getStill(id);
    if (!value) return null;
    return new Blob([value.bytes], { type: value.type || "image/jpeg" });
  } catch {
    return null;
  }
}

/** Delete a still. Signed in, a synced still is removed from the account too. */
export async function removeFromVault(id: string): Promise<VaultResult> {
  try {
    const rec = await getStill(id);
    const c = getClient();
    if (rec?.remoteId && c) {
      const userId = await currentUserId(c);
      if (userId && rec.ownerId === userId) {
        const del = await c.from(TABLE).delete().eq("id", rec.remoteId);
        if (del.error) {
          return {
            ok: false,
            message:
              "Could not remove that still from your account right now. Nothing was deleted \u2014 try again.",
          };
        }
        if (rec.remotePath) {
          await c.storage.from(BUCKET).remove([rec.remotePath]);
        }
      }
    }
    await deleteStill(id);
    await refreshVault();
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Could not remove that still on this device. Try again.",
    };
  }
}
