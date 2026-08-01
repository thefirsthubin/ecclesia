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

**Gatherings domain — built.** `apps/api/src/modules/gatherings` is the
third bounded-context module: Gathering/GatheringSeries create/read/update
(FR-GTH-01/02, §12.4), attendance recording and per-Gathering
completeness checks (FR-GTH-03/05), and the visitor-intake flow
(FR-GTH-04/BR-GTH-03) — creating a Person (reusing People's FR-PPL-01/02/03
logic via the newly-exported `PersonService`) and, per US-A2, conditionally
auto-creating a Follow-up task via Pastoral Care's newly-exported
`FollowUpTaskService` when a Bacenta preference resolves to an active
Shepherd. Two new People-module public service interfaces
(`GroupScopeService`, `GroupLeadershipService`) were extracted to support
this, following the same Blueprint §7.2 pattern Pastoral Care established.
See `apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md` for the
full citation breakdown. Worth flagging:

- **The "Usher" role gap** — PRD narrative repeatedly names "Usher" as the
  actor recording attendance and capturing visitor forms, but `libs/rbac`'s
  Role catalog (built Sprint 1.1 from §17.3's literal column headers) has
  no such role. `BACENTA_LEADER`/`BASONTA_LEADER`/`ASSISTANT_PASTOR`/`ADMIN`
  are granted the relevant permissions as a reasonable stand-in, not a
  citation. Needs a product decision.
- **The recurrence-rule format is unspecified by the PRD** — `recurrenceRule`
  is stored as an opaque string; Gathering instances are always created
  explicitly, never auto-generated from a series. This still fully
  satisfies §12.4's "individually cancellable without altering the series"
  edge case.
- **US-A2's default-assignee "rotation among Shepherds" fallback is not
  built** — same unresolved gap `PASTORAL_CARE_DESIGN_NOTES.md` already
  flagged; the Follow-up task is only auto-created when an explicit Bacenta
  preference resolves to an active Shepherd.
- The Branch-wide attendance-completeness sweep/reminder and a real
  silent-drift-sweep consumer of the now-real `attendance_records` table
  are both deliberately out of scope this milestone (no scheduler exists
  yet in this codebase).

**Stewardship domain — built.** `apps/api/src/modules/stewardship` is the
fourth bounded-context module: the Financial Transaction inbound sub-flow
(record/read/verify/flag/escalate/reconcile, FR-STW-01 through 05/07,
BR-STW-01 through 04), the Expense outbound sub-flow (request/read/approve/
reject/pay/receipt, FR-STW-09, BR-STW-07/08), and Project/Pledge
create/read/fulfill (FR-STW-08, H2) — consuming People's already-exported
`GroupScopeService`/`PersonScopeService` unchanged (no new People exports
needed this time). Went ahead of Ministry/Insights because its RBAC
groundwork (the full permission matrix, and BR-STW-04's same-actor
record-level check) had sat unused since Sprint 1.1, the same "plumbing
before its first consumer" pattern the Poimen gate followed. This
milestone reuses that same check (`DIFFERENT_ACTOR_THAN_RECORDER`) for
FR-STW-09's approver-must-not-be-requester rule too, rather than inventing
a parallel one, and is this codebase's first real *declarative* use of
`RecordLevelPolicyGuard`. See
`apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md` for the
full citation breakdown. Worth flagging:

- **`amountMinor` travels as a decimal string, never a JSON number** —
  Prisma `BigInt` cannot round-trip through `JSON.stringify`, and a JS
  `number` loses precision past 2^53. Documented at the schema layer, not
  an incidental choice.
- **FR-STW-07's bank-deposit comparison is not built** — `db/schema.prisma`
  has no bank-deposit-confirmation entity at all; only the `Verified ->
  Reconciled` state transition itself is buildable against the existing
  schema. Needs a schema change, not an engineering guess — the same
  framing as PRD §16.1's duplicate-resolution queue gap from the People
  milestone.
- **No scheduler exists** for the `Flagged -> UnderInvestigation` SLA
  trigger, Mobile Money provider confirmation (NFR-INT-01, H2), or Pledge
  reminder delivery (OQ-07) — same disclosed gap category as Pastoral
  Care's silent-drift sweep and Gatherings' completeness sweep.
- Three more `[INFERRED]` permission-matrix gaps (Expense pay/receipt/read,
  Financial Transaction read for Treasurer/Bacenta Leader, and Project/
  Pledge entirely, since §17.3 predates FR-STW-08) — see the design notes
  for the exact reasoning behind each.

**Insights domain — built.** `apps/api/src/modules/insights` is the fifth
bounded-context module: the Church Pulse weighted-scoring model
(`libs/domain/insights/src/lib/church-pulse-scoring.ts`, BR-INS-01,
OQ-10's equal-sixths placeholder), trend-decline evaluation
(`pulse-trend.ts`, FR-INS-03), compute-on-read Branch/Bacenta/Cluster
dashboards (FR-INS-01/04), and an Alert inbox with act/dismiss resolution
(FR-INS-05) — consuming People's already-exported `GroupScopeService`
unchanged (the third consumer, after Gatherings and Stewardship). Went
ahead of Ministry for the same "plumbing before its first consumer"
reason Stewardship did: its three dashboard-read permission-matrix rows
had sat unused since Sprint 1.1, and all six Church Pulse signal sources
already exist as a byproduct of the four domains already built. See
`apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md` for the full
citation breakdown. Worth flagging:

- **The real Engagement Signal ingestion pipeline does not exist.**
  Blueprint Ch.4/§10.6 describes an async EventBridge/SQS bus consumed by
  `apps/worker`; neither exists anywhere in this codebase. This milestone
  builds `EngagementSignalService.record()` completely (exported from
  `InsightsModule`, ready for that future consumer) but deliberately does
  not invent a synchronous substitute wiring the four other domains
  directly into it — every dashboard is functionally correct against
  whatever `engagement_signals` rows already exist, but none will exist
  in a real deployment until this pipeline is built.
- **NFR-PRIV-02's hard release gate is enforced structurally, not just by
  policy** — `PulseScoreService` has no method, and no code path, capable
  of computing or storing a Person-scoped Church Pulse score.
- **No true multi-Bacenta ranked-list cluster dashboard (US-G2)** — the
  same `ResourceContext` single-`bacentaId` limitation already disclosed
  for People's deferred search/directory. `cluster-dashboard/:groupId` is
  a single-Bacenta drill-down, structurally identical to
  `bacenta-dashboard/:groupId`, differing only in RBAC action/scope.
- **No separate cross-cutting Alert-inbox list endpoint** — served as the
  `alerts` array already embedded in each dashboard response instead, for
  the same structural reason as the cluster-dashboard limitation above.
- One more `[INFERRED]` permission-matrix gap (`insights.alert.read`/
  `.resolve`, since §17.3 predates the Alert-inbox surface entirely) —
  see the design notes for the full reasoning.

Next: a real `pnpm install && pnpm lint && pnpm test && pnpm build` run on
the user's machine to confirm all five milestones, then Ministry — the
one remaining bounded-context module before the locked roadmap's domain
build-out is complete.

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
