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

**Sprint 1.4 — Cognito authentication: complete.** `apps/api/src/platform/auth`
implements the piece `libs/rbac/src/lib/request-context.ts` explicitly
called out as missing: verifying an incoming Cognito access token
(`aws-jwt-verify`, `tokenUse: 'access'`, Blueprint §8.3) and resolving it
through `platform.users` → `people.persons` → active
`people.role_assignments` into the `ActorContext` shape `RbacGuard`
consumes. Applied globally as `AuthGuard` (`APP_GUARD`) — every route
requires a verified identity by default, opt out via `@Public()` (used
only by `GET /health`). A shared `platform.audit_log` writer
(`AuditModule`) logs authentication failures per Blueprint §8.5. See
`apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md`. Of the two gaps
originally found while building this, one (CLUSTER scope) is now
resolved as a People domain follow-up — see below; the other
(multi-Role-Assignment Persons) remains open, deliberately, pending a
product decision. `COGNITO_USER_POOL_ID`/`COGNITO_CLIENT_ID`/`COGNITO_REGION`
still require a real, already-provisioned Cognito User Pool for
end-to-end verification, which remains outstanding.

**People domain — built.** `apps/api/src/modules/people` is the first
bounded-context module: Person create/read/update with FR-PPL-02
duplicate detection, the FR-PPL-03 lifecycle-stage state machine,
Bacenta/Basonta assignment (FR-PPL-04/05, including PRD §19.1 step 6's
automatic lifecycle side effect), and Role Assignment grants (including
the Poimen gate, PRD §24 OQ-02) — the first real consumer of both
`AuthGuard`'s `ActorContext` and `libs/rbac`'s
`RbacGuard`/`RecordLevelPolicyGuard` (built Sprint 1.1, unwired until
now). `pnpm install`/`test`/`build` passed on the user's machine on first
try; `pnpm lint` initially failed on 7 real errors (type-only imports,
floating promises in new test files) — fixed, pending a final confirming
lint run. See `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md` for
the full citation breakdown. Worth flagging up front:

- **CLUSTER scope is now fixed** (a direct follow-up to this milestone,
  not part of it originally) — Pastoral Care's flagship Assistant Pastor
  cluster view would otherwise have been built on the same broken
  foundation. `libs/rbac`'s `ActorContext.clusterId` (a single value
  nothing could ever populate) is now `ActorContext.clusterBacentaIds:
  string[]`, populated from `role_assignments.scope_group_ids` and tested
  as set membership, not equality. See
  `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md`'s "Resolved" section.
- Row-Level Security (Blueprint §7.3) is still not wired — this module's
  repositories rely entirely on explicit `branchId` filtering in
  application code as the *only* current Branch-isolation enforcement,
  not merely the intended backstop layer under it.
- PRD §16.1's persistent Admin-facing "duplicate resolution queue" isn't
  built (no backing table in the Sprint 1.3 schema); FR-PPL-02 is
  implemented as a narrower synchronous check-and-reject instead.
- Multi-Role-Assignment Persons still can't authenticate at all (Sprint
  1.4's other open question) — deliberately left open, not a schema/code
  mechanics fix like CLUSTER scope turned out to be.

**Pastoral Care domain — built.** `apps/api/src/modules/pastoral-care` is
the second bounded-context module: Poimen enrollment tracking (FR-PC-06),
Follow-up task creation/completion/escalation (FR-PC-03/04, BR-PC-04), and
Pastoral notes (§16.2, NFR-PRIV-01's explicit ADMIN deny). The silent-drift
decision tree (PRD §15.8, BR-PC-02, FR-PC-05) is built as a pure function
in `libs/domain/pastoral-care` but not yet wired to a real trigger — the
attendance data it needs comes from `gatherings.attendance_records`, and
the Gatherings domain doesn't exist yet. See
`apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md` for the
full citation breakdown, including two pre-existing People-module gaps
this milestone found and fixed (Group/Bacenta creation was never built;
Bacenta Leader succession never closed the prior leader's Role Assignment)
and one module-boundary violation fixed (People's `RoleAssignmentRepository`
used to query `pastoral_care.poimen_enrollments` directly — now consumes
`PoimenEnrollmentService` via cross-module DI, with `PeopleModule` and
`PastoralCareModule` importing each other via `forwardRef`). Worth flagging:

- **FR-PC-03's automatic task-creation trigger and BR-PC-04's automatic
  escalation-target resolution are deliberately not wired up** — both
  require resolving a "default Shepherd"/"organizational superior" from
  data the schema doesn't capture (no rotation-state field, no direct
  reporting-line pointer). Every Follow-up task create/escalate call
  requires an explicit assignee/target instead of an invented default.
  This needs a product decision, not an engineering guess.
- Same Row-Level-Security and duplicate-resolution-queue caveats as the
  People domain above still apply, unchanged.

Next: a real `pnpm install && pnpm lint && pnpm test && pnpm build` run on
the user's machine to confirm both milestones, then the Ministry,
Gatherings, Stewardship, or Insights domain (not yet decided).

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
