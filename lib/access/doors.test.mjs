import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  doorAccessForUser,
  hasWorldAccess,
  isFounderEmail,
} from "./doors.ts";

describe("founder emails open Your World", () => {
  const founders = [
    "mdkforged@gmail.com",
    "mdktetheredntruth@gmail.com",
    "tetheredntruth@gmail.com",
  ];

  for (const email of founders) {
    it(`treats ${email} as a founder`, () => {
      assert.equal(isFounderEmail(email), true);
      assert.equal(isFounderEmail(email.toUpperCase()), true);
      assert.equal(doorAccessForUser(email, "you"), "both");
      assert.equal(hasWorldAccess(doorAccessForUser(email, "you")), true);
    });
  }

  it("does not grant founder access to other emails", () => {
    assert.equal(isFounderEmail("someone@example.com"), false);
    assert.equal(isFounderEmail(null), false);
    assert.equal(doorAccessForUser("someone@example.com", "you"), "you");
    assert.equal(hasWorldAccess(doorAccessForUser("someone@example.com", "you")), false);
  });

  it("keeps stored both access for non-founders", () => {
    assert.equal(doorAccessForUser("someone@example.com", "both"), "both");
  });
});
