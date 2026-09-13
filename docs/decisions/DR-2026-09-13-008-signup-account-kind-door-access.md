# DR-2026-09-13-008 — Signup: individual/business + door access

**Status:** Locked  
**Date:** 2026-09-13

## Decisions

1. **At signup** we ask: is this for a **business** or an **individual**? (You pick for me → Individual.)
2. **Everyone starts with This is You only.** Your World is an **upgrade** (`door_access = you` → `both`).
3. Setup **order** remains ours — never a user door-order picker.
4. `door_access` can only be changed by a platform founder (`is_platform_super`).

## Storage

- `profiles.account_kind` — `individual` | `business`
- `profiles.door_access` — `you` | `both` (default `you`)
- New users: `handle_new_user` reads `account_kind` from signup metadata; always sets `door_access = you`.