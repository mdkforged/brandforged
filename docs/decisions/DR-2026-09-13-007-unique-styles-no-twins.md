# DR-2026-09-13-007 — Unique styles (no exact twins)

**Status:** Locked  
**Date:** 2026-09-13

## Decision

Brand Forged never repeats the same style package exactly twice across distinct people/brands.

- If we style someone (or help them style), their look must not be an exact twin of another person’s.
- **Exception:** people at the **same company** who are responsible for grabbing newly created campaigns may share identical campaign kits on purpose.

## Why

Identity is the product. Copy-paste looks make brands feel generic and break trust. Uniqueness is a hard rule, not a preference.

## How (v1 seam)

1. Build a **style fingerprint** from locked answers + look (content style, reference photo hashes, social template set, energy/palette choices, type cues).
2. Store fingerprint scoped by person/brand workspace.
3. On lock/save: if an exact fingerprint already exists for a **different** person/brand → refuse or auto-vary (never silent twin).
4. Same-company campaign mode: allow shared fingerprints when membership proves same company + campaign-kit role.

## Out of scope for this DR

Full Identity Engine UI and cross-workspace fingerprint index (comes next). This DR locks the product law.