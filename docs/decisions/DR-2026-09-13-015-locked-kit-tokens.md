# DR-2026-09-13-015 - Locked kit tokens from Brand Input

**Status:** Accepted  
**Date:** 2026-09-13

## Decision

The Identity Engine produces a **constrained locked kit** (`LockedBrandKit`) derived
**only** from the Brand Input Set via closed mapping tables. No freeform LLM replies.
No off-wall answers. Tokens are deterministic and self-supporting (no drift).

## Rules

1. **Source of truth:** Brand Input Set only (brand name, industry, audience, mood
   words, logo style, optional color preference). The five Brand Input questions
   do not change.
2. **Color:** `colorPreference` maps to a closed Energy Strike family
   (warm → ember-red / solar-gold; cool → sapphire-blue / lumina-purple;
   neutral → ion-silver; bold → forge-green; empty → forge-green platform default).
   Hex values come from `@/lib/brand/energy-strike` plus a closed companion table
   for secondary / accent / neutral / background / text.
3. **Mood words:** split and normalize; map known words to allowlisted `moodTags`
   and `voiceTone` tags (3–5). Unknown words are dropped or nearest-matched via
   simple `includes` — never invent open prose.
4. **Typography:** pick a font pairing from a closed allowlist (display + body).
5. **Logo:** `logoDirection` = `input.logoStyle`.
6. **Labels:** human-readable review strings (plain UI language; no forge metaphor
   names in user-facing labels). Internal Energy Strike ids may still use platform ids.
7. **Persistence:** full kit including `tokens` is stored on the identity session
   in localStorage. Downstream readers expose `primaryHex` / `brandName` for
   subtle `--energy` theming on This is You and posts chips.

## API

- `generateLockedKit(input: BrandInputSet): LockedBrandKit`
- `draftKitFromInput` remains as a compatibility alias calling `generateLockedKit`
- `source: "identity-engine-v1"`, `lockedAt` ISO timestamp

## Status

Accepted - 2026-09-13.
