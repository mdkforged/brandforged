# DR-2026-09-13-017 - Sound library attestation

**Status:** Accepted  
**Date:** 2026-09-13

## Decision

1. **Free sounds only.** Brand Forged does **not** scrape YouTube streams or
   ship pirate downloaders. Free sound means:
   - User uploads they attest they own or have legal permission to use in
     Brand Forged.
   - Outbound links to free licensed catalogs: YouTube Audio Library, Free
     Music Archive, and ccMixter.

2. **Attestation gate.** Before an upload is accepted, the user must check:
   "I own this music, or I have legal permission to use it in Brand Forged."
   The upload control stays disabled until the checkbox is checked **and** a
   file is chosen.

3. **Size cap.** Reject audio uploads over ~6MB (`MAX_SOUND_BYTES`) with a
   clear client message. Keeps localStorage payloads workable.

4. **Storage.** `localStorage` key `bf-sound-library-v1` via
   `lib/sounds/sound-library.ts` (load / save / add / remove / select).

5. **UI.** `components/you/sound-drawer.tsx` sections: Selected, Your songs,
   Free catalogs, Upload. Wired on Quick social posts; selected title shows on
   the phone preview.

## Status

Shipped with Sound drawer commit.
