# Brand Forged

Brand Forged is a Next.js application. This document covers local development and engineering workflows only.

## Authoritative product and governance sources

The README is not a governance or product-definition document. Refer to the following sources for those decisions:

- [Brand Forged Constitution](docs/constitution/Brand_Forged_Constitution_v1.0.md)
- [Brand Forged Knowledge System](docs/knowledge-system/Knowledge_System.md)
- [Core Knowledge Pack](docs/knowledge-system/Core_Knowledge_Pack.md)
- [Brand Forged Master Playbook](docs/playbook/Brand_Forged_Master_Playbook_v1.0.md)
- [Repository Audit](docs/repository-audit-v1.md)
- [Sprint 0 Implementation Plan](SPRINT_0_IMPLEMENTATION_PLAN.md)

Do not restate, interpret, or summarize those authoritative documents here. Update their source files directly when governance or product direction changes.

## Prerequisites

- Node.js `24.16.0`
- npm `11.13.0`

The expected runtime is pinned in `.nvmrc` and `package.json`.

## Install

```bash
npm ci
```

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

Run the following before proposing a change:

```bash
npm run lint
npm run typecheck
npm run build
```

## Project scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run build` | Build the production application. |
| `npm run start` | Run the production application after a build. |

## Environment configuration

Sprint 0 will establish environment validation and document required variables. Do not commit `.env` files or production credentials.

## Repository conventions

- Keep product-domain decisions in their authoritative documentation, not in this README.
- Keep application changes scoped to an approved milestone.
- Preserve workspace isolation in all future persistence, authorization, and asset-storage work.
- Run the verification commands above for applicable changes.
