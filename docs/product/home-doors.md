# Home doors

Brand Forged home is **one screen, two buttons**. After the person has a workspace, they choose a door. That is the product front. Everything else is behind one of those doors.

This page is the short Build Lab brief. The decisions live in `docs/decisions`.

## The two buttons

| Button | Door | Route | Meaning |
| --- | --- | --- | --- |
| **This is You** | A | `/you` | Identity, voice, look, ideas, notes, quick create and publish |
| **Your World** | B | `/world` | Business and life-ops: people, money, campaigns, calendar |

Home (`/`) shows **exactly those two** large choices. No third CTA. No dashboard of modules on the front door.

Copy stays plain and warm. The app works for the person. They do not work for the app.

## Decision map (DR-001–004)

| ID | File | What it locks |
| --- | --- | --- |
| **DR-001** | `docs/decisions/DR-2026-09-12-001-two-door-home.md` | One app, two doors, shared workspace spine. Clients may take both doors or Door A only. Business facts captured on Door A also live on Door B. |
| **DR-002** | `docs/decisions/DR-2026-09-12-002-forge-naming-family.md` | Recovered forge / tool names (Sword, Citadel, and the rest) as an **internal** language layer. Not a third door. Not required on the home buttons. |
| **DR-003** | `docs/decisions/DR-2026-09-12-003-home-door-labels.md` | The two buttons are **This is You** and **Your World**. Older working titles (Quick Post, Your dreams coming true) are not button copy. |
| **DR-004** | `docs/decisions/DR-2026-09-12-004-simplicity-and-user-mission.md` | Stay simple. Public UI uses human words. Forge-era names stay off the glass. Ship only what helps, gives time back, and is a positive. **Never should the user work for AI.** |

Related: `docs/decisions/ADDENDUM-Master-Brand-System-doors-and-forge-2026-09-12.md` maps Master Brand System pieces onto the two doors.

## What must not appear in user-facing UI

- Forge-era words: Sword, Citadel, Shield, Anvil, Foundry, Whetstone, Vault, Scabbard
- Older door titles: Quick Post, Quick Thought, Your dreams coming true
- Homework, ritual prompts, or "feed the model" flows

Those names may stay in docs and in founder context. They do not ship as chrome.

## Scaffold (this milestone)

- `/` — workspace context (demo switcher) + the two home buttons
- `/you` — Door A placeholder modules (Voice, Look, Ideas, Notes)
- `/world` — Door B placeholder modules (People, Money, Campaigns, Calendar)

Placeholders only. Not a sticker book, not a CRM, not a full desk. Shared auth, workspace, and notes come later on the same spine.

## Mission filter (every later feature)

1. Does this help and work **for** the user?
2. Does it give them time back?
3. Is it only a positive in their life?

If no — do not ship it.