# DR-2026-09-13-010 - Identity Engine /start scaffold (Playbook)

**Status:** Scaffold locked  
**Source:** Master Playbook Identity Engine 2.8 + HARD_RULES first-session promise

## Decision

`/start` follows Playbook Identity lifecycle:

Discovery → Generation → Review → Approval → Activation

Not Continuous Learning yet (post-activation).

## What this is / is not

- **Is:** Scaffold from Playbook stages + existing collectable fields (name, audience, industry, style, photos, socials).
- **Is not:** Full Brand Onboarding shelf question bank (those folders are still empty on disk).
- When OneDrive Brand Onboarding / Identity Engine Architecture files hydrate, replace Discovery/Generation prompts with Canon questions - do not invent them.

## Rules carried forward

- You pick for me on every ask (DR-004)
- Door order is ours; Door A first access (DR-008)
- Signup packaging stays on Create account
- Plain language UI only