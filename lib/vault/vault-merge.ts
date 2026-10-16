/**
 * Pure merge plan for the account-synced Vault (no imports, so node --test
 * can load it). Rules: never drop a device still that was not synced, dedupe
 * by content hash, account holds at most `max`, extras stay on the device.
 */

export type LocalStillRef = {
  id: string;
  hash?: string;
  createdAt: string;
  /** Account that owns the synced copy; unset = never synced. */
  ownerId?: string;
  remoteId?: string;
};

export type RemoteStillRef = {
  id: string;
  content_hash: string;
  path: string;
  created_at?: string;
};

export type VaultMergePlan = {
  /** Local copies of this account's stills that were deleted on another device. */
  drop: string[];
  /** Local stills that match an account still: remember the link. */
  link: { localId: string; remote: RemoteStillRef }[];
  /** Local stills to upload (newest first) while the account has room. */
  upload: string[];
  /** Local stills past the account cap: kept on this device only. */
  keepLocal: string[];
  /** Account stills this device does not have yet. */
  pull: RemoteStillRef[];
};

export function planVaultMerge(
  locals: readonly LocalStillRef[],
  remote: readonly RemoteStillRef[],
  userId: string,
  max: number,
): VaultMergePlan {
  const remoteIds = new Set(remote.map((r) => r.id));
  const remoteByHash = new Map(remote.map((r) => [r.content_hash, r]));

  const drop: string[] = [];
  const kept: LocalStillRef[] = [];
  for (const l of locals) {
    const deletedElsewhere =
      l.ownerId === userId &&
      Boolean(l.remoteId) &&
      !remoteIds.has(l.remoteId as string) &&
      !(l.hash && remoteByHash.has(l.hash));
    if (deletedElsewhere) drop.push(l.id);
    else kept.push(l);
  }

  // Stills from another account on this device are never merged in.
  const mine = kept
    .filter((l) => Boolean(l.hash) && (!l.ownerId || l.ownerId === userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const link: VaultMergePlan["link"] = [];
  const upload: string[] = [];
  const keepLocal: string[] = [];
  const planned = new Set<string>();
  let count = remote.length;
  for (const l of mine) {
    const hash = l.hash as string;
    const match = remoteByHash.get(hash);
    if (match) {
      if (l.remoteId !== match.id || l.ownerId !== userId) {
        link.push({ localId: l.id, remote: match });
      }
      continue;
    }
    if (planned.has(hash)) continue; // duplicate copy on this device
    planned.add(hash);
    if (count < max) {
      upload.push(l.id);
      count += 1;
    } else {
      keepLocal.push(l.id);
    }
  }

  const localHashes = new Set(mine.map((l) => l.hash as string));
  const pull = remote.filter((r) => !localHashes.has(r.content_hash));
  return { drop, link, upload, keepLocal, pull };
}
