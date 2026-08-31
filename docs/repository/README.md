# Repository Architecture

This directory documents how the Brand Forged repository is organized and how contributors should decide where new files belong.

Top-level architecture guidelines:

- `app/` contains Next.js App Router routes, layouts, metadata, and route-owned files.
- `assets/` contains source assets that are not necessarily served directly by the web app.
- `components/` contains shared React components.
- `config/` contains non-secret application configuration.
- `docs/` contains project documentation, decisions, engineering notes, governance artifacts, milestone records, and repository guidance.
- `features/` contains feature-owned product modules.
- `knowledge/` contains durable Brand Forged knowledge, standards, prompts, playbooks, and operating context.
- `lib/` contains shared utilities and helpers.
- `platform/` contains platform infrastructure such as authentication, database, integrations, jobs, and storage when those systems are introduced.
- `styles/` contains shared styling support beyond route-owned styles when needed.
- `types/` contains shared TypeScript types that are not owned by a single feature.

Create deeper subdirectories only when the first implementation that needs them is added.
