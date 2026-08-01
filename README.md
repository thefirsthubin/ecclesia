# Ecclesia — Church Operating System

Nx monorepo implementing the system specified in the **Ecclesia PRD (v1.0)**
and the **Ecclesia Technical Blueprint / PTB v2.0 (v1.0)**. Those two
documents, plus the **PRD Open Questions Resolution Workshop**, are the only
source of truth for product and architectural decisions; this repository
implements them and must not silently diverge from them. If code and
documentation disagree, that is a bug in one of the two — raise it, don't
pick a side quietly.

## Current status

**Sprint 0 — Engineering Foundation: complete.** All 14 Nx projects (`api`,
`worker`, `mobile`, `web-admin`, and ten shared libraries) are registered,
build, lint, and test cleanly from a fresh install. No business logic,
database models, authentication, or UI exist yet — this sprint was
tooling only.

**Sprint 1.0 — Repository Protection: complete.** A GitHub Actions
workflow (`.github/workflows/ci.yml`) runs `pnpm install` / `lint` /
`test` / `build` against a clean checkout on every push and pull request —
the same gate above, automated, so a regression is caught by CI rather
than discovered later by hand.

**Sprint 1.1 — RBAC executable specification: complete.** `libs/rbac` now
holds the PRD §17.3 permission matrix as executable data, the record-level
policy checks (BR-STW-04, the Poimen gate), the authorization engine, and
the NestJS guards/decorator that will apply it once controllers exist.
See `libs/rbac/README.md`. Not wired into `apps/api` yet — that happens
alongside the People domain's first real controllers.

**Sprint 1.2 — NestJS platform foundation: complete.** `apps/api/src/platform`
now provides Zod-validated process config, structured logging
(`nestjs-pino`), a version-neutral `/health` endpoint (`@nestjs/terminus`),
a per-route Zod validation pipe, Swagger at `/docs`, and a workspace-wide
exception filter that logs denials at `warn` and bugs at `error` (Security
by Default). URI path versioning (`/v1/...`) is enabled from this first
endpoint, per Blueprint §14.7. See `apps/api/README.md`. `libs/rbac` is
still not wired in — that's the RBAC guards' first real usage, alongside
Sprint 1.4 authentication and the People domain's first controllers.

**Sprint 1.3 — Database Foundation: rebuilt against the real Blueprint/PRD
text and fully verified against a real PostgreSQL instance.** `db/` holds
a Prisma schema and migration history covering all seven bounded-context
Postgres schemas, Row-Level Security policies, the append-only Financial
Transaction event model, and the temporal GroupMembership model (Blueprint
§7.2-§7.5). The first version of this schema was designed without the
actual Blueprint/PRD text, at the user's explicit direction, from evidence
already committed in `libs/rbac`; `docs/Ecclesia_PRD.md` and
`docs/Ecclesia_Technical_Blueprint.md` are now in the repo verbatim, and
the schema has been rebuilt against them — every model/field in
`db/schema.prisma` is now tagged `[BLUEPRINT-EXACT]` or `[PRD-DERIVED]`
with a section/rule citation. See `db/DESIGN_NOTES.md` for the full
traceability index, the corrections made from the first draft, and the
open questions that remain genuinely unresolved by the source documents.
`apps/api/src/platform/database` wires a `PrismaService` and a database
health indicator. All four migrations (the hand-written initial one plus
three follow-ups closing real gaps found by diffing against the applied
database) have been run against a real local Postgres; `prisma migrate
diff` comes back empty and `pnpm db:seed` succeeds — see
`db/migrations/README.md` for exactly what those three follow-ups fixed.

**Sprint 1.4 — Cognito authentication: complete and verified against real
tooling** (`pnpm install`/`lint`/`test`/`build` all pass on the user's
machine, `aws-jwt-verify` installs cleanly) — **not yet verified against a
real Cognito User Pool**, since none is provisioned. `apps/api/src/platform/auth` implements the
piece `libs/rbac/src/lib/request-context.ts` explicitly called out as
missing: verifying an incoming Cognito access token (`aws-jwt-verify`,
`tokenUse: 'access'`, Blueprint §8.3) and resolving it through
`platform.users` → `people.persons` → active `people.role_assignments`
into the `ActorContext` shape `RbacGuard` consumes. Applied globally as
`AuthGuard` (`APP_GUARD`) — every route requires a verified identity by
default, opt out via `@Public()` (used only by `GET /health`, since
infrastructure health checks can't present a token). A shared
`platform.audit_log` writer (`AuditModule`) logs authentication failures
per Blueprint §8.5. See `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md`
for the full breakdown of what's Blueprint-exact vs. inferred, and — most
importantly — **two real, unresolved gaps found while building this**:
`libs/rbac`'s `CLUSTER` scope has no schema-backed identifier to compare
against (Assistant Pastor's cluster-scoped grants will always evaluate to
DENY until this is resolved), and a Person holding more than one
concurrently active Role Assignment has no defined resolution (the
resolver throws rather than guessing). Like Sprint 1.3's `DATABASE_URL`,
`COGNITO_USER_POOL_ID`/`COGNITO_CLIENT_ID`/`COGNITO_REGION` require a real,
already-provisioned resource — verification against real Cognito is still
outstanding; everything short of that (install, lint, unit tests, build)
is green.

**People domain — built, not yet verified against real tooling.**
`apps/api/src/modules/people` is the first bounded-context module: Person
create/read/update with FR-PPL-02 duplicate detection, the FR-PPL-03
lifecycle-stage state machine, Bacenta/Basonta assignment (FR-PPL-04/05,
including PRD §19.1 step 6's automatic lifecycle side effect), and Role
Assignment grants (including the Poimen gate, PRD §24 OQ-02) — the first
real consumer of both `AuthGuard`'s `ActorContext` and `libs/rbac`'s
`RbacGuard`/`RecordLevelPolicyGuard` (built Sprint 1.1, unwired until
now). See `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md` for the
full citation breakdown. Three items worth flagging up front:

- The two Sprint 1.4 open questions (CLUSTER scope, multi-Role-Assignment
  Persons) are still unresolved and now have concrete consequences here —
  an Assistant Pastor acting outside a Bacenta they personally lead will
  be denied by every People endpoint until the CLUSTER-scope gap is
  resolved.
- Row-Level Security (Blueprint §7.3) is still not wired — this module's
  repositories rely entirely on explicit `branchId` filtering in
  application code as the *only* current Branch-isolation enforcement,
  not merely the intended backstop layer under it.
- PRD §16.1's persistent Admin-facing "duplicate resolution queue" isn't
  built (no backing table in the Sprint 1.3 schema); FR-PPL-02 is
  implemented as a narrower synchronous check-and-reject instead.

Next: resolve the two Sprint 1.4 open questions (needed before Pastoral
Care's Assistant Pastor persona can work at all), then the Pastoral Care
domain's first controllers (Bacenta configuration, Follow-up tasks,
silent-drift detection).

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 22.x (see `.nvmrc`) | Runtime |
| pnpm | ≥ 9.0 (via Corepack) | Package manager (Blueprint ADR-002) |

```bash
# Enable Corepack and pin the pnpm version declared in package.json
corepack enable
corepack prepare pnpm@9.12.0 --activate
```

## Getting started

```bash
pnpm install       # installs dependencies and runs `prepare` (Husky hooks)
npx nx show projects
pnpm lint          # nx run-many --target=lint --all
pnpm test          # nx run-many --target=test --all
pnpm build         # nx run-many --target=build --all
pnpm format:check  # prettier --check .
```

All five commands above must pass before a change is considered done —
this is enforced automatically on every push and pull request by
`.github/workflows/ci.yml`.

## Repository layout

This layout mirrors Blueprint Chapter 2, §6.2 exactly — each directory's
own `README.md` states its purpose, which PRD/Blueprint section it
implements, and which future milestone populates it.

```
apps/
  api/          NestJS modular monolith (Blueprint ADR-001)
  worker/       Background worker: Church Pulse, notifications, sweeps
  mobile/       React Native (Shepherds, Basonta Leaders, Treasurers, Members)
  web-admin/    React (Resident Pastor, Assistant Pastors, Admins)
libs/
  domain/       Framework-agnostic business logic, one lib per bounded context
    people/
    pastoral-care/
    ministry/
    gatherings/
    stewardship/
    insights/
  contracts/    Shared DTOs / Zod schemas (Blueprint §6.3)
  rbac/         Permission matrix as code + guard primitives (Blueprint §9.3-9.4)
  config/       Typed configuration loading (Blueprint §6.2)
  testing/      Shared fixtures/factories (Blueprint §14.2)
infra/          AWS CDK (Blueprint Ch.5)
db/
  migrations/   Prisma migration history (Blueprint §7.6)
```

## Module boundaries

`eslint.config.cjs` enforces the dependency-direction rules from Blueprint
§4.3 and §5.2 via `@nx/enforce-module-boundaries`: a domain library may
depend only on `libs/contracts`, never on another domain library or on
`libs/rbac` directly; applications may depend on anything. This is checked
in CI on every pull request, not left to code-review discipline alone.

## Commit conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
enforced by Commitlint (`commitlint.config.js`) via the `commit-msg` Husky
hook. Scopes are restricted to the module/app inventory above plus a small
set of infrastructure scopes (`ci`, `deps`, `repo`, `infra`, `db`) — see
`commitlint.config.js` for the exact list. Example:

```
feat(stewardship): enforce same-actor check on transaction verification

Implements FR-STW-03, BR-STW-04 (PRD §13.5, §15.5): a Treasurer may not
verify a transaction they personally recorded.
```
