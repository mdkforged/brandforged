# DR-2026-09-13-008 â€” Signup: individual/business + door access

**Status:** Locked  
**Date:** 2026-09-13

## Decisions

1. **At signup** we ask: is this for a **business** or an **individual**? (You pick for me â†’ Individual.)
2. **Everyone starts with This is You only.** Your World is an **upgrade** (`door_access = you` â†’ `both`).
3. Setup **order** remains ours â€” never a user door-order picker.
4. `door_access` can only be changed by a platform founder (`is_platform_super`).

## Storage

- `profiles.account_kind` â€” `individual` | `business`
- `profiles.door_access` â€” `you` | `both` (default `you`)
- New users: `handle_new_user` reads `account_kind` from signup metadata; always sets `door_access = you`.
## Solution focus (same day)

Right after business/individual, ask:

- **All branding** (solution_focus = branding)
- **All-in-one business** (solution_focus = all_in_one)

You pick for me: Individual → branding; Business → all_in_one.

This does **not** unlock Your World by itself. Door access still starts at you; all-in-one marks upgrade intent.