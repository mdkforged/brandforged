# DR-2026-09-13-011 — Canon Brand Input Set

## Decision

Adopt Master Brand System v1.0 §2.3 Input Set + Workflow 4.2 for `/start` onboarding.

## Detail

- Replace legacy identity Q&A with the 5-question Brand Input Set (+ optional color).
- Persist `IdentitySession` (`input`, `kit`, stage flags) under `bf-identity-v1`.
- Keep bridge fields `aboutYou` / `contentStyle` for existing `/you` readers.
- Compatibility shims in `lib/onboarding/*` read the new shape.

## Status

Accepted — 2026-09-13.
