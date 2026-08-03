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
- Three more `[INFERRED]` permission-matrix gaps (Expense pay/receipt/read,
  Financial Transaction read for Treasurer/Bacenta Leader, and Project/
  Pledge entirely, since §17.3 predates FR-STW-08) — see the design notes
  for the exact reasoning behind each.
- **`[Stewardship gaps sprint]` Five originally-disclosed gaps are now
  resolved**: FR-STW-07's bank-deposit comparison (new
  `BankDepositConfirmation` entity + weekly reconciliation endpoint), the
  `Flagged -> UnderInvestigation` SLA trigger (`apps/worker`'s
  `flagged-transaction-sla-sweep` detects and signals a breach — it still
  can't auto-mutate the transaction, since `FinancialTransactionEvent.
  actorUserId` is a `NOT NULL` FK and no "system actor" exists anywhere in
  this codebase), Pledge reminder delivery (`pledge-reminder-sweep`,
  which *does* safely mutate `Pledge.reminderSentAt` — a plain column with
  no actor FK — giving OQ-07's "never repeated" guarantee a real dedup
  marker), Project progress aggregation (`totalPledgedMinor`/
  `totalReceivedMinor`/`progressPercent` on the Project response), and a
  Bacenta Leader's own Financial-Transaction list view (the list guard now
  also resolves `bacentaId`). Mobile Money provider confirmation
  (NFR-INT-01, H2) remains the one undecided scheduler-adjacent gap left in
  this domain. See `STEWARDSHIP_DESIGN_NOTES.md`'s "Resolved (Stewardship
  gaps sprint)" section for the full breakdown.

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

**Ministry domain — built.** `apps/api/src/modules/ministry` is the
sixth and last bounded-context module in the locked roadmap: staffing
targets set/corrected via upsert and read with a live-computed adequacy
ratio (FR-MIN-02/03), a Basonta roster view and overcommitment flag list
(FR-MIN-01/04), and worker availability self-service (§16.3 H2) —
consuming People's already-exported `GroupScopeService` plus a
newly-exported `GroupRosterService`, and, for the first time in this
codebase, a service exported from Gatherings (`GatheringScopeService`,
validating a Staffing Target's Gathering reference). Basonta
create/configure (FR-MIN-01) and roster add/remove needed **no new code
at all** — both were already fully functional through People's existing
Group/GroupMembership CRUD, discovered on inspection rather than assumed.
See `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md` for the full
citation breakdown. Worth flagging:

- **"Rostered" means active `GroupMembership`, not a per-Gathering
  assignment** — `db/schema.prisma`'s `ministry` schema has no "who is
  assigned to serve at this specific Gathering" entity, only a target
  count. FR-MIN-03's own acceptance criterion ("a ratio... updating as
  workers are added to the roster") confirms this reading.
- **FR-MIN-04's overcommitment flag is a disclosed proxy, not the literal
  acceptance criterion** — the PRD describes concurrent *Gathering*
  commitments; the schema only supports counting a Person's concurrent
  active *Basonta memberships*, a related but different measurement. True
  Gathering-level overlap detection needs a schema addition, the same
  "needs a schema change, not an engineering guess" framing as
  Stewardship's FR-STW-07 gap.
- **No `ASSISTANT_PASTOR` `CLUSTER` row on any Ministry action** —
  `evaluate.ts`'s CLUSTER scope check only ever consults
  `resource.bacentaId`, never `resource.basontaId`; a CLUSTER row on a
  Basonta-scoped action could never actually match. A genuine structural
  gap (Assistant Pastors have no cluster-oversight mechanism over
  Basontas today), flagged rather than papered over with a
  never-functional row.
- No scheduler exists for the staffing-gap alert ahead of a major
  Gathering (§16.3, H2) — same disclosed gap category as every other
  module's missing scheduler/event-bus infrastructure.

All six bounded-context modules named in Blueprint §4.2's module
inventory are now built, and confirmed via a real
`pnpm install && pnpm lint && pnpm test && pnpm build` run on the user's
machine — the locked roadmap's domain build-out is complete.

**apps/worker — first vertical slice built.** `apps/worker` was Sprint
0 scaffolding only until this milestone (a no-op `bootstrap()`, no queue
consumers, no scheduled jobs). Following a "Foundation + one full vertical
slice first" phasing (user-directed), this milestone builds: the
`platform.processed_events` idempotency table (Blueprint §10.5, one shared
table with a `consumerName` discriminator rather than three per-consumer
tables) and its migration; apps/worker's own platform layer (Zod-validated
config, `nestjs-pino` logging, its own `PrismaService` — no shared
`libs/database` exists, so this mirrors rather than imports apps/api's
copy); an `EventBridgePublisherService` wrapping real
`@aws-sdk/client-eventbridge`; one SQS consumer,
`insights-consumer`, ingesting the full Engagement Signal stream into
`insights.engagement_signals` exactly as `EngagementSignalService.record()`'s
own doc comment anticipated; and one scheduled sweep,
`silent-drift-sweep`, finally wiring `evaluateSilentDrift()`
(`libs/domain/pastoral-care`, zero real callers since the Pastoral Care
milestone) up to real `gatherings.attendance_records` data and publishing
a synthetic `pastoral_care.silent_drift_flagged` Engagement Signal onto
the same bus per Blueprint §10.8. `main.ts` is now a command dispatcher
(`consume:insights` / `sweep:silent-drift`) rather than a no-op. See
`apps/worker/WORKER_DESIGN_NOTES.md` for the full citation breakdown.
Worth flagging:

- **No "system actor" exists in `libs/rbac`.** Every write this milestone
  performs bypasses `RbacGuard`/`RecordLevelPolicyGuard`/`AuditLogService`
  entirely, by construction — apps/worker has no HTTP request and no
  authenticated identity to resolve an `ActorContext` from. Worker-owned
  repositories call Prisma directly, never fabricating an HTTP-shaped
  actor to satisfy guards that were never designed for a non-HTTP caller.
- **No live AWS infrastructure exists to verify against**, the same
  disclosed-gap category Cognito (Sprint 1.4) already established a
  precedent for — real SDK integration code, unit-tested against mocked
  clients, not a LocalStack/BullMQ substitute (neither document names one).
- **The user's own real `pnpm install && pnpm lint && pnpm test && pnpm
  build` run caught two genuine bugs** (13/14 projects passed first try;
  `worker` failed both `test` and `build`), both now fixed:
  `worker:test` failed because `main.spec.ts` transitively imported
  `WorkerModule`, whose `WorkerPlatformModule` calls `ConfigModule.forRoot`
  at module-load time, forcing real `AWS_REGION`/`SQS_INSIGHTS_QUEUE_URL`
  environment variables just to load the test file — fixed by moving
  `parseCommand`/`runCommand` into their own `command.ts`
  (`command.spec.ts` replaces `main.spec.ts`). `worker:build` failed with
  `TS6059` rootDir errors — apps/worker's `build` target had used
  `@nx/js:tsc` since Sprint 0, which breaks on any cross-library
  TS-path-mapped import; fixed by switching to `@nx/webpack:webpack` with
  a new `apps/worker/webpack.config.js`, mirroring `apps/api`'s own
  working config exactly (plus adding the `src/assets/.gitkeep`
  `apps/api` already had, which webpack's asset-copy step needs unlike
  `@nx/js:tsc`'s). See `WORKER_DESIGN_NOTES.md`'s "Two real bugs the
  user's own `pnpm test`/`pnpm build` run caught" section for the full
  detail. Still needs the user's own `pnpm db:generate` (the generated
  Prisma Client doesn't have the new `ProcessedEvent` model yet) and a
  fresh `pnpm test && pnpm build` to confirm both fixes hold — this
  sandbox's native `@swc/core` binding can't run Jest at all, so `command.spec.ts`
  itself has only been statically reviewed, not executed.

**apps/worker — Blueprint §10's full consumer/sweep inventory now built.**
A follow-up milestone completing the three named SQS consumers (§10.2) and
four scheduled sweeps (§10.8) the first vertical slice deliberately left
for later: `notification-consumer` (an idempotency-check-and-log stub —
still no real delivery channel is decided anywhere in the PRD/Blueprint,
exactly as flagged in advance) and `audit-consumer` (writes every
Engagement Signal to `platform.audit_log`, `action` = the signal's own
`eventType`, deliberately no `actorUserId` — a signal has a
`subjectPersonId`, not an acting `User`); `church-pulse-recompute`
(recomputes `PulseScore`/`PulseScoreHistory` for every Branch and active
Bacenta on a schedule, raising `PULSE_DECLINE` `Alert`s via the identical
logic `PulseScoreService`/`AlertService` already use compute-on-read —
the one sweep that publishes no Engagement Signal, since its `Alert`
output is already a directly queryable resource, unlike the other
sweeps' conditions); `follow-up-sla-sweep` and
`attendance-completeness-sweep` (both detect a breach via an existing
pure domain function — `isFollowUpTaskPastSla()`,
`evaluateAttendanceCompleteness()` — and publish a synthetic signal,
deliberately never mutating `FollowUpTask`/`Gathering` themselves, to
avoid conflicting with `FollowUpTaskService.escalate()`'s own
human-in-the-loop contract). See `apps/worker/WORKER_DESIGN_NOTES.md` for
the full citation breakdown. Worth flagging:

- **Automatic Follow-up task escalation-target resolution is still not
  built** — `follow-up-sla-sweep` detects and signals SLA breaches only;
  resolving *who* the organizational superior is remains the same
  unresolved gap `FollowUpTaskService`'s own doc comment already named.
- **Both new sweep jobs re-publish every run for as long as the
  underlying condition persists** — no schema entity exists for either to
  check "was this already signaled" against, unlike `SilentDriftFlag`'s
  own dedup mechanism. A disclosed trade-off, not a missing feature.
- **This sandbox's own `tsc --noEmit`, `npx nx lint worker`, and
  `npx nx build worker` all ran to completion with zero errors this
  round** (the prior milestone's one remaining error — a stale generated
  Prisma Client missing `ProcessedEvent` — has since resolved). One real
  lint error was caught and fixed (`no-empty-object-type` on an
  interface with no new members). `npx nx test worker` still cannot run
  in this sandbox at all (the same native `@swc/core` binding failure) —
  needs the user's own `pnpm test`, plus a `.env` update adding
  `SQS_NOTIFICATION_QUEUE_URL`/`SQS_AUDIT_QUEUE_URL`, to confirm.
- **`[Stewardship gaps sprint]` Two more sweeps added**:
  `flagged-transaction-sla-sweep` (`sweep:flagged-transaction-sla`, same
  "detect and signal, never mutate" shape as `follow-up-sla-sweep` — the
  same underlying reason, an FK constraint this time rather than a missing
  business parameter) and `pledge-reminder-sweep`
  (`sweep:pledge-reminder` — the first sweep in this codebase that safely
  mutates, since `Pledge.reminderSentAt` has no actor FK, giving it a real
  persisted dedup marker the other sweeps lack). `tsc --noEmit` (both app
  and spec configs) ran clean in this sandbox for both. See
  `WORKER_DESIGN_NOTES.md`'s own new section for the full reasoning.

**Design System & UX Foundation v1.0 — complete (document only, no code).**
`docs/Ecclesia_Design_System_UX_Foundation_v1.0.md` is the product design
architecture `apps/web-admin` and `apps/mobile` will be built against —
product philosophy and anti-goals, all eight personas the user requested
(mapped explicitly onto PRD §11's named personas, with "Branch Pastor,"
"Council Administrator," and "Super Administrator" flagged as not present
in the PRD/Blueprint and either mapped to the nearest cited role or
designed from product judgment and marked as such), separate Web Admin
and Mobile information architectures traced back to PRD §16's own surface
tables, the five-zone dashboard model applied to every persona, visual
language, design tokens, a 24-component library, cross-cutting UX rules,
the mobile offline-first experience, data-visualization standards, an AI
Experience Part that is explicit about the gap between the PRD's actual
(deterministic, rule-based) Insights engine and the brief's request for
generative "AI summaries"/"conversation panels," and a governance model
for keeping the system one system as it grows. Every design decision
traces to a PRD/Blueprint citation or is explicitly marked
**[Design decision — not sourced]**; a citation-accuracy pass corrected
several section-number errors (silent-drift's decision tree is PRD §15.8,
not §12.9; Church Pulse's computation model is §12.8; several `FR-*`
citations had no section number and now cite PRD §13 correctly) before
this was considered done. **Next milestone** (not yet started, per the
user's stated sequencing): implement `apps/web-admin` and `apps/mobile`
screen-by-screen against this document, so each screen is built once and
consumed consistently by both platforms.

**UI Foundation — tokens, theme, icons, and a 12-component base slice
complete on both platforms (Sprint "0" for the design system).**
`libs/ui/{tokens,core,web,native}` implement the design tokens, theme
system, and icon strategy from the Design System document above as real
code, plus 12 of its 23 base components (`Text`, `Heading`, `Button`,
`Card`, `Badge`, `Avatar`, `Input`, `Divider`, `Spinner`, `Skeleton`,
`EmptyState`, `ErrorState`) on both `@ecclesia/ui-web` (React DOM) and
`@ecclesia/ui-native` (React Native), sharing one `Theme` object and one
icon registry (`lucide`) so a design decision made once is correct on
both platforms by construction. Module boundaries were tightened
alongside this (`scope:app-backend`/`scope:app-web`/`scope:app-native`
replacing a single `scope:app` tag) so a NestJS backend service
structurally cannot import React/RN UI code. `apps/web-admin` and
`apps/mobile`'s Sprint 0 placeholder screens were both updated to render
through their platform's package (`ThemeProvider` + `Heading` + `Text` +
`Card` + `Badge` + `Button`), proving the acceptance criterion that both
apps consume the same tokens/primitives with platform-specific
implementations — these are explicitly still non-product showcase
screens, not real dashboards. **Explicitly deferred** (documented, not
omitted): 11 base components (`TextArea`, `Checkbox`, `Radio`, `Select`,
`Switch`, `Toast`, `Tooltip`, `Modal`, `Drawer`, `Tabs`, `Accordion`) and
all Navigation/Data/Layout components — see
`libs/ui/UI_DESIGN_NOTES.md` for the full inventory, planned
composition, and rationale for sequencing them after this foundation
slice. **`[Stewardship gaps sprint]` `Modal` is now built** (both
platforms, `libs/ui/{web,native}/src/lib/Modal`) — picked as the one
component to build out of the deferred eleven, the most-cited real
blocker (Stewardship's own pages had resorted to inline `Input`+`Button`
workarounds for lack of it). `tsc --noEmit` ran clean on all four
`libs/ui/{web,native}` configs. The remaining 10 base components and
every Navigation/Data/Layout component are still deferred — see
`UI_DESIGN_NOTES.md`'s own "Modal — resolved" section for the full
citation. Verified in-sandbox via `npx tsc --noEmit` on every new package
and both apps (all clean except the expected "module not found" for
`lucide-react`/`lucide-react-native`, which aren't installed in this
sandbox — no npm registry access here); `npx nx lint`/`build` could not
be used for this sprint's later files after an `npx nx reset` made the
Nx project graph itself unreliable in this sandbox (unrelated to the new
code — see `libs/ui/UI_DESIGN_NOTES.md` §11).

**Confirmed on the user's real machine: `pnpm lint` (18/18), `pnpm
build` (18/18), and `pnpm test` for `ui-web` (43/43), `ui-native`
(32/32), and `mobile` (1/1) all pass.** Getting there surfaced and fixed
several real bugs the sandbox's `tsc --noEmit`-only verification
couldn't catch:

- `libs/ui/core` (and `ui-web`/`ui-native`, which both import it) is the
  first library in this repo imported by *another library's* `@nx/js:tsc`
  build, not just by an app. That executor computes each project's
  `rootDir` from its own project directory unless a matching
  `package.json` exists at the dependency's root (its cross-library
  path-remapping keys off that file's `name` field, silently no-op
  otherwise) — none of this repo's libraries had one before, since none
  had ever been a build-time dependency of another library. Added a
  minimal `package.json` to all four `libs/ui/*` packages; traced the
  exact mechanism by reading `@nx/js`'s own executor source rather than
  guessing (two earlier guesses — `buildLibsFromSource: false`, an
  explicit tsconfig `rootDir` — were tried, confirmed ineffective by
  reading the source, and reverted).
- `libs/ui/native` needed its own `babel.config.js` (Babel resolves
  config from the nearest ancestor with a `package.json`, so once that
  package.json existed for the fix above, it stopped inheriting
  `apps/mobile`'s config for Flow-syntax stripping in RN's own polyfills).
- `lucide-react-native` ships ESM at the `exports` condition Jest's
  React-Native-aware resolution picks, which RN's Jest preset transform
  never matches by extension — added a `moduleNameMapper` redirect to
  the package's own CJS build in both `apps/mobile` and `libs/ui/native`'s
  jest configs.
- Three native-component tests had real bugs: `Divider`/`Skeleton`
  need `{ includeHiddenElements: true }` on `getByTestId` since RN
  Testing Library excludes `accessibilityElementsHidden` elements from
  default queries the same as it would for a screen reader; `Icon`'s
  test asserted a single label match when lucide's SVG output legitimately
  produces more than one; `useReducedMotion` didn't guard against
  `AccessibilityInfo.isReduceMotionEnabled()` returning `undefined`
  (rather than a rejected promise) under Jest's mocked RN environment.
- Excluding `test-setup.ts` from `tsconfig.lib.json` (needed so the
  `jest.mock(...)` call above type-checks — that file's global `jest`
  namespace isn't declared there) orphaned it from every tsconfig's
  `include`, which `nx build`/`tsc` tolerate but `nx lint`'s type-aware
  ESLint parser does not ("was not found by the project service").
  Fixed by adding it to `tsconfig.spec.json`'s `include` instead of just
  excluding it everywhere - it now belongs to exactly one project, the
  one that already declares `"jest"` in its `types`.

**Final state, confirmed on the user's real machine: `pnpm lint`,
`pnpm build`, and `pnpm test` all pass 18/18.**

**Shepherd Dashboard — the first complete vertical slice (product
screen, not a component showcase).** `apps/mobile`'s root now renders
the Shepherd's Bacenta dashboard (PRD §16.2: *"the single most important
screen in the product"*), built end-to-end — real API integration, real
loading/empty/error states per card, real tests — rather than a
tokens/components acceptance demo. Full spec (user story, information
architecture, component tree, data requirements, API integration, UX/
responsive spec) lives in
`apps/mobile/src/app/screens/ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`.
Composed entirely from the 12 `@ecclesia/ui-native` components that
actually exist (not the 23 the sprint brief assumed — see that file's
§0) — Church Pulse, active follow-ups + silent-drift flags ("needs your
attention," §16.2's own framing), next Bacenta Meeting, last meeting's
attendance, the two NFR-PERF-01 quick actions, notifications, and
recent activity, each card fetching, loading, and failing independently.

Real backend gaps surfaced and fixed, not worked around: three
`BACENTA_LEADER`/`OWN_GROUP` permission-matrix rows existed for
create/update but not read (`gatherings.gathering.read`,
`gatherings.attendance.read`, `pastoral_care.followup_task.read`) — a
Shepherd could record data but never read it back through those routes.
Three endpoints the PRD names as surfaces but that never existed were
added, following existing module conventions exactly (repository →
service → guard → controller, Zod contracts, `[INFERRED]`-disclosed RBAC
rows): `GET /pastoral-care/groups/:groupId/silent-drift-flags` (this
codebase's first HTTP read path for `SilentDriftFlag` rows, which
`apps/worker`'s nightly sweep has written since the Insights milestone),
`GET /pastoral-care/groups/:groupId/follow-up-tasks` (§16.2's "sorted by
SLA urgency" queue), and `GET /gatherings?ownerGroupId=...` (no prior way
to find "my Bacenta's next meeting" without already knowing its id).

No new `libs/ui/native` base component was added (the brief's own "do
not recreate components" rule) and no navigation library or sign-in flow
was built (out of scope — "do not build anything except the Shepherd
Dashboard"); both are disclosed, scoped-out gaps with a stub seam
(`lib/session.ts`, `QuickActionsRow`'s `onPress` callbacks) ready for a
future sprint, not silently missing functionality. Verified in-sandbox
via `npx tsc --noEmit` across every changed/new project (`libs/contracts`,
`libs/rbac`, `apps/api` app + spec, `apps/mobile` app + spec) — all
clean, including one genuine pre-existing, unrelated type error in
`apps/api/src/modules/people/repositories/role-assignment.repository.spec.ts`
(confirmed via `git status` to predate this sprint, left as-is). Needs
the user's real machine for `pnpm lint`/`pnpm test`/`pnpm build` and, for
the dashboard's data to actually populate, a running `apps/api` +
`apps/worker` + Postgres stack — this sprint did not touch the
Engagement Signal ingestion gap `INSIGHTS_DESIGN_NOTES.md` already
discloses.

**Application Shell — `apps/web-admin` is now the real product, not the
UI Foundation showcase.** The showcase entry page is gone; `/` now
redirects to a real login screen or the Resident Pastor's Branch
dashboard, behind a persistent sidebar/top-bar application shell
(`AppShell`, `libs/ui/web`'s new `Sidebar`/`TopBar`/`Breadcrumbs`/
`UserMenu`/`NotificationBell`). Full reasoning, including every
`[Design Decision]`, lives in
`apps/web-admin/src/app/APPLICATION_SHELL_DESIGN_NOTES.md`.

No routing library or Cognito client SDK exists anywhere in this
workspace and none could be installed (confirmed: no package-registry
network access in this sandbox) — both are hand-built on raw `fetch`/the
History API (`app/router/router.tsx`, `app/auth/cognito-client.ts`),
mirroring `apps/mobile`'s own no-dependency `api-client.ts` precedent.
Login is email + password + mandatory TOTP MFA (Blueprint §8.2's
documented method for Web Admin's real primary personas — Treasurer,
Assistant Pastor, Resident Pastor, Admin), not the Shepherd's phone+OTP;
the Shepherd's own dashboard stays on mobile, with a web-admin visitor
who holds that role pointed there instead of shown a fabricated screen.

One real backend gap was found and fixed: no route ever returned a
client's own resolved `ActorContext` (Cognito's tokens carry no role
claim in this system — `ActorContextResolverService` computes it entirely
server-side per-request). Added `GET /auth/me` — a direct read of the
same `ActorContext` `@CurrentActor()` already exposes everywhere else, no
new business logic, protected by the existing global `AuthGuard`.

Only the Resident Pastor's Branch dashboard is fully built this sprint
(Design System §4.3's own spec for that persona, reusing the
already-existing `GET /insights/branch-dashboard` and
`PATCH /insights/alerts/:id/resolve`); every other domain route
(People, Pastoral Care, Ministry, Gatherings, Stewardship, Insights) is
an explicitly-labelled stub reachable from the real sidebar, and
Configuration is further gated to Admin/Council Overseer roles. The
spec's "forward alert to Assistant Pastor" quick action has no backing
endpoint anywhere in `apps/api` and was deliberately not built rather
than faked. Needs the user's real machine for `pnpm lint`/`pnpm test`/
`pnpm build` (not yet run anywhere this sprint) and a real, provisioned
Cognito User Pool before the login screen can be exercised end-to-end.

**People — the first domain page built on the Application Shell.** The
`/people` stub is replaced with a real, role-scoped directory
(`PeopleListPage`, search + list) and a Person profile view
(`PersonDetailPage`, current fields + full Bacenta/Basonta and
Role-Assignment history — FR-PPL-07's "complete, queryable history...
including closed/past ones"). Full reasoning, including every
`[Design Decision]`, lives in
`apps/web-admin/src/app/pages/People/PEOPLE_PAGE_DESIGN_NOTES.md`; the
backend-side gaps it depends on are documented in
`apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`'s "Resolved (People
Web Admin sprint)" section.

Three real backend read-path gaps were found and fixed, not worked
around: `GET /people` (PRD §16.1's "Search & directory" capability had no
backing route at all), `GET /people/:personId/group-memberships`, and
`GET /people/:personId/role-assignments` (both controllers previously had
a write-only `POST`). One RBAC bug fix rode along —
`people.role_assignment.read` granted ADMIN only, even though
RESIDENT_PASTOR/ASSISTANT_PASTOR both already hold `.grant`/`.update` for
the same resource; matching `.read` rows were added at the same scopes.

The hand-built client-side router (`app/router/router.tsx`, no
`react-router-dom` available in this workspace) gained its first dynamic
path segment — `/people/:id` — via a new `matchPath`/`useParams`
extension, kept deliberately minimal (one `:param` per path, no nesting,
no wildcards). `ProtectedRoute` was refactored to derive its own current
path via `useLocation()` instead of taking a hardcoded `path` prop, fixing
a post-login-redirect bug a param route would otherwise have hit (a
literal, non-existent `/people/:id` URL rather than the real
`/people/abc-123` the user actually requested).

This sprint is read-only: no New Person intake form, no duplicate
resolution queue UI, no Bacenta/Basonta reassignment flow — all explicitly
deferred (`PEOPLE_PAGE_DESIGN_NOTES.md` §9). Needs the user's real machine
for `pnpm lint`/`pnpm test`/`pnpm build` (not yet run anywhere this
sprint).

**Pastoral Care — the Follow-up Task Queue.** The `/pastoral-care` stub
is replaced with `FollowUpTaskQueuePage` (PRD §16.2's "Follow-up task
queue... sorted by SLA urgency" surface), role-scoped the same way
People's directory is, with subject/assignee names resolved per row and a
**Complete** quick action (`PATCH /follow-up-tasks/:id/complete`, the
same no-payload-`PATCH` pattern the Resident Pastor dashboard's alert
**Resolve** action already established). Full reasoning lives in
`apps/web-admin/src/app/pages/PastoralCare/PASTORAL_CARE_PAGE_DESIGN_NOTES.md`.

Two real backend gaps were found and fixed: `pastoral_care.followup_task.read`
had create/update rows for ASSISTANT_PASTOR but no read row at all — the
exact persona PRD §16.2 names for this surface could never `GET` a task
back, single or list — and `GET /pastoral-care/groups/:groupId/follow-up-tasks`
was Group-scoped only, with no BRANCH-wide route for RESIDENT_PASTOR/ADMIN
to list against, the identical shape of gap the People sprint closed for
`GET /people`. Added the missing RBAC row and a new
`GET /pastoral-care/follow-up-tasks` endpoint (optional `groupId`, BRANCH
fallback when absent).

Escalate, Silent-drift flags, Pastoral notes, and the Poimen tracker are
explicitly out of scope this pass — Escalate needs a Person picker that
doesn't exist yet, and the rest belong to a different surface or sprint
(`PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §9). Needs the user's real machine
for `pnpm lint`/`pnpm test`/`pnpm build` (not yet run anywhere this
sprint).

**Ministry — the Basonta directory and roster view.** The `/ministry`
stub is replaced with a role-routed page (`MinistryPage`): a Basonta
Leader goes straight to their own roster, while Resident Pastor/Admin see
a new Basonta directory (`BasontaDirectoryPage`) that drills into any
Basonta's roster at `/ministry/:groupId` (`BasontaRosterView`) — current
workers plus an inline "Overcommitted" badge (FR-MIN-01/FR-MIN-04). Full
reasoning lives in
`apps/web-admin/src/app/pages/Ministry/MINISTRY_PAGE_DESIGN_NOTES.md`.

Two real backend gaps were found and fixed: none of the seven `ministry.*`
actions had an ADMIN row at any scope, even though every other domain
grants ADMIN the same BRANCH row Resident Pastor holds — added it to the
three read actions this page needs. And there was no way to enumerate
Groups at all — every roster route requires an already-known `groupId`,
and no endpoint could list one. Added `GET /groups` (optional `type`
filter) to the People module, since Groups are People-schema-owned —
reused by Ministry rather than duplicated.

Staffing Targets and Worker Availability self-service are explicitly out
of scope this pass — targets are keyed to a specific Gathering with no
Gathering picker built yet, and availability is a `SELF`-scoped
self-service flow for Workers/Members, not this oversight-role page's
job (`MINISTRY_PAGE_DESIGN_NOTES.md` §4/§5/§10). Needs the user's real
machine for `pnpm lint`/`pnpm test`/`pnpm build` (not yet run anywhere
this sprint).

**Gatherings — the Gathering calendar.** The `/gatherings` stub is
replaced with `GatheringsListPage` (PRD §16.4's "upcoming and past
Gatherings, filterable by type and Group"), role-scoped the same way the
prior three domain pages are, with a type filter and an inline
attendance-completeness badge (`AttendanceCompletenessBadge`) on every
past Gathering — a per-row substitute for the Branch-wide completeness
*report* PRD §16.4 names, since no aggregate endpoint exists yet. Full
reasoning lives in
`apps/web-admin/src/app/pages/Gatherings/GATHERINGS_PAGE_DESIGN_NOTES.md`.

Two real backend gaps were found and fixed: `GET /gatherings` had no
BRANCH-wide case at all (`ownerGroupId` was required, so neither a
BRANCH-scoped actor nor a Branch-wide Gathering like Sunday Service could
ever appear in a list) — the same shape of gap closed for `GET /people`,
`GET /pastoral-care/follow-up-tasks`, and `GET /groups` in the three
sprints before this one. And `gatherings.gathering.read`/
`gatherings.attendance.read` both had ADMIN missing despite already
holding `.create`/`.update` — the same class of bug fixed for
BACENTA_LEADER on these same two actions back in the Shepherd Dashboard
sprint.

Attendance Capture and Visitor Intake are explicitly out of scope this
pass — both are Usher-primary, mobile-optimized workflows, and
`GATHERINGS_DESIGN_NOTES.md` already discloses that no `USHER` role
exists in the RBAC catalog at all, a structural blocker a web-admin page
can't route around (`GATHERINGS_PAGE_DESIGN_NOTES.md` §5). Needs the
user's real machine for `pnpm lint`/`pnpm test`/`pnpm build` (not yet run
anywhere this sprint).

**Stewardship — the verification and approval queues.** The
`/stewardship` stub is replaced with `StewardshipPage` (PRD §16.5's
"Financial Transaction verification queue" and "Expense approval
queue"), two `Card` sections on one page rather than the single-list
shape every prior domain page used, since both underlying list endpoints
resolve to the same fixed Branch-wide scope regardless of role (no
`resolveDefaultXQuery(actor)` resolver exists here — a first for this
sprint sequence). Verify/Flag/Escalate/Reconcile on Financial
Transactions and Approve/Reject/Pay on Expenses are all built, gated per
row on the transaction's own `currentState`; Flag/Reject reveal an inline
reason field (no `Modal` component exists in `libs/ui/web`, same
constraint every prior sprint operated under). Full reasoning lives in
`apps/web-admin/src/app/pages/Stewardship/STEWARDSHIP_PAGE_DESIGN_NOTES.md`.

One real backend gap was found and fixed: `GET /expenses` didn't exist at
all — the same shape of gap closed for `GET /people`, `GET
/pastoral-care/follow-up-tasks`, `GET /groups`, and `GET /gatherings`'s
BRANCH fallback in the four sprints before this one. Unlike every one of
those, no ADMIN permission row was added this sprint: auditing the full
Stewardship section of `permission-matrix.ts` found ADMIN holds *zero*
rows anywhere in the domain, which reads as a deliberate
separation-of-duties boundary (configuration authority shouldn't imply
visibility into a Branch's money — the same reasoning Blueprint §9.3
already applies to `pastoral_care.notes.*`), not an oversight to
mechanically patch. See `STEWARDSHIP_DESIGN_NOTES.md`'s "Resolved
(Stewardship Web Admin sprint)" section for the full disclosure.

Record Financial Transaction / Request Expense (both need a Group picker
that doesn't exist), Attach Receipt (restricted to the original requester
and needs a file-upload flow that doesn't exist anywhere in this
codebase), and the Project/Pledge surfaces (no list endpoint exists for
either yet) are explicitly out of scope this pass
(`STEWARDSHIP_PAGE_DESIGN_NOTES.md` §4). Needs the user's real machine for
`pnpm lint`/`pnpm test`/`pnpm build` (not yet run anywhere this sprint).

**Insights — the sixth and final domain page.** The `/insights` stub is
replaced with `InsightsPage`, a role router rather than a single view:
`RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` reuse `ResidentPastorDashboard`
directly (the same Branch-wide component already built for the
`/dashboard` landing screen — PRD §16.6 and Design System §3.3 both name
this as the same capability reachable from two nav entries, not two
features); `ADMIN` gets a new read-only `AdminInsightsView` (Church Pulse
+ alerts with no Resolve action, since `permission-matrix.ts` grants
Admin `insights.alert.read` but not `.resolve`); `ASSISTANT_PASTOR` gets
a new `ClusterInsightsView` with a Bacenta-picker chip row built from
`ActorContext.clusterBacentaIds` (no new picker component needed — the
full list was already on the actor); `BACENTA_LEADER`/`BASONTA_LEADER`
see the same "lives on mobile" message `/dashboard` already uses for
them, per Design System §3.3 placing the Shepherd's Bacenta pulse view on
mobile only; every other role sees an honest "not available" message.
Full reasoning lives in
`apps/web-admin/src/app/pages/Insights/INSIGHTS_PAGE_DESIGN_NOTES.md`.

Unlike every prior sprint, **no backend gap-filling was needed** —
`apps/api/src/modules/insights` (branch/cluster/bacenta dashboards, alert
read/resolve, every RBAC row) was already fully built and wired before
this sprint started. This was a frontend-only sprint: two small,
backward-compatible prop additions (`ChurchPulseCard.scopeLabel`,
`AlertPriorityCard.readOnly`, both defaulting to preserve
`ResidentPastorDashboard`'s existing behavior exactly) let the new views
reuse the existing dashboard cards instead of duplicating them.

FR-INS-02's weight-configuration screen (H2, no backend endpoint exists
to write it), a true multi-Bacenta ranked-list cluster view (US-G2, the
backend has no such endpoint), and Person-level Church Pulse (NFR-PRIV-02
hard gate) are explicitly out of scope, all already-disclosed backend
limitations with nothing new for this page to add
(`INSIGHTS_PAGE_DESIGN_NOTES.md` §7). Needs the user's real machine for
`pnpm lint`/`pnpm test`/`pnpm build` (not yet run anywhere this sprint).

This completes all six PRD §16 domain pages in `apps/web-admin`
(People, Pastoral Care, Ministry, Gatherings, Stewardship, Insights).
Configuration was already built in an earlier sprint.

**Development Authentication — a local-only bypass for AWS Cognito, not a
change to production auth.** With every backend module, RBAC, and every
Web Admin page built, there was still no practical way to log in and
exercise any of it: no Cognito User Pool/App Client/seeded users have
ever been provisioned (`AUTH_DESIGN_NOTES.md`'s long-standing "known
sandbox limitation"). This sprint adds a second `TokenVerifierService`
implementation, `DevAuthService` (`apps/api/src/platform/auth`), that
`AuthGuard` can be wired to instead of `CognitoVerifierService` — never
both, never as a fallback, selected once at boot by `AUTH_MODE`
(`auth-mode.ts`'s `computeAuthMode`/`assertAuthModeIsSafe`, defaulting to
`development` locally and `cognito` in production, and structurally
refusing to boot with `AUTH_MODE=development` when `NODE_ENV=production`
even if explicitly set). `AuthModule` is now a dynamic module
(`AuthModule.register()`) so the *unchosen* mode's provider/controller
are never even added to the DI container or HTTP router — in
`AUTH_MODE=cognito`, `DevAuthController`'s routes 404 the same way a
route that was never written would, satisfying "the development provider
must disappear completely" structurally, not just behaviorally.

Six seeded personas (`dev-users.ts`'s `DEV_USER_SEEDS`, matching the
brief's own roster: Resident Pastor, Assistant Pastor, Treasurer, Basonta
Leader, Council Administrator → `COUNCIL_OVERSEER`, Super Administrator →
`ADMIN`) are real `Person`/`User`/`RoleAssignment` rows
(`db/seed-dev-users.ts`, run via `pnpm db:seed:dev`, refuses to run when
`NODE_ENV=production`) — every request they make still passes through the
same `ActorContextResolverService.resolve()` → RBAC → permission-matrix
pipeline a real Cognito-authenticated request does. `LoginPage` renders a
password-less role picker instead of the Cognito form only when
`GET /auth/mode` (new, `@Public()`) reports `development` — a fact the
client reads, never sets. Also fixed as an in-scope prerequisite: every
existing `apps/web-admin` API call was missing the `/v1` URI-versioning
prefix `main.ts` requires of every route (`api-client.ts`'s
`API_BASE_URL`), which meant no frontend request had ever actually
reached a real running backend before this sprint. Full design,
environment variables, and how to switch back to Cognito:
`apps/api/src/platform/auth/DEVELOPMENT_AUTHENTICATION_GUIDE.md`.

**A CORS bug, found live.** With `apps/web-admin` and `apps/api` both
actually running for the first time (Development Authentication sprint), the
login page silently fell back to the Cognito form instead of the development
role picker — not an RBAC or auth-mode bug, but `apps/api` having no CORS
configuration at all, so the browser blocked every cross-origin response
(including `GET /auth/mode` itself) before any application code ever ran.
Fixed with `computeCorsOrigins()` (`apps/api/src/platform/config/cors.ts`),
wired into `main.ts`'s `app.enableCors()`: a new optional `CORS_ORIGIN` env
var, defaulting to `http://localhost:4200` when unset and `NODE_ENV=development`,
required explicitly for any other environment. No PRD/Blueprint section names
CORS at all — a genuine, undocumented gap, disclosed in
`apps/api/src/platform/auth/DEVELOPMENT_AUTHENTICATION_GUIDE.md`'s own new
section rather than silently patched.

**Mobile Application Shell + Attendance Capture — `apps/mobile` is now a
real multi-screen app, not one hardcoded screen.** The Shepherd Dashboard
sprint explicitly scoped out navigation, sign-in, and every screen beyond the
dashboard itself. Reaching the dashboard's own "Take Attendance" quick action
for real required closing all three at once — mirroring `apps/web-admin`'s
own "Application Shell" sprint before any domain page was built on it. Full
reasoning lives in
`apps/mobile/src/app/screens/AttendanceCapture/ATTENDANCE_CAPTURE_DESIGN_NOTES.md`.

A minimal dependency-free stack navigator (`app/navigation/Navigator.tsx`) and
a Development-Auth-only sign-in flow (`app/auth/AuthContext.tsx` +
`app/screens/Login/LoginScreen.tsx`, reusing the same `/auth/dev/*` routes
`apps/web-admin` already uses in development) replace the placeholder
`lib/session.ts` the Shepherd Dashboard sprint left in place — exactly the
seam that sprint's own design notes predicted a real sign-in flow would
replace. No `react-navigation` or Cognito/phone+OTP UI exists in this app;
both are disclosed gaps, not silent substitutions (pointed at a Cognito-mode
API, the app shows an explanatory screen, not a broken form). `api-client.ts`
gained its first `POST` support and the same `/v1` URI-versioning prefix fix
`apps/web-admin` needed in the Development Authentication sprint.

Attendance Capture itself needed **zero new backend endpoints** — an early
research pass concluded a new roster endpoint was needed, corrected on direct
inspection: `GET /people?groupId=` (People Web Admin sprint) already returns
full roster data with names, and `BACENTA_LEADER` already holds
`people.person.read` at `OWN_GROUP` scope. Every read and the record-save
action reuse existing, unmodified endpoints; N parallel single-record
`POST /gatherings/:id/attendance-records` calls (keyed on the DB's own
`@@unique([gatheringId, personId])`) replace what would otherwise have been a
new bulk-record endpoint. Verified in-sandbox via `npx tsc --noEmit` across
`apps/mobile/tsconfig.app.json` and `tsconfig.spec.json` — both clean;
`eslint`/`jest` could not run in this sandbox (pre-existing, disclosed
limitations — see the design notes' own §7). Needs the user's real machine
for `pnpm lint`/`pnpm test`/`pnpm build`.

**Row-Level Security — activated, closing Open Question #3.** Blueprint
§7.3's RLS policies (`db/migrations/20260801000000_.../migration.sql`) have
existed since the Database Foundation milestone but never enforced
anything at runtime — every connection so far used `ecclesia`, the
table-owning role, and Postgres always lets an owner bypass RLS. This
milestone closes both gaps a real enforcing setup needs: a new migration
(`20260801050000_row_level_security_enforcement`) creates `ecclesia_app`, a
non-owner Postgres role with ordinary CRUD grants and no `BYPASSRLS`; and
both `apps/api` and `apps/worker` now connect their everyday `PrismaService`
via that role (`APP_DATABASE_URL`, new required env var) instead of
`DATABASE_URL`, wrapping every unit of work — one HTTP request
(`apps/api`'s new `BranchScopeInterceptor`, this codebase's first
`NestInterceptor`), one SQS message, or one Branch inside a nightly sweep
— in a Prisma interactive transaction that runs `SET LOCAL
app.current_branch_id = '<uuid>'` before anything else, the session
variable every RLS policy's `USING` clause reads. **Zero repository files
change** — every existing `this.prisma.<model>.<method>(...)` call
transparently starts resolving to the branch-scoped transaction via an
`Object.defineProperty` redirect on `PrismaService`'s own model-delegate
properties (deliberately not a whole-instance `Proxy` — a real,
empirically-confirmed risk with recent Prisma Client versions' internal
use of private class fields). A new, narrowly-scoped `PrismaRootService`
(reusing the unchanged, owner-role `DATABASE_URL`) covers the three
call sites that structurally cannot know a Branch in advance because
discovering it *is* their job: `ActorContextResolverService`/`DevAuthService`
(`apps/api`, resolving `cognitoSub` → Person → Branch pre-authentication)
and every sweep job's `listBranches()` (`apps/worker`, via a new
`BranchDirectoryRepository`). Full design in
`db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md`. Worth flagging:

- **Built and `tsc --noEmit`-verified in a sandbox with no PostgreSQL, no
  Docker, and no working Jest for either app** (`@swc/core`'s native
  binding fails to load here — pre-existing, same limitation
  `WORKER_DESIGN_NOTES.md` already discloses). Every architectural
  decision — the `Object.defineProperty`-not-`Proxy` choice, the
  `PrismaRootService` bootstrap split — was verified against this exact
  installed Prisma Client version's real property shapes via direct
  in-sandbox Node scripting, not assumed. **None of this has run against a
  real database.** `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §8 is an 8-step
  manual verification procedure — including a `psql`-direct proof that an
  unscoped query against `ecclesia_app` genuinely fails — that must be run
  on the user's own machine before this is trusted anywhere real.
- **A latent DI-reachability bug predating this sprint, found and fixed
  along the way**: three of `apps/worker`'s sweep repositories already
  injected `PrismaService` from a Nest module that could never actually
  resolve it (their module only imported `EventsModule`, which never
  re-exported `WorkerDatabaseModule`) — a runtime-only failure `tsc`
  cannot detect, invisible until an actual app boot. Fixed by having
  `EventsModule` re-export `WorkerDatabaseModule` as a whole, which this
  sprint's own new `SqsConsumerBase` → `PrismaService` wiring needed
  anyway.
- **No `GLOBAL`-scope carve-out built** — confirmed via a grep of the live
  `libs/rbac/src/lib/permission-matrix.ts` that zero rows use `scope:
  'GLOBAL'` today, so scoping every request to `actor.branchId` is
  unconditionally correct against everything the RBAC layer can currently
  grant. Flagged as a known follow-up for whenever a real GLOBAL-scoped
  rule is added (`COUNCIL_OVERSEER` exists as a persona but has no
  permission-matrix rows at all yet).
- **A disclosed tradeoff, not a bug**: wrapping a whole unit of work in one
  transaction means external I/O inside it (e.g.
  `EventBridgePublisherService.publish()` mid-sweep) happens while a
  Postgres transaction is open. Mitigated with a 15-second transaction
  timeout (Prisma's default is 5s); the structural fix — narrowing
  transactions to only their DB statements — would need per-handler
  restructuring across roughly 40 endpoints and is out of scope here.

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
