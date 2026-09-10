# Brand Forged

Brand Forged is a Next.js platform application.

This README describes engineering workflows only.

Product definition, governance, and architectural authority are defined through the Brand Forged Knowledge System and its authoritative documents.

## Authoritative Sources

The Brand Forged Constitution, Knowledge System, Core Knowledge Pack, and Master Playbook are the authoritative product and governance sources.

If these documents are not present in the repository, retrieve them from the Brand Forged authoritative knowledge source before making architectural or product decisions.

Engineering documentation supplements the authoritative sources; it does not replace them.

Do not recreate or reinterpret these documents from memory.

- [Repository Audit](docs/repository-audit-v1.md)
- [Sprint 0 Implementation Plan](SPRINT_0_IMPLEMENTATION_PLAN.md)

Do not restate, interpret, or summarize the authoritative documents here. Update their source files directly when governance or product direction changes.

## Prerequisites

- Node.js `24.16.0`
- npm `11.13.0`

The supported runtime contract is pinned in `.nvmrc` and `package.json`.

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
npm test
npm run build
```

## Project scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run Node unit tests (workspace isolation). |
| `npm run build` | Build the production application. |
| `npm run start` | Run the production application after a build. |

## Environment configuration

Do not commit `.env` files, `.env.local`, or production credentials. Use `.env.example` as the template.

## Supabase Sprint 0

Auth and persistence seams use Supabase (Auth + Postgres) with Zod-validated environment access.

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Optionally set `SUPABASE_SERVICE_ROLE_KEY` for server-only admin access (never expose to the browser).
3. Set `AUTH_REQUIRED=true` to protect `/app`, `/settings`, and `/workspaces` via middleware. `/` stays public.
4. Apply SQL migrations under `supabase/migrations/` to your Supabase project.
5. Sign in at `/login` (email/password). Health check: `GET /api/health` returns `{ ok, authConfigured }` with no secrets.

Workspace isolation is enforced by RLS policies and pure policy helpers in `lib/auth/workspace-policy.ts`.

## Repository conventions

- Keep product-domain decisions in their authoritative documentation, not in this README.
- Retrieve authoritative sources before creating or modifying documentation, architecture, or implementation.
- Keep application changes scoped to an approved milestone.
- Preserve workspace isolation in all future persistence, authorization, and asset-storage work.
- Run the verification commands above for applicable changes.
