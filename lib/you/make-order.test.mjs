import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImageEditPrompt,
  classifyBrief,
  extractOrderTitle,
  parseImageOrder,
} from "./make-order.ts";

const TT_PALETTE = [
  { name: "Dark Luxury", hex: "#111010" },
  { name: "Obsidian Black", hex: "#0c0c0d" },
  { name: "Silver-Grey", hex: "#8a8179" },
  { name: "Platinum Ash Blonde", hex: "#c4b5a4" },
  { name: "Antique Gold", hex: "#ad885d" },
  { name: "Sapphire Blue-Green", hex: "#3d7f78" },
];

const STRICT_GOLD =
  "Make into album art titled Moment To Rise in gold font in the middle, no other adjustments";
const NO_GOLD = "Make into album art titled Moment To Rise at the top";

describe("strict gold title order", () => {
  it("is a visual order", () => {
    assert.equal(classifyBrief(STRICT_GOLD), "visual");
  });

  it("parses title, gold, center, strict, no brand text", () => {
    const o = parseImageOrder(STRICT_GOLD);
    assert.equal(o.title, "Moment To Rise");
    assert.equal(o.gold, true);
    assert.equal(o.placement.center, true);
    assert.equal(o.strict, true);
    assert.equal(o.wantsBrandText, false);
  });

  it("builds a text-only, pixel-faithful prompt", () => {
    const p = buildImageEditPrompt({
      order: STRICT_GOLD,
      brandName: "Tethered & Truth by MDK",
      palette: TT_PALETTE,
    });
    assert.match(p, /"Moment To Rise"/);
    assert.match(p, /gold font \(Antique Gold #ad885d\)/);
    assert.match(p, /centered in the middle of the image/);
    assert.match(p, /pixel-faithful/);
    assert.match(p, /eye color/);
    assert.match(p, /white lilies/);
    assert.match(p, /Do not add an artist name, artist lockup, brand name/);
    // No palette locking, no reframing, no brand text in strict mode.
    assert.doesNotMatch(p, /use only this palette/i);
    assert.doesNotMatch(p, /#0c0c0d|#111010|#3d7f78/);
    assert.doesNotMatch(p, /1:1/);
    assert.doesNotMatch(p, /tethered|mdk/i);
  });
});

describe("title order without gold", () => {
  it("does not ask for gold type", () => {
    assert.equal(classifyBrief(NO_GOLD), "visual");
    const o = parseImageOrder(NO_GOLD);
    assert.equal(o.title, "Moment To Rise");
    assert.equal(o.gold, false);
    assert.equal(o.strict, false);
    assert.equal(o.placement.top, true);
    const p = buildImageEditPrompt({ order: NO_GOLD, palette: TT_PALETTE });
    assert.doesNotMatch(p, /gold font/i);
    assert.match(p, /at the top of the image/);
    assert.match(p, /The palette does not set the text color/);
  });
});

describe("brand text only when asked", () => {
  it("allows credit when the brief asks for it", () => {
    const o = parseImageOrder("Make into album art titled Moment To Rise with By MDK at the bottom");
    assert.equal(o.title, "Moment To Rise");
    assert.equal(o.wantsBrandText, true);
  });
});

describe("other visual triggers", () => {
  for (const brief of [
    "Make into album art - title: Moment To Rise",
    "Change the quote in the box to \"Hold on\" and change the background",
    "Put the title Moment To Rise on it",
    "turn this into a poster for the show",
    "Album art - Moment To Rise",
    "Moment To Rise in gold font",
    "Put Moment To Rise in the middle",
    "Add the title, no other changes",
  ]) {
    it(`visual: ${brief}`, () => {
      assert.equal(classifyBrief(brief), "visual");
    });
  }
  it("reads titles", () => {
    assert.equal(extractOrderTitle("Make into album art - title: Moment To Rise"), "Moment To Rise");
    assert.equal(extractOrderTitle("Put the title Moment To Rise on it"), "Moment To Rise");
  });
});

describe("caption-only briefs stay caption-only", () => {
  for (const brief of [
    "New single out Friday, so grateful",
    "Write a caption about the title track",
    "add my name to the caption",
    "caption for this photo",
    "Make a post about my new cover of Hallelujah",
    "Thank you for 1k",
  ]) {
    it(`caption: ${brief}`, () => {
      assert.equal(classifyBrief(brief), "caption");
    });
  }
});

describe("applied brand master (Brand 2)", () => {
  const NOVA = [
    { name: "Background", hex: "#101820" },
    { name: "Primary / gold", hex: "#f2aa4c" },
    { name: "Accent", hex: "#2e86ab" },
    { name: "Text", hex: "#fafafa" },
  ];

  it("strict: rule guides the title only; no palette, no brand text", () => {
    const p = buildImageEditPrompt({
      order: STRICT_GOLD,
      brandName: "Nova Lights",
      palette: NOVA,
      brandRule: "gold type only, no neon, no extra logo.",
    });
    assert.match(p, /for the title styling only/);
    assert.match(p, /gold type only, no neon, no extra logo\./);
    assert.match(p, /gold font \(Primary \/ gold #f2aa4c\)/);
    assert.match(p, /pixel-faithful/);
    assert.doesNotMatch(p, /#101820|#2e86ab/);
    assert.doesNotMatch(p, /Nova/);
    assert.doesNotMatch(p, /tethered|mdk|#ad885d|#0c0c0d/i);
  });

  it("non-strict: only that brand's palette, never T&T", () => {
    const p = buildImageEditPrompt({
      order: NO_GOLD,
      brandName: "Nova Lights",
      palette: NOVA,
      brandRule: "no neon",
    });
    assert.match(p, /#101820/);
    assert.match(p, /Brand rule: no neon\./);
    assert.doesNotMatch(p, /#ad885d|#0c0c0d|#3d7f78/);
    assert.doesNotMatch(p, /Nova/);
  });
});
