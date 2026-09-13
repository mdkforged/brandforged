# Brand Input Set and Onboarding (Canon DR-011)

## Lock

Five required Brand Input Set questions:

1. `brandName`
2. `industry`
3. `audience`
4. `moodWords`
5. `logoStyle` (`wordmark` | `icon` | `combo`)

Optional:

- `colorPreference` (`warm` | `cool` | `neutral` | `bold` | empty)

## Workflow 4.2 `/start`

Stages: brief → engine_run → kit_review → sticker_book → first_template → export_publish → brand_vault.

Source of truth: `lib/identity/engine-scaffold.ts` (`BrandInputSet`, `IdentitySession`, `BRAND_INPUT_PICKS`, `briefReady`).

Bridge fields still written for This is You readers: `aboutYou` (= brandName), `contentStyle` (= moodWords), plus placeholder `referencePhotos` and `socialSites`.
