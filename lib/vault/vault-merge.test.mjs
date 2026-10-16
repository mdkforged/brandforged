import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planVaultMerge } from "./vault-merge.ts";

const U = "user-a";
const at = (n) => new Date(Date.UTC(2026, 9, 1, 0, n)).toISOString();
const local = (id, hash, n, extra = {}) => ({ id, hash, createdAt: at(n), ...extra });
const remote = (id, hash) => ({ id, content_hash: hash, path: `${U}/${hash}.jpg` });

describe("vault merge on sign-in", () => {
  it("uploads device stills and pulls account stills; never drops unsynced ones", () => {
    const p = planVaultMerge(
      [local("l1", "h1", 1), local("l2", "h2", 2)],
      [remote("r3", "h3")],
      U,
      12,
    );
    assert.deepEqual(p.drop, []);
    assert.deepEqual(p.upload, ["l2", "l1"]);
    assert.deepEqual(p.pull.map((r) => r.id), ["r3"]);
    assert.deepEqual(p.keepLocal, []);
  });

  it("dedupes by content hash (links, no re-upload, no re-download)", () => {
    const p = planVaultMerge([local("l1", "h1", 1)], [remote("r1", "h1")], U, 12);
    assert.deepEqual(p.upload, []);
    assert.deepEqual(p.pull, []);
    assert.equal(p.link[0].localId, "l1");
    assert.equal(p.link[0].remote.id, "r1");
  });

  it("caps the account at 12 and keeps extras on the device", () => {
    const rem = Array.from({ length: 10 }, (_, i) => remote(`r${i}`, `rh${i}`));
    const loc = [1, 2, 3, 4].map((n) => local(`l${n}`, `lh${n}`, n));
    const p = planVaultMerge(loc, rem, U, 12);
    assert.deepEqual(p.upload, ["l4", "l3"]);
    assert.deepEqual(p.keepLocal, ["l2", "l1"]);
    assert.deepEqual(p.drop, []);
  });

  it("drops a synced copy only when this account deleted it elsewhere", () => {
    const p = planVaultMerge(
      [
        local("gone", "hg", 1, { ownerId: U, remoteId: "rg" }),
        local("unsynced", "hu", 2),
      ],
      [],
      U,
      12,
    );
    assert.deepEqual(p.drop, ["gone"]);
    assert.deepEqual(p.upload, ["unsynced"]);
  });

  it("never merges another account's stills into this account", () => {
    const p = planVaultMerge(
      [local("b1", "hb", 1, { ownerId: "user-b", remoteId: "rb" })],
      [],
      U,
      12,
    );
    assert.deepEqual(p.upload, []);
    assert.deepEqual(p.drop, []);
  });
});
