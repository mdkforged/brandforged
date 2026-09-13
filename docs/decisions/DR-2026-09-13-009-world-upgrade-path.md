# DR-2026-09-13-009 - Your World upgrade path

**Status:** Locked

## Decision

Your World is an upgrade with a real request path:

1. User taps **Open Your World** on home or `/world`.
2. `request_world_upgrade()` stamps `world_upgrade_requested_at` (users cannot set `door_access`).
3. Platform founder grants with `grant_world_access(user_id)` / super tools.

Founder (`mdkforged`) keeps `door_access = both` for product work.