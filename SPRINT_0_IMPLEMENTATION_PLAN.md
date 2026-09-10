# Brand Forged — Sprint 0 Implementation Plan

**Status:** Planning only  
**Scope:** Engineering foundation; no application features  
**Technical baseline:** `docs/repository-audit-v1.md`  
**Product-organization authority:** Existing Brand Forged platform organization

## 1. Purpose

Sprint 0 establishes the engineering foundation for Brand Forged without redefining the business, content, or operating model. The existing organizational architecture is authoritative. This plan maps that architecture into explicit software boundaries so future feature work is consistent, traceable, and maintainable.

Sprint 0 does **not** build the Dashboard, Identity Engine, Template Engine, marketplace, or end-user workflows. It creates the structure, contracts, conventions, security posture, and delivery pipeline needed to implement them safely in later sprints.

## 2. Source of truth and decision hierarchy

Use the following hierarchy when product intent or terminology is unclear:

1. Existing Brand Forged platform organization and its source artifacts.
2. The Brand Forged Constitution, Knowledge System, and Master Playbook when present in the repository documentation.
3. This implementation plan for engineering decisions and sequencing.
4. The Repository Audit for the current technical baseline only.

The Repository Audit identifies what exists and what is absent; it does not define the product. Product concepts are not to be renamed, merged, or redesigned during Sprint 0.

## 3. Authoritative organization mapped to software architecture

| Existing organization | Software boundary | Sprint 0 responsibility | Later feature ownership |
| --- | --- | --- | --- |
| `06_Platform_Systems` | Platform capabilities and integrations | Define integration ports, configuration conventions, and platform event contracts | Social/platform connections, publishing, analytics, routing |
| `07_Workflow_Systems` | Cross-domain workflow orchestration | Define workflow state, commands, audit events, and job boundaries | Content production, review, approval, export, and publishing flows |
| `08_Product_Platform_Architecture` | Product domains and route ownership | Establish domain module boundaries and typed contracts | Dashboard, marketplace, user journeys, product modules |
| `09_Shared_Engines_and_Libraries` | Shared kernel and reusable engines | Establish library conventions, versioning, and dependency rules | Shared engines, utilities, schemas, tokens, asset services |
| Asset Library | Asset domain | Define asset metadata, storage abstraction, ownership, and access model | Upload, tagging, search, transformation, rights, and routing |
| Dashboard System | Dashboard domain | Define dashboard shell, navigation registry, module contracts, and authorization seams | User/admin dashboards, module widgets, reporting |
| Identity Engine | Identity domain | Define profile/brand identity schemas, tenant boundaries, and policy interfaces | Brand profiles, identity configuration, personalization |
| Template Engine | Template domain | Define template schema, rendering interface, version model, and input contracts | Template creation, preview, rendering, export |
| Tethered & Truth Workspace | First tenant/workspace implementation | Model as a workspace/brand tenant, not a special-case application branch | Workspace-specific content, assets, templates, permissions, workflows |

### Architectural rule

The application must support Brand Forged as a platform that serves multiple workspaces/brands. Tethered & Truth is the first known workspace and must be represented by data and configuration, never by hard-coded product logic or a forked application.

## 4. Target architecture

Adopt a modular monolith for the initial platform. It is the appropriate foundation for the current minimal Next.js repository because it keeps deployment simple while enforcing domain boundaries that can later be extracted into services only when warranted by load, ownership, or operational requirements.

```text
Next.js application (presentation and server boundary)
│
├─ app/                         Route composition, layouts, route handlers
├─ features/                    Product-domain modules
│  ├─ workspaces/               Tenant/workspace boundary
│  ├─ identity/                 Identity Engine
│  ├─ assets/                   Asset Library
│  ├─ templates/                Template Engine
│  ├─ dashboard/                Dashboard System
│  ├─ workflows/                Workflow Systems
│  ├─ platforms/                Platform Systems
│  └─ marketplace/              Marketplace domain (boundary only in Sprint 0)
├─ components/                  Reusable, domain-neutral UI components
├─ lib/                         Shared infrastructure adapters and utilities
│  ├─ auth/                     Authentication/authorization integration seam
│  ├─ db/                       Persistence adapter and migrations
│  ├─ storage/                  Object-storage adapter
│  ├─ jobs/                     Background-job adapter
│  ├─ observability/            Logging, metrics, error reporting
│  └─ validation/               Environment and shared schema validation
├─ contracts/                   Stable domain DTOs, event contracts, schemas
├─ design-system/               Tokens and shared UI primitives
└─ tests/                       Test support, fixtures, and integration tests
```

### Dependency rules

- `app/` composes features; it must not contain business rules or persistence logic.
- A feature owns its domain types, operations, policies, and persistence mappings.
- Features communicate through exported contracts and domain events, not direct imports into another feature's private internals.
- `lib/` contains infrastructure implementations, not product-domain decisions.
- `components/` and `design-system/` remain domain-neutral; domain UI belongs inside its feature.
- The Tethered & Truth workspace is configured through workspace records, permissions, identity profiles, and assets.
- No integration SDK should be imported directly into a UI component.

## 5. Core platform contracts to define in Sprint 0

These contracts create a shared language without implementing user-facing workflows.

### Workspace and tenancy

- `Workspace`: stable identifier, name, slug, status, configuration, created/updated timestamps.
- `WorkspaceMembership`: user, workspace, role, status, and permission grants.
- `BrandProfile`: workspace-scoped identity configuration owned by the Identity Engine.
- All tenant-owned records must carry a workspace identifier and be queried through an enforced workspace scope.

### Asset Library

- `Asset`: workspace ownership, storage key, media type, metadata, lifecycle state, rights/source information, and timestamps.
- `AssetTag`: controlled tags with workspace/global scope.
- `AssetDerivative`: generated or transformed asset lineage.
- `StorageProvider` interface: upload, signed read URL, delete, and metadata operations.

### Template Engine

- `Template`: workspace/global scope, semantic type, version, schema, lifecycle status, and ownership.
- `TemplateInputSchema`: validated, versioned input contract.
- `RenderRequest` and `RenderResult`: asynchronous rendering boundary, independent of the eventual rendering provider.
- Template changes must be versioned; published assets retain the template version used to generate them.

### Workflow Systems

- `WorkflowDefinition`: named, versioned state model and supported transitions.
- `WorkflowInstance`: workspace-scoped operational record with state, initiator, timestamps, and references.
- `WorkflowEvent`: immutable audit trail for transition, actor, and relevant metadata.
- Long-running transitions are dispatched through a job interface, never performed in an HTTP request lifecycle.

### Platform Systems

- `PlatformConnection`: workspace-owned credential reference and connection status; never store raw provider credentials in application records.
- `PublicationTarget`, `PublishRequest`, and `PublicationResult`: normalized publishing contracts.
- `PlatformMetric` and `PlatformEvent`: provider-neutral ingestion contracts.

### Dashboard System

- `DashboardModule`: registered module ID, required permission, route, capability flags, and feature status.
- `DashboardContext`: authenticated user, active workspace, role/permissions, and enabled modules.
- Dashboard navigation is derived from the module registry and workspace authorization—not hard-coded for one workspace.

## 6. Sprint 0 implementation work

### A. Repository and developer foundation

1. Update the repository documentation to replace remaining create-next-app guidance with project setup, architectural conventions, and local environment instructions.
2. Define the supported Node and npm versions in `package.json` and document a clean-install workflow.
3. Establish formatting, linting, TypeScript, import-boundary, and naming conventions.
4. Create the target directory structure with placeholder ownership documentation where a domain is not yet implemented.
5. Preserve current user changes in `app/page.tsx`; no product interface work is part of this sprint.

### B. Design-system foundation

1. Convert global visual decisions into named Brand Forged design tokens: color, typography, spacing, radius, elevation, motion, and breakpoints.
2. Resolve the current font conflict by choosing one intentional default typography path.
3. Add accessible, domain-neutral primitives only: layout container, text, button, input, form field, card, status indicator, dialog, and empty/error states.
4. Establish light/dark behavior only if it is specified by the authoritative brand documentation; do not invent a visual direction.

### C. Domain boundaries and contracts

1. Create the feature boundaries listed in Section 4.
2. Define shared schema/contract conventions and a single validation library.
3. Add Workspace and Membership as the first cross-cutting platform model.
4. Define the Asset, Identity, Template, Workflow, Platform, and Dashboard contracts in Section 5.
5. Add a domain-event envelope with event ID, workspace ID, actor, timestamp, schema version, correlation ID, and payload.

### D. Persistence, security, and configuration

1. Select and configure a relational database and migration tool suitable for workspace-scoped transactional data.
2. Establish the initial schema for users, workspaces, memberships, brand profiles, audit events, and a migration ledger; do not populate business content.
3. Select an authentication provider and implement the integration seam, role model, and workspace authorization policy boundary.
4. Select object storage and implement a provider abstraction; do not build the Asset Library UI yet.
5. Add environment schema validation, `.env.example`, secret-handling rules, and separate local/preview/production configuration.
6. Add baseline security: secure headers, content-security-policy strategy, request validation, server-side authorization enforcement, audit logging, and rate-limit seam.

### E. Operations and delivery

1. Add CI for clean install, formatting/lint, type-check, tests, and production build.
2. Add unit-test and integration-test tooling plus a single end-to-end smoke-test framework.
3. Add structured logging, error reporting, health/readiness checks, and deployment environment conventions.
4. Define database backup, migration, rollback, and incident-response runbooks before persistent user data is introduced.
5. Add dependency/security scanning and a routine update policy.

### F. Product shell only

1. Implement an authenticated application-shell boundary and workspace-context provider only after identity/authorization foundations are in place.
2. Register empty Dashboard, Identity, Asset, Template, Workflow, and Platform modules as non-feature placeholders or feature-flagged routes.
3. Ensure any shell supports an active workspace selector and permissions-derived navigation.
4. Do not implement dashboard content, content creation, rendering, publishing, marketplace behavior, or integrations in Sprint 0.

## 7. Recommended technology decisions to validate

The existing Next.js 16, React 19, TypeScript, and Tailwind 4 baseline can remain. Sprint 0 should make the following choices explicitly, based on team preference, cost, and deployment constraints:

| Concern | Required decision | Evaluation criteria |
| --- | --- | --- |
| Hosting | Managed Next.js-compatible platform | Preview environments, regional needs, observability, cost |
| Database | Managed PostgreSQL-compatible service | Row-level workspace isolation, migrations, backups, reporting |
| Data access | Type-safe ORM/query layer | Migration discipline, transaction support, team ergonomics |
| Authentication | Hosted or self-managed auth provider | Workspace roles, secure sessions, provider extensibility |
| Storage | Object storage service | Signed URLs, lifecycle rules, media cost, derivatives |
| Jobs | Durable background-job service | Retries, idempotency, scheduled work, event triggers |
| Validation | Shared runtime schema validator | Type inference, server/client reuse, error quality |
| Observability | Error, log, and performance platform | Correlation, privacy controls, cost, alerting |
| Testing | Unit/component plus browser E2E stack | Next.js support, CI reliability, accessibility coverage |

Do not add providers merely to satisfy a checklist. Each selected provider must be wrapped behind a small internal interface where it represents a durable platform capability.

## 8. Data isolation and permissions requirements

The platform must be workspace-first from its first persisted record.

- Every workspace-owned record has a non-null workspace identifier.
- Server-side data access derives workspace scope from authenticated context, not a client-provided ID alone.
- Membership and role checks occur at every server mutation and read boundary.
- Asset storage paths and signed URLs include workspace scoping.
- Audit events record actor, workspace, action, target, time, and correlation ID.
- Cross-workspace administration is explicit and separately authorized.
- Tethered & Truth data is isolated as a workspace, with no privileged hard-coded exception.

## 9. Sprint 0 acceptance criteria

Sprint 0 is complete only when all of the following are true:

1. The repository documents the authoritative organization-to-software mapping and engineering conventions.
2. The modular directory and import-boundary structure exists, with ownership clear for every named platform concept.
3. Workspace, membership, authorization, audit-event, asset, template, workflow, platform, and dashboard contracts are defined and type-checked.
4. Workspace-scoped persistence, migrations, environment validation, and local development setup are operational.
5. Authentication and authorization seams enforce workspace isolation in a testable path.
6. Object storage and background-job interfaces exist behind provider abstractions.
7. CI performs install, lint, type-check, tests, and production build on every proposed change.
8. Logging, error monitoring, basic health checks, and deployment environment conventions are established.
9. A test validates that one workspace cannot access another workspace's protected record.
10. No Dashboard, Identity Engine, Template Engine, Asset Library, marketplace, publishing workflow, or Tethered & Truth-specific feature has been built beyond the foundations explicitly described here.

## 10. Deferred to post–Sprint 0

- Full dashboard modules and reporting.
- Identity profile editing and identity generation workflows.
- Asset upload, browsing, tagging, and transformation UI.
- Template authoring, preview, rendering, and export workflows.
- Content-production and approval workflow UI.
- Social/platform credential connection and publishing.
- Marketplace discovery, seller onboarding, transactions, and payouts.
- Tethered & Truth content, assets, automations, or dashboard configuration beyond the workspace seed/configuration path.

## 11. First implementation sequence after approval

1. Confirm provider choices and deployment target.
2. Add repository conventions, environment schema, CI, and test harness.
3. Establish the workspace/auth/persistence/audit-event foundation.
4. Add modular domain contracts and internal infrastructure adapters.
5. Add design tokens and shared primitives.
6. Verify isolation, build, test, deployment, observability, and rollback paths.
7. Plan Sprint 1 around the first approved product workflow from the existing Brand Forged documentation.
