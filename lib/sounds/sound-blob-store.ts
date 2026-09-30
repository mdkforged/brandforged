/**
 * IndexedDB store for uploaded song bytes.
 * localStorage (~5MB for the whole site, shared with photos and the kit)
 * cannot hold a 25MB song as a base64 data URL, so the audio bytes live
 * here and bf-sound-library-v1 keeps only the metadata.
 */
const DB_NAME = "bf-sound-blobs";
const DB_VERSION = 1;
const STORE = "blobs";

type StoredSoundBytes = { type: string; bytes: ArrayBuffer };

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
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    req.onblocked = () => reject(new Error("IndexedDB blocked"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | null,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    let result: T | undefined;
    let tx: IDBTransaction;
    try {
      tx = db.transaction(STORE, mode);
    } catch (err) {
      db.close();
      reject(err);
      return;
    }
    const req = fn(tx.objectStore(STORE));
    if (req) {
      req.onsuccess = () => {
        result = req.result as T;
      };
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
      reject(tx.error || new Error("IndexedDB aborted"));
    };
  });
}

/** Save the song bytes under the library sound id. Rejects on quota / no IDB. */
export async function putSoundBlob(id: string, blob: Blob): Promise<void> {
  const value: StoredSoundBytes = {
    type: blob.type || "audio/mpeg",
    bytes: await blob.arrayBuffer(),
  };
  await withStore("readwrite", (store) => store.put(value, id));
}

export async function getSoundBlob(id: string): Promise<Blob | null> {
  const value = await withStore<unknown>("readonly", (store) => store.get(id));
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<StoredSoundBytes>;
  if (!(v.bytes instanceof ArrayBuffer)) return null;
  return new Blob([v.bytes], { type: v.type || "audio/mpeg" });
}

export async function deleteSoundBlob(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}
