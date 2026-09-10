import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertSameWorkspace,
  canAccessWorkspace,
} from "./workspace-policy.ts";

describe("workspace isolation", () => {
  const userId = "user-1";
  const workspaceA = "workspace-a";
  const workspaceB = "workspace-b";

  const memberships = [
    { workspaceId: workspaceA, userId, role: "owner" },
  ];

  it("allows access to the workspace the user belongs to", () => {
    assert.equal(
      canAccessWorkspace(memberships, userId, workspaceA),
      true,
    );
  });

  it("denies access to a different workspace even for an owner of another", () => {
    assert.equal(
      canAccessWorkspace(memberships, userId, workspaceB),
      false,
    );
  });

  it("denies access when the user has no memberships", () => {
    assert.equal(canAccessWorkspace([], userId, workspaceA), false);
  });

  it("denies access for a different user id on the same workspace", () => {
    assert.equal(
      canAccessWorkspace(memberships, "user-2", workspaceA),
      false,
    );
  });

  it("assertSameWorkspace throws across workspace boundaries", () => {
    assert.throws(
      () => assertSameWorkspace(workspaceA, workspaceB),
      /Workspace isolation violation/,
    );
  });

  it("assertSameWorkspace allows matching identifiers", () => {
    assert.doesNotThrow(() => assertSameWorkspace(workspaceA, workspaceA));
  });
});
