# apps/worker — design notes

Read this alongside `db/DESIGN_NOTES.md`'s "Worker milestone" entry (the
`platform.processed_events` table), `db/migrations/README.md`'s entry 5,
and every other domain module's own `*_DESIGN_NOTES.md` for the "no
scheduler/event-bus exists yet" gap each one flagged - this milestone is
what starts closing that gap. Same discipline as every prior sprint: every
design choice cites the Blueprint/PRD section it comes from, or is
explicitly flagged as inferred/unresolved.

## Scope: "Foundation + one full vertical slice first" (user-directed phasing)

Blueprint Ch.4/§10 describes three SQS consumers (`insights-consumer`,
`notification-consumer`, `audit-consumer`) and §10.8 names four scheduled
sweep jobs (Church Pulse recompute, silent-drift, follow-up SLA,
attendance-completeness). Rather than stub all seven at once, this
milestone builds the shared platform layer plus **one full, real,
end-to-end path** - one consumer (`insights-consumer`) and one sweep job
(`silent-drift-sweep`) - to prove the pattern works before repeating it.
The remaining two consumers and three jobs are **deliberately deferred to
a follow-up milestone**, not an oversight - see "What this milestone
deliberately does not build" below.

`insights-consumer` and `silent-drift-sweep` were not arbitrary picks:

- `insights-consumer` is the simplest possible consumer - Blueprint §4.3
  rule 3 already establishes that Insights ingests the *entire* Engagement
  Signal stream unfiltered, and `EngagementSignalService.record()`
  (`apps/api/src/modules/insights`) already exists as "the landing point
  that future consumer would call once it exists," per its own doc
  comment - the smallest possible gap to close first.
- `silent-drift-sweep` was the most-cited dormant piece in the whole
  codebase: `evaluateSilentDrift()` (`libs/domain/pastoral-care`) has had
  zero real callers since the Pastoral Care milestone, and
  `GATHERINGS_DESIGN_NOTES.md`'s own "what this milestone deliberately
  does not build" section names this exact gap by name.

## Follow-up milestone: the remaining two consumers + three sweep jobs

With the first vertical slice confirmed working end-to-end (real
`pnpm install && pnpm lint && pnpm test && pnpm build`, 14/14 projects),
this follow-up milestone completes Blueprint §10's full inventory:
`notification-consumer` and `audit-consumer` (§10.2's remaining two named
SQS consumers), and `church-pulse-recompute`, `follow-up-sla-sweep`, and
`attendance-completeness-sweep` (§10.8's remaining three scheduled
sweeps). Same repository/module-per-consumer-or-job shape the first slice
established - `src/consumers/notification`, `src/consumers/audit`,
`src/jobs/church-pulse-recompute`, `src/jobs/follow-up-sla-sweep`,
`src/jobs/attendance-completeness-sweep` - each with its own worker-local
repository (own Prisma queries, not a cross-app import) and its own spec
file. `command.ts`'s `WorkerCommand` union grew from 2 to 7 values;
`worker.module.ts` now imports all eight consumer/job modules
unconditionally, same "one image, `command` varies per ECS task" reasoning
as before.

### `notification-consumer`: still only a stub, restated

`NotificationConsumer.handle()` logs the envelope and does nothing else -
the idempotency check `SqsConsumerBase` already performs is the only
real behavior. This isn't newly discovered scope-creep avoidance; it's
exactly what `WORKER_DESIGN_NOTES.md`'s first-slice "What this milestone
deliberately does not build" section already predicted for this consumer
("can only be an idempotency-check-and-log stub... a genuinely undecided
open question, not an oversight"), now built exactly as predicted.

### `audit-consumer`: every signal, no `actorUserId`

Writes one `platform.audit_log` row per Engagement Signal
(`action` = the envelope's `eventType`, `resourceType` =
`'EngagementSignal'`, `resourceId` = the envelope's `eventId`). Never
populates `actorUserId` - every existing audit-log writer
(`AuthGuard`, `RbacAuditInterceptor`) records the `platform.users` row
responsible for the event; an Engagement Signal has no such actor, only a
`subjectPersonId` (who the signal is *about*, not who caused it). See
`AuditConsumer`'s own doc comment for why conflating the two would
misrepresent what the envelope means.

### `church-pulse-recompute`: the only new job that publishes nothing

Recomputes `PulseScore`/`PulseScoreHistory` for every Branch and every
active Bacenta on a schedule (Blueprint §10.8), and raises `PULSE_DECLINE`
`Alert`s via the identical `evaluatePulseTrend()`/dedup logic
`apps/api`'s `PulseScoreService`/`AlertService` already use
compute-on-read. **Deliberately publishes no synthetic Engagement
Signal** - unlike `SilentDriftSweepJob`, `FollowUpSlaSweepJob`, and
`AttendanceCompletenessSweepJob`, this job's output (`Alert` rows) is
already a directly queryable resource `apps/api`'s existing dashboard
endpoints read (FR-INS-04); there's no live-event counterpart for "Church
Pulse changed" to unify with under §10.8's "one downstream reaction
mechanism" reasoning. See `ChurchPulseRecomputeJob`'s own doc comment.

### `follow-up-sla-sweep` and `attendance-completeness-sweep`: detect and signal, never mutate

Both follow the identical pattern: evaluate an existing pure domain
function (`isFollowUpTaskPastSla()`, `evaluateAttendanceCompleteness()`)
against real data, and on a positive result, publish a synthetic
Engagement Signal - never write back to `FollowUpTask`/`Gathering`
themselves. This is a deliberate, not incidental, choice for
`follow-up-sla-sweep`: `FollowUpTaskService.escalate()`
(`apps/api/src/modules/pastoral-care`) requires a human-supplied
`escalatedToPersonId` (no organizational-hierarchy resolution exists
anywhere in this codebase, per that service's own doc comment) and throws
a `ConflictException` on an already-`ESCALATED` task - if this sweep
instead flipped `status` to `ESCALATED` itself, it would permanently
block the real, human-initiated escalation that needs to happen
afterward. Publishing a signal instead avoids that conflict entirely. See
`FollowUpSlaSweepJob`'s own doc comment for the full reasoning, and
`AttendanceCompletenessSweepJob`'s for the parallel case (no "flagged
incomplete" field exists on `Gathering` either).

Both jobs also **re-publish every run for as long as the underlying
condition persists**, rather than deduplicating via a persisted "already
signaled" marker the way `SilentDriftSweepJob` does via
`SilentDriftFlag.status`. There is no equivalent schema entity for either
job to check against, and unlike a silent-drift flag (a discrete new
condition), an SLA breach or a completeness gap is genuinely ongoing
every day it isn't resolved - so re-signaling each run is the more
defensible default in the absence of one. Flagged as a disclosed
trade-off, not a missing feature; a future iteration could add a
`lastSignaledAt`-style column to reduce signal volume, but that's a
schema change outside this milestone's scope.

### `[Stewardship gaps sprint]` `flagged-transaction-sla-sweep` and `pledge-reminder-sweep`: same shape, one new wrinkle

Two more scheduled sweeps, added after this milestone's original seven,
closing gaps `STEWARDSHIP_DESIGN_NOTES.md`'s own "what this milestone
deliberately does not build" section named (`Flagged -> UnderInvestigation`'s
automatic SLA trigger, Pledge reminder delivery). `command.ts`'s
`WorkerCommand` union grew from 7 to 9 values; `worker.module.ts` now
imports ten consumer/job modules unconditionally.

- **`flagged-transaction-sla-sweep`** follows `follow-up-sla-sweep`'s exact
  "detect and signal, never mutate" shape - and for the identical
  underlying reason. `FinancialTransactionEvent.actorUserId` is a
  `NOT NULL` FK to `platform.users` ("No 'system actor'" above already
  establishes no such row exists), so appending the
  `FLAGGED -> UNDER_INVESTIGATION` event automatically is not an option
  without either fabricating an actor or violating the schema constraint -
  the same "the real mutation needs human-supplied data this sweep doesn't
  have" blocker `follow-up-sla-sweep` hits for its own `escalatedToPersonId`
  requirement, just from a different root cause (an FK constraint instead
  of a business-logic parameter). Publishes
  `stewardship.flagged_transaction_sla_breached` and re-signals every run,
  same disclosed no-dedup-marker trade-off as `follow-up-sla-sweep`/
  `attendance-completeness-sweep`.
- **`pledge-reminder-sweep`** is the first sweep job added since the
  original seven that *does* mutate - and the first to do so safely.
  `Pledge.reminderSentAt` is a plain nullable `DateTime?` column with no
  actor FK at all (unlike `FinancialTransactionEvent`, it isn't part of an
  append-only audited log), so marking it needs no fabricated actor, only
  a timestamp. This also gives it a real persisted dedup marker the other
  sweeps lack: once `reminderSentAt` is set, `PledgeReminderSweepRepository.
  listReminderCandidates()`'s own `reminderSentAt: null` filter excludes
  that Pledge from every future run - a true single send, matching OQ-07's
  "never a repeated... sequence" requirement exactly, not the "re-publish
  every run" behavior every other detect-and-signal sweep in this codebase
  has to settle for.

## No LocalStack / docker-compose AWS emulation - real SDK code instead

Confirmed via an explicit grep across both source documents: **zero
mentions** of LocalStack, docker-compose AWS emulation, or any other
local-dev substitute for EventBridge/SQS. The disciplined move, following
the precedent Sprint 1.4 already established for Cognito
(`CognitoVerifierService` uses the real `aws-jwt-verify` library against a
real, if unprovisioned, User Pool - never a fake JWT verifier), is to
write real `@aws-sdk/client-eventbridge`/`@aws-sdk/client-sqs` integration
code, unit-test it against mocked SDK clients, and disclose "needs a real
provisioned EventBridge bus + SQS queues" as an outstanding limitation -
never invent a different queue technology (e.g. BullMQ+Redis) as a
stand-in, since that would silently redesign the specified architecture.
See "Known sandbox limitations" below for exactly what was and wasn't
possible to verify here.

## No shared `libs/database`/`libs/env` - apps/worker has its own copies

Confirmed via inspection: no shared `libs/database` or `libs/env` exists
anywhere in this workspace. `apps/api/src/platform/config/env.schema.ts`
and `apps/api/src/platform/database/prisma.service.ts` are both
**app-private** to apps/api. apps/worker's own
`src/platform/config/env.schema.ts` and
`src/platform/database/prisma.service.ts` are new, independent copies of
the same small, established pattern - not imports of apps/api's versions,
which Nx's `enforce-module-boundaries` rule (already active workspace-wide,
see root `README.md`'s "Module boundaries" section) forbids for app-to-app
dependencies. Both processes connect to the **same** physical Postgres
database (Blueprint ADR-003: schema-per-bounded-context in one database,
not a database per service) via two independent `PrismaClient` instances.

The same reasoning extends to every worker-side data-access class this
milestone adds: `WorkerEngagementSignalRepository`
(`src/consumers/insights`) and `SilentDriftSweepRepository`
(`src/jobs/silent-drift-sweep`) are apps/worker's own Prisma-backed
queries, not imports of `apps/api/src/modules/insights`'s
`EngagementSignalRepository` or a (nonexistent)
`apps/api/src/modules/pastoral-care` `SilentDriftFlag` repository. What
*is* shared directly: `libs/domain/pastoral-care`'s pure
`evaluateSilentDrift()` function and `libs/contracts`'s
`engagementSignalEnvelopeSchema` - both leaf libraries every app already
depends on without violating the boundary rule.

## No "system actor" - worker writes bypass RBAC entirely, by construction

Confirmed via a full read of `libs/rbac/src/lib/request-context.ts` and
`types.ts` plus a zero-match grep for `system actor|SYSTEM_ACTOR|worker.*actor`:
no "system actor" concept exists anywhere in `libs/rbac`.
`ActorContext`/`EcclesiaRequestContext` assume a real JWT-authenticated
`Person`+`Role`, resolved per HTTP request by `AuthGuard`
(`apps/api/src/platform/auth`). apps/worker has no HTTP requests and no
authenticated identity to resolve one from.

Every write this milestone performs (`InsightsConsumer.handle()` writing
an `EngagementSignal`; `SilentDriftSweepJob` writing a `SilentDriftFlag`)
therefore calls its own worker-local Prisma repository directly, bypassing
`RbacGuard`/`RecordLevelPolicyGuard`/`AuditLogService` entirely - not
attempting to fabricate an HTTP-shaped actor to satisfy a guard that was
never designed for a non-HTTP caller. This is architecturally correct, not
a workaround: every write this milestone performs is either (a) ingesting
data that already passed through a human-authenticated write elsewhere on
the bus, or (b) a system-detected condition (silent drift) that has no
"acting Person" in the first place - the PRD/Blueprint model authorization
around human actors making requests, and a scheduled sweep or an
asynchronous consumer is neither.

## `EngagementSignalEnvelope` moved into `libs/contracts` (new file)

Blueprint §10.3's envelope shape was previously only described in prose
(`db/schema.prisma`'s `ProcessedEvent` doc comment,
`INSIGHTS_DESIGN_NOTES.md`) - no Zod schema existed for it anywhere yet.
Added as `libs/contracts/src/lib/event-bus.schemas.ts`
(`engagementSignalEnvelopeSchema`), not inside `libs/domain/insights` or
apps/worker itself, because it is genuinely cross-boundary: apps/api's
future event producers and apps/worker's consumers both need the
identical wire shape, and `libs/contracts` is the one leaf library both
apps already depend on. `payload` is `z.record(z.unknown())` rather than
the Blueprint's generic `<T>` type parameter - Zod schemas aren't generic
the way a TypeScript interface is; each concrete signal type's payload is
validated downstream by whichever consumer/domain function interprets it.

## Two inferred conventions, flagged as constructions, not citations

1. **EventBridge `Source`/`DetailType` on `PutEventsCommand`.** Neither
   document specifies what these AWS-API-required fields should contain.
   `EventBridgePublisherService` fixes `Source: 'ecclesia.worker'` and
   sets `DetailType` to the envelope's own `eventType`. See that service's
   own doc comment.
2. **Distinguishing a "Sunday/Wed/Fri main-service Gathering" from a
   "Bacenta Meeting" for the silent-drift sweep's queries.**
   `Gathering.type` is a Branch-configured free string with no fixed enum
   (`GATHERINGS_DESIGN_NOTES.md`), so `SilentDriftSweepRepository` uses
   `ownerGroupId IS NULL` (main service) vs. `ownerGroupId = <the Bacenta's
   groupId>` (Bacenta Meeting) as the one schema-grounded signal available,
   rather than pattern-matching on `type` string values neither document
   fixes. See that repository's own doc comment.

## `NestFactory.createApplicationContext()`, not `.create()`

apps/worker has no HTTP surface - `main.ts` uses Nest's dependency-injection
container without an HTTP listener. This is my own inferred bootstrap
choice, not mandated by either document (the Blueprint doesn't specify a
Node/Nest bootstrap style for the worker beyond "runs as an ECS Fargate
container," ADR-007).

## `main.ts` as a command dispatcher, one image, `command` varies per ECS task

`main.ts` reads one positional CLI argument (`consume:insights` or
`sweep:silent-drift`) and runs only that command, then (for the sweep) exits,
or (for the consumer) runs an unbounded long-poll loop until SIGTERM/SIGINT.
This is the natural fit for ADR-007's "long-running ECS Fargate container,
not Lambda-per-message" model: one deployable worker image, with the
`command` override varying per ECS task definition/EventBridge Scheduler
target - not a separate image per job/consumer.

**`parseCommand()`/`runCommand()` live in their own `command.ts` file, not
`main.ts` itself - a fix, not the original design.** The first version of
this milestone defined them directly in `main.ts`, which also imports
`WorkerModule` for `bootstrap()`'s own use. `WorkerPlatformModule` calls
`ConfigModule.forRoot({ validate: validateEnv })` inside its `@Module()`
decorator, and Nest evaluates a decorator's `imports` array immediately
when the file is loaded - not lazily on first DI resolution. That meant
`main.spec.ts`, which only wanted to unit-test `parseCommand`/`runCommand`,
was forced to transitively load `WorkerModule` just by importing `./main`,
which in turn required real `AWS_REGION`/`SQS_INSIGHTS_QUEUE_URL`/
`DATABASE_URL` environment variables to be present just to *load* the
test file, regardless of what the test itself actually exercised. This
was caught by the user's own real `pnpm test` run (`Error: Invalid
environment configuration - AWS_REGION: Required; SQS_INSIGHTS_QUEUE_URL:
Required`), not by anything in this sandbox - `apps/api` never had this
exposure because it has no `main.spec.ts` at all, and the Sprint 0
scaffold's original `main.ts` had zero framework imports. Fixed by moving
`parseCommand`/`runCommand` into `command.ts`, which imports only
`InsightsConsumer` and `SilentDriftSweepJob` directly (neither of which
imports `WorkerPlatformModule` anywhere in its own chain) - `main.ts` is
now a thin wrapper that imports both `WorkerModule` and `./command`, and
`command.spec.ts` (renamed from `main.spec.ts`) tests the dispatch logic
with zero real environment configuration required.

## Idempotency: two distinct checks, not one

`ProcessedEventRepository.tryRecord()` (event-delivery idempotency,
Blueprint §10.5) and `SilentDriftSweepRepository.findOpenFlag()`
(business-level idempotency: don't raise a second flag for a Person who
already has one unresolved) are deliberately separate mechanisms.
`SqsConsumerBase` always calls the former for every message it receives,
regardless of which consumer subclass is running; `SilentDriftSweepJob`
additionally calls the latter before writing a new flag, since a
re-triggered nightly sweep for an already-flagged Person is a normal
business scenario, not a redelivered message.

## What this milestone deliberately does not build

Blueprint §10's full consumer/sweep inventory (three consumers, four
sweeps) is now built in full, across the first vertical-slice milestone
and this follow-up one. What remains deliberately unbuilt:

- **A real notification delivery channel.** `notification-consumer` is
  built, but only as the idempotency-check-and-log stub predicted from
  the start - the PRD never commits to a delivery channel anywhere. Every
  "alert"/"notification" requirement (FR-INS-03/05, FR-STW-08/OQ-07,
  Pastoral Care §16.2, Ministry §16.3) uses only generic language like "a
  visible alert"; the only named channel (WhatsApp) is an explicitly
  parked Horizon 3+ idea contingent on a consent model that doesn't
  exist. A genuinely undecided open question, not an oversight.
- **Automatic Follow-up task escalation-target resolution.**
  `follow-up-sla-sweep` detects and signals SLA breaches but never
  resolves *who* the organizational superior is or mutates the task's
  status - see "`follow-up-sla-sweep` and `attendance-completeness-sweep`:
  detect and signal, never mutate" above. Same unresolved gap
  `FollowUpTaskService`'s own doc comment already names.
- **A dead-letter queue.** `SqsConsumerBase` leaves a failed message
  un-deleted for ordinary SQS visibility-timeout redelivery; no DLQ policy
  is configured or modeled in this codebase. A message that fails
  indefinitely relies entirely on whatever DLQ the real provisioned queue
  has, if any.
- **Row-Level Security's `app.current_branch_id` session GUC**, for the
  same disclosed reason as every other module: nothing in this codebase
  sets it yet (`db/DESIGN_NOTES.md` Open Question #3). apps/worker's
  repositories filter by `branchId` explicitly in application code, the
  same "only current enforcement, not the intended backstop" caveat every
  other module already carries.

## Two real bugs the user's own `pnpm test`/`pnpm build` run caught

This milestone was initially handed off for verification the same way
every prior sprint's static-only review was, with the caveats below
disclosed. The user then ran a real `pnpm install && pnpm lint && pnpm
test && pnpm build` on their own machine (13/14 projects passed on the
first try - only `worker` failed, on both `test` and `build`). Both
failures were real defects in this milestone's own code, not artifacts of
either sandbox's limitations, and both are now fixed:

1. **`worker:test` failed**: `Error: Invalid environment configuration -
   AWS_REGION: Required; SQS_INSIGHTS_QUEUE_URL: Required`, thrown from
   `validateEnv` the moment `main.spec.ts` merely *imported* `./main`.
   Root cause and fix: see "`main.ts` as a command dispatcher" above -
   `parseCommand`/`runCommand` were moved into their own `command.ts` so
   unit-testing them no longer transitively loads `WorkerPlatformModule`'s
   eager `ConfigModule.forRoot({ validate })` call. `main.spec.ts` was
   deleted; `command.spec.ts` replaces it with the same test cases.
2. **`worker:build` failed**: `TS6059` errors ("File
   '.../libs/contracts/src/index.ts' is not under 'rootDir'
   '.../apps/worker'") for every file this milestone imports from
   `libs/contracts`/`libs/domain/pastoral-care`. Root cause: apps/worker's
   `build` target had used the `@nx/js:tsc` executor since Sprint 0, which
   was never a problem while `main.ts` had zero cross-project imports -
   but that executor's whole-program `tsc` compilation requires every
   included file to sit under one `rootDir`, which a TS-path-mapped
   cross-library import can't satisfy. Fixed by switching apps/worker's
   `build` target to `@nx/webpack:webpack` with a new
   `apps/worker/webpack.config.js`, mirroring `apps/api/webpack.config.js`
   exactly (`apps/api` has imported these same kinds of libs since its
   first bounded-context module and has never hit this, because webpack's
   own module resolution has no such `rootDir` restriction). Confirmed
   fixed in this sandbox: `npx nx build worker` now compiles cleanly,
   correctly treating `@aws-sdk/*`/`@nestjs/*` as Node externals, down to
   the one remaining, already-disclosed error below. A second, smaller gap
   surfaced by the same build run: apps/worker had no `src/assets/`
   directory, and unlike `@nx/js:tsc`, `@nx/webpack:webpack`'s asset-copy
   step fails hard (`ENOENT`) rather than skipping a missing directory -
   fixed by adding `apps/worker/src/assets/.gitkeep`, matching
   `apps/api/src/assets/.gitkeep`'s own precedent exactly.

## This follow-up milestone's own verification round

Unlike the first vertical slice, this follow-up milestone's `tsc --noEmit`
(both `tsconfig.app.json` and `tsconfig.spec.json`), `npx nx lint worker`,
and `npx nx build worker` were all run **to completion, with zero
errors**, in this sandbox - the `ProcessedEvent`/`processedEvent` gap the
first slice's own verification round had to leave open (stale generated
Prisma Client) has since resolved itself (the mounted `@prisma/client` now
has the model; whether that happened via the user's own `pnpm db:generate`
or an install-time hook wasn't independently confirmed, only that the
symptom is gone). One real lint error was caught and fixed along the way:
`no-empty-object-type` on `church-pulse-recompute.repository.ts`'s
`AppendPulseScoreHistoryRecord`, originally declared as
`interface ... extends UpsertPulseScoreRecord {}` (an interface adding no
new members to its supertype) - changed to a `type` alias instead. The
full `npx nx build worker` run (webpack + `NxAppWebpackPlugin`) compiled
all 32 worker modules plus every consumed `libs/*` file successfully in
~9.5s, correctly externalizing `@aws-sdk/*`/`@nestjs/*` for a Node target -
confirmed by inspecting the real `dist/apps/worker/main.js` output, not
merely a clean exit code. (Practical note for future sessions: this
sandbox enforces a 45-second hard cap per shell command, and `npx nx
build worker`/`npx nx test worker` both routinely exceed that - running
them via `nohup ... & disown`, redirecting output to a file *inside* the
mounted repo (not `/tmp`, which does not persist across separate tool
invocations here), and polling that file from a follow-up call is what
made a real build result observable at all.)

## Known sandbox limitations

Same disclosed category as every prior sprint.

- **`npx nx test worker` cannot run to completion in this sandbox**:
  the sandboxed environment's native `@swc/core` binding fails to load
  (`Failed to load native binding`), a WASI/WASM platform-compatibility
  issue - the binary `pnpm install` fetched is built for the user's real
  machine architecture, not this sandbox's. This is why the two bugs above
  could only be caught by the user's own `pnpm test` run, not this
  sandbox - and why `command.spec.ts`'s correctness (as opposed to
  `command.ts`'s typecheck-level correctness) still depends on the user's
  next `pnpm test` run to confirm.
- **`@aws-sdk/client-eventbridge`/`@aws-sdk/client-sqs`'s exact pinned
  versions** (`^3.679.0` in `package.json`) were chosen without a live
  registry lookup (same `403`), matching the vintage of this workspace's
  other pinned dependencies - worth a bump-and-confirm on a future
  `pnpm install`, though the user's real install already resolved them
  successfully at whatever version pnpm's resolver picked.
- **No live AWS infrastructure.** `EventBridgePublisherService` and
  `SqsConsumerBase` are real `@aws-sdk/client-eventbridge`/
  `@aws-sdk/client-sqs` integration code, unit-tested against mocked SDK
  clients. Neither has been exercised against a real, provisioned
  EventBridge bus or SQS queue.
- None of `db:migrate:dev`, a real database connection, or a real
  SQS/EventBridge round-trip have been exercised anywhere. Needs the
  user's own `pnpm test` (this sandbox cannot run Jest at all) to confirm
  every new spec in this follow-up milestone passes for real, a `.env`
  update adding `SQS_NOTIFICATION_QUEUE_URL`/`SQS_AUDIT_QUEUE_URL`
  (required, no default, same as `SQS_INSIGHTS_QUEUE_URL`), and
  eventually a real provisioned EventBridge bus + all three SQS queues +
  Postgres instance, before Blueprint §10's full Worker inventory can be
  considered fully proven rather than reviewed and mostly-verified.
