# DR-2026-09-13-016 - Get started gate and logo uploads

**Status:** Accepted  
**Date:** 2026-09-13

## Decision

1. **Get started gate on This is You.** Until onboarding is finished, the Quick
   social posts slot shows only a **Get started** box (`Link` → `/start`). After
   finish, it shows **Quick social posts** → `/you/posts`. No JS-only navigation.

2. **Finished = `hasFinishedStart`.** `vaultSaved` / `activated` true, **or**
   brandName + `socialSites.length > 0` + kit present. Exported from
   `lib/onboarding/use-onboarding-answers.ts`.

3. **Logo already-have + uploads on `/start` brief.** Checkbox
   `hasExistingLogo`; up to 3 reference photo uploads (`fileToReferenceDataUrl`);
   optional `logoUpload` data URL. You pick for me fills Brand Forged marks.
   Persist real uploads; fall back to BF marks when empty. `logoStyle` stays
   required. Snapchat added to the social checklist (not auto-defaulted).

## Status

Shipped with founder UX fix commit.
