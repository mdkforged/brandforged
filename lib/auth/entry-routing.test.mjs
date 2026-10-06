import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  destinationAfterSignIn,
  isPublicPath,
  isStartPath,
  loginPathFor,
  safeNextPath,
} from "./entry-routing.ts";
import { IDLE_TIMEOUT_MS, isIdleExpired } from "./idle.ts";

describe("entry routing (guests)", () => {
  it("only login, auth callbacks, api and static files are public", () => {
    for (const p of ["/login", "/auth/callback", "/api/health", "/brand/logo-forge-green.webp", "/icon.png"]) {
      assert.equal(isPublicPath(p), true, p);
    }
    for (const p of ["/", "/start", "/you", "/you/notes", "/world", "/app"]) {
      assert.equal(isPublicPath(p), false, p);
    }
  });
  it("root and /start send guests to plain /login", () => {
    assert.equal(loginPathFor("/"), "/login");
    assert.equal(loginPathFor("/start", "?edit=1"), "/login");
    assert.equal(isStartPath("/start"), true);
    assert.equal(isStartPath("/starting"), false);
  });
  it("deep links are kept as next", () => {
    assert.equal(loginPathFor("/you/notes"), "/login?next=%2Fyou%2Fnotes");
    assert.equal(loginPathFor("/you", "?x=1"), "/login?next=%2Fyou%3Fx%3D1");
  });
});

describe("after sign-in", () => {
  it("no kit goes to setup", () => {
    assert.equal(destinationAfterSignIn({ hasKit: false, next: "/you" }), "/start");
  });
  it("a kit never lands on setup", () => {
    assert.equal(destinationAfterSignIn({ hasKit: true, next: "/start" }), "/");
    assert.equal(destinationAfterSignIn({ hasKit: true, next: "/" }), "/");
    assert.equal(destinationAfterSignIn({ hasKit: true, next: "/you/notes" }), "/you/notes");
    assert.equal(destinationAfterSignIn({ hasKit: true, next: "/start?edit=1" }), "/start?edit=1");
  });
  it("unknown kit (profile check failed) goes home, not setup", () => {
    assert.equal(destinationAfterSignIn({ hasKit: null, next: null }), "/");
  });
  it("next is same-site only", () => {
    assert.equal(safeNextPath("//evil.example"), "/");
    assert.equal(safeNextPath("https://evil.example"), "/");
    assert.equal(safeNextPath("/login?next=/"), "/");
    assert.equal(safeNextPath("/you"), "/you");
  });
});

describe("idle timeout", () => {
  const t0 = 1_800_000_000_000;
  it("is 30 minutes", () => {
    assert.equal(IDLE_TIMEOUT_MS, 30 * 60 * 1000);
  });
  it("expires only after the timeout since the newer of activity / sign-in", () => {
    assert.equal(isIdleExpired({ lastActivity: t0, signedInAt: 0, now: t0 + IDLE_TIMEOUT_MS - 1 }), false);
    assert.equal(isIdleExpired({ lastActivity: t0, signedInAt: 0, now: t0 + IDLE_TIMEOUT_MS }), true);
    // A fresh sign-in beats a stale activity stamp from an older session.
    assert.equal(isIdleExpired({ lastActivity: t0 - 10 * IDLE_TIMEOUT_MS, signedInAt: t0, now: t0 + 1000 }), false);
    assert.equal(isIdleExpired({ lastActivity: 0, signedInAt: 0, now: t0 }), false);
  });
});
