# DR-2026-09-13-014 - Onboarding loading UX + firstMake routing

**Status:** Accepted  
**Date:** 2026-09-13

## Decision

1. **Engine Run (Screen 7)** is a generation/loading moment. Primary copy:
   "Building your custom brand workspace..." Keep brand name + draft kit preview.
   Continue still advances until real generation lands.

2. **firstMake** is Layer 2 post-kit routing (after Brand Kit), not Brand Input.
   Canon Brand Input five stay: Brand Name, Industry/Niche, Audience, Mood Words,
   Logo Style (+ optional Color). Do not replace any of those with stage or
   first-deliverable questions.

## Detail

- Persist `firstMake: 'logo' | 'identity_guide' | 'social' | 'website'` on the
  identity session / localStorage payload with the rest of the kit.
- UI: require a pick on `brand_vault` before save. Labels: Logo / Brand Identity
  Guide / Social Media Assets / Website Design. Default via You pick for me = social.
- Route on submit: `social` -> `/you/posts`; `logo` | `identity_guide` | `website` -> `/you`.
- Personalized `/you` (Screen 8) greets with brand name and a shortcut CTA for
  their `firstMake`.

## Status

Accepted - 2026-09-13.
