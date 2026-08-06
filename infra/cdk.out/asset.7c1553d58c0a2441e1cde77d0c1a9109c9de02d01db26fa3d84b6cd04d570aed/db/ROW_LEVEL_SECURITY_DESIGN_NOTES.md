# Row-Level Security Enforcement — Design Notes

## 0. What this sprint closes

`db/DESIGN_NOTES.md` Open Question #3 and the init migration's own comment
(`db/migrations/20260801000000_init_bounded_context_schemas/migration.sql`,
"Row-Level Security" section) both say the same thing: Blueprint §7.3's RLS
policies exist as real Postgres objects, but do nothing at runtime, for two
compounding reasons — (1) the app connects to Postgres as the same role
that owns the tables, and Postgres always lets a table's owner bypass RLS
unless `FORCE ROW LEVEL SECURITY` is also set (deliberately not set, since
migrations/seeds need unrestricted cross-Branch writes), and (2) nothing
ever runs `SET LOCAL app.current_branch_id = '<uuid>'`, the session
variable every policy's `USING` clause reads. Until today, application-layer
`WHERE branch_id = ...` filtering (`PersonRepository`'s own doc comment:
"this explicit filtering *is* the only enforcement, not merely the primary
one") has been the *entire* isolation mechanism. This sprint wires both
missing pieces so RLS becomes the backstop Blueprint §7.3 always intended —
a second, DB-enforced check that does not depend on every repository query
remembering its own `branchId` filter.

**Disclosed limitation, stated once here and not repeated at every file
below: this was built in a sandbox with no PostgreSQL instance and no
Docker.** Every design decision below is reasoned from `db/schema.prisma`,
the existing migration's SQL, and Prisma's own documented interactive-
transaction/session behavior — none of it has been run against a real
database. §8 below is the exact manual verification procedure to run
before trusting this in any real environment.

## 1. The two-role model

Blueprint §7.3's own sentence — "the application must connect as a
different, non-owner Postgres role" — is the crux. Two Postgres roles now
exist for local development (a real deployment provisions its own via
whatever secrets-management it already uses; the migration below creates
both with a placeholder password purely so `pnpm db:seed:dev`/local
`docker run` stays copy-paste reproducible, the same convention
`.env.example`'s existing `DATABASE_URL` value already follows):

- **`ecclesia`** (existing, unchanged) — owns every table, runs every
  migration and seed script, and is who `DATABASE_URL` still points at.
  RLS does not apply to this role at all (table-owner bypass) - by design,
  not an oversight.
- **`ecclesia_app`** (new) — owns nothing, has `USAGE` on every schema and
  `SELECT`/`INSERT`/`UPDATE`/`DELETE` on every table (via
  `ALTER DEFAULT PRIVILEGES` too, so a *future* migration's new tables are
  covered automatically without a follow-up grant migration), and
  critically has **no** `BYPASSRLS` attribute. This is the role every
  running `apps/api`/`apps/worker` process connects as for ordinary
  business queries from now on, via the new `APP_DATABASE_URL` env var.

## 2. The "who am I" bootstrapping problem, and `PrismaRootService`

`platform.branches` itself carries an RLS policy
(`branches_self_isolation ON platform.branches USING (id =
current_setting('app.current_branch_id')::uuid)`) — the *right* design
per Blueprint (a request should only ever see its own Branch's row), but
it creates a real chicken-and-egg problem: two call sites structurally
need to run a query **before** any Branch is known at all, because their
entire job is to discover it:

1. **`ActorContextResolverService.resolve(cognitoSub)`** (`apps/api`) —
   looks up `platform.users` by `cognitoSub` to find out which Person,
   and therefore which Branch, just authenticated. There is no `branchId`
   to `SET LOCAL` yet; that's what this query produces.
2. **`DevAuthService.listAvailableUsers()`/`issueTokenFor()`** (`apps/api`,
   development mode only) — same shape, looks up `platform.users` by a
   fixed `cognitoSub` before any actor exists.
3. **`listBranches()`** (`apps/worker`, all four sweep jobs) — Node A of
   every nightly sweep is "for every Branch," which by definition can't be
   scoped to a single `branch_id` in advance.

Each of these is a genuine, structural exception, not a loophole. Rather
than weaken the RLS policies themselves (e.g. an `OR`-based carve-out
policy that every table would need, permanently widening the attack
surface of every table for a rare bootstrapping case), both apps now also
construct a second, narrow client — **`PrismaRootService`** — that
connects using the *existing* `DATABASE_URL` (the owner role, RLS-exempt
by table ownership, exactly as it already behaved before this sprint).
It is injected into exactly the three call sites named above and nowhere
else. Its class name and doc comment are deliberately loud about this
("do not inject this into a repository that has a `branchId` to filter
by") precisely because it is the one remaining way a bug could bypass
RLS - narrowing blast radius to three files instead of leaving every
repository able to reach an unscoped connection is the whole point.

Everywhere else in this codebase — all ~30 existing repositories, in both
apps — keeps injecting the same `PrismaService` it already did. That is
this sprint's central scoping win: **zero repository files change.**

## 3. How `PrismaService` learns which Branch to scope to, without touching any repository

`PrismaService` still `extends PrismaClient` (so `this.prisma.person...`
type-checks exactly as before in every repository) and still constructs
one real, long-lived `PrismaClient` instance connected via
`APP_DATABASE_URL`. What's new is in its constructor, after `super()`:
for every model Prisma generated (read from `Prisma.dmmf.datamodel.models`
at runtime — no hardcoded table-name list to keep in sync by hand), the
constructor replaces that model's own plain data property
(`this.person`, `this.gathering`, ...) with an accessor via
`Object.defineProperty`: read from an active branch-scoped transaction
client if one is running on the current async context, otherwise fall
back to the original, already-connected delegate `super()` set up.

`this.$transaction`, `this.$connect`, `this.$disconnect`,
`this.$executeRaw`, and every other `$`-prefixed method are **not**
touched at all — they remain the real `PrismaClient` prototype methods,
called with a normal `this` binding. This is a deliberate, safer choice
over the more obvious-looking alternative (wrapping the whole instance in
a `Proxy`): recent Prisma Client versions use native JS private class
fields (`#field`) internally, and a `Proxy`-wrapped instance passed as
`this` to a method that reads `this.#field` throws
`TypeError: Cannot read private member from an object whose class did
not declare it` — a real, well-documented Proxy/private-field interaction,
not a hypothetical one. `Object.defineProperty` on a handful of named own
data properties has none of that risk: it never intercepts a method call,
only rebinds which object a handful of named model-delegate *properties*
point to. (Verified in this sandbox, without a live database: constructing
a `PrismaClient` and inspecting `Object.getOwnPropertyDescriptor` confirms
model delegates like `.branch` are plain, writable, configurable own data
properties — not the case for `$transaction`, which sits on the
prototype. This part of the design is empirically checked, not just
reasoned about.)

The "current async context" is Node's built-in `node:async_hooks`
`AsyncLocalStorage` — no new dependency (this sandbox has no
package-registry access; `AsyncLocalStorage` has shipped in Node's
standard library since 12.17). `PrismaService` exposes one new public
method, `runInBranchScope<T>(branchId: string, fn: () => Promise<T>):
Promise<T>`, which:

1. Validates `branchId` is a syntactically valid UUID (a strict regex) —
   this value gets interpolated directly into a `SET LOCAL` statement
   below, and Postgres's `SET` family of commands does not accept bind
   parameters the way `SELECT`/`INSERT` do, so this validation *is* the
   injection defense, not an optional nicety. Any caller passing a
   non-UUID string throws immediately, before any query runs.
2. Opens a Prisma interactive transaction (`this.$transaction(async (tx)
   => {...}, { timeout: 15_000 })` — see §5 for why 15s, not Prisma's 5s
   default).
3. Inside that transaction, runs `tx.$executeRawUnsafe(`SET LOCAL
   app.current_branch_id = '${branchId}'`)` — `SET LOCAL` scopes the
   setting to this one transaction only; it's automatically discarded
   when the transaction commits or rolls back, so nothing leaks onto a
   pooled connection reused by a later, unrelated transaction.
4. Runs `fn()` inside `branchScopeStorage.run(tx, ...)`, so every
   `PrismaService` model-property read that happens anywhere during
   `fn()`'s call stack — including deep inside a service three calls down
   from a controller — transparently resolves to `tx`, the one connection
   where `SET LOCAL` just ran.

## 4. Where `runInBranchScope` gets called from

- **`apps/api`**: a new `BranchScopeInterceptor` (this codebase's first
  `NestInterceptor` — everything else so far has been a `Guard`). Guards
  run before interceptors in Nest's pipeline, so by the time this
  interceptor's `intercept()` runs, `AuthGuard` (the global `APP_GUARD`)
  has already attached `request.actorContext` for every route except
  ones marked `@Public()` (`GET /health`, `GET /auth/mode`, the
  `/auth/dev/*` routes). If `request.actorContext` is absent, the
  interceptor is a no-op (`return next.handle()`) — those routes touch no
  RLS-protected table at all (`/health`), or touch one exclusively through
  `PrismaRootService` (`/auth/dev/*`, per §2), so there is nothing to
  scope. If present, it wraps the rest of the request —
  `this.prisma.runInBranchScope(actor.branchId, () =>
  firstValueFrom(next.handle(), { defaultValue: undefined }))` — converting
  Nest's `Observable`-based handler pipeline to a `Promise` for the
  duration of the transaction, then back to an `Observable` for Nest's own
  return-type contract. Every actor's `branchId` (`ActorContext.branchId`
  is always populated, per `libs/rbac/src/lib/types.ts`) is what gets set —
  this is unconditionally correct against **today's real permission
  matrix**: `grep`-ing `libs/rbac/src/lib/permission-matrix.ts` for
  `scope: 'GLOBAL'` returns zero rows. Every existing role/action pair
  resolves to `SELF`, `OWN_GROUP`, `CLUSTER`, or `BRANCH` scope — all four
  are subsets of the actor's own Branch. `COUNCIL_OVERSEER` (which *would*
  need cross-Branch access) has no rows in the matrix at all yet — it's a
  seeded Dev Auth persona with nothing it's actually allowed to do,
  a pre-existing gap this sprint doesn't create or attempt to close. If a
  future sprint adds a real `GLOBAL`-scoped rule, `BranchScopeInterceptor`
  will need a second branch (read the RBAC decision, not just the actor,
  and skip `runInBranchScope` for a confirmed-`GLOBAL` request) — flagged
  here as a known follow-up, not built now since nothing exercises it yet.

  **`[Stewardship gaps sprint]` Investigated further, still deliberately
  deferred — it's a bigger change than the paragraph above implies.**
  Re-confirmed `scope: 'GLOBAL'` still returns zero matches in
  `permission-matrix.ts` and `COUNCIL_OVERSEER` still has zero rows at
  all. Beyond the app-layer `BranchScopeInterceptor` change already
  described, a *real* carve-out also needs a second Postgres role or
  privilege mode: every `*_branch_isolation` policy above calls
  `current_setting('app.current_branch_id')` with **no** `missing_ok`
  (second) argument (§4's own "why not `current_setting(..., true)`"
  reasoning — a silently-empty scope was rejected as worse than a hard
  error) — so simply skipping `SET LOCAL app.current_branch_id` for a
  GLOBAL-scoped request would not "run unscoped," it would make
  `ecclesia_app` throw on the very first RLS-protected query. Actually
  bypassing RLS for a confirmed-GLOBAL actor needs either a distinct
  Postgres role with `BYPASSRLS` (used only for GLOBAL-scope connections,
  reintroducing exactly the "table owner bypasses RLS" risk this
  migration's own header paragraph describes for `ecclesia`) or an
  equivalent `FOR ALL ... USING (current_setting(...) IS NULL OR
  branch_id = current_setting(...)::uuid)` policy rewrite across every
  protected table. Either is a real schema/infra decision, not a
  same-shape extension of the interceptor pattern — deliberately left
  undesigned until a real `GLOBAL`-scoped permission-matrix row exists to
  design it against and prove it correct with.

- **`apps/worker`**:
  - **Consumers** (`SqsConsumerBase`, subclassed by `InsightsConsumer`,
    `AuditConsumer`, `NotificationConsumer`): `processMessage()`'s entire
    body from the idempotency check (`ProcessedEventRepository.tryRecord`,
    which also writes to an RLS-protected table,
    `platform.processed_events`) through `handle()` now runs inside
    `this.prisma.runInBranchScope(envelope.branchId, ...)` —
    `EngagementSignalEnvelope.branchId` is always present (a required,
    non-optional contract field), so unlike the HTTP side there's no
    "public route" branch to skip.
  - **Sweep jobs** (`silent-drift-sweep`, `attendance-completeness-sweep`,
    `follow-up-sla-sweep`, `church-pulse-recompute`): each job's `run()`
    still calls `listBranches()` first, unscoped, via the injected
    `PrismaRootService` (§2) — this is the one place in `apps/worker`
    that legitimately needs to see every Branch at once. Everything *for*
    one Branch (`sweepBranch(branchId)` in three of the four jobs;
    `church-pulse-recompute`'s per-branch `computeAndStore` +
    `listActiveBacentaGroups` + per-group `computeAndStore` block in the
    fourth) now runs inside `this.prisma.runInBranchScope(branch.id, ...)`.

## 5. A disclosed tradeoff: transactions held open across external I/O

Wrapping an entire request/message/sweep-iteration in one Prisma
interactive transaction means anything that transaction's callback does —
including an external network call — happens while a Postgres transaction
is open and holding whatever row locks its queries have taken. Two real
instances of this exist already: `SilentDriftSweepJob.sweepBranch()` calls
`EventBridgePublisherService.publish()` (an AWS API call) between DB
writes, and any future `apps/api` handler that calls an external service
mid-request would do the same. Prisma's interactive-transaction default
timeout is 5 seconds — too tight to safely assume every external call
this codebase might ever make mid-handler will finish first. This sprint
raises the timeout to 15 seconds (`runInBranchScope`'s `{ timeout: 15_000
}`) as a pragmatic, disclosed mitigation, not a structural fix. The
structural fix — narrowing each transaction to only the DB-touching
statements of a unit of work, opening/closing it around just those calls
rather than the whole handler — would need per-handler restructuring
across roughly 40 endpoints and isn't attempted in this sprint. Flagged
here so a future sprint doesn't have to rediscover it from a production
timeout.

## 6. What does *not* change

- Every repository file (`PersonRepository`, `GatheringRepository`, ...,
  all ~30 of them across both apps) — zero edits. They keep injecting
  `PrismaService` and calling `this.prisma.<model>.<method>(...)` exactly
  as before; the branch-scoping is invisible to them by construction (§3).
- `libs/rbac`'s application-layer scope checks (`evaluate.ts`,
  `RbacGuard`, `RecordLevelPolicyGuard`) — unchanged. RLS is a second,
  independent gate confirming what RBAC already decided, per Blueprint
  §7.3's own "backstop, not primary mechanism" framing; it does not
  replace or duplicate RBAC's own logic.
- The RLS policies themselves (`db/migrations/20260801000000_.../migration.sql`)
  — unchanged, still Blueprint-exact. This sprint's migration only adds
  the new role and its grants; no `ALTER POLICY` anywhere.
- Prisma migrations and `pnpm db:seed`/`pnpm db:seed:dev` — still run as
  the `ecclesia` owner role via the unchanged `DATABASE_URL`, unaffected
  by any of this (owner bypass is exactly what lets seeding write
  cross-Branch data in one script).

## 7. Env vars

New, required, no default (same posture as `DATABASE_URL` itself - a
process with no way to connect at the correct privilege level should
refuse to boot, not silently fall back to an unscoped connection) in both
`apps/api/src/platform/config/env.schema.ts` and
`apps/worker/src/platform/config/env.schema.ts`:

```
APP_DATABASE_URL=postgresql://ecclesia_app:ecclesia_app@localhost:5432/ecclesia_dev
```

`DATABASE_URL` itself is unchanged and still required — it's now used by
strictly fewer call sites at runtime (`PrismaRootService` plus whatever
migration/seed tooling already used it) but is still the connection
Prisma's own CLI (`prisma migrate deploy`, `prisma db seed`) reads via
`db/schema.prisma`'s `datasource` block, which cannot be pointed at
`APP_DATABASE_URL` without breaking every future migration (the
non-owner role cannot run DDL).

## 8. Manual verification procedure (must be run on a real machine — not verified here)

1. `docker run --name ecclesia-db -e POSTGRES_USER=ecclesia -e POSTGRES_PASSWORD=ecclesia -e POSTGRES_DB=ecclesia_dev -p 5432:5432 -d postgres:16`
2. Add `APP_DATABASE_URL` to `.env` per §7.
3. `pnpm exec prisma migrate deploy` (applies the new role/grant migration
   as the `ecclesia` owner role, per `DATABASE_URL`).
4. `pnpm db:seed:dev`.
5. Start `apps/api`, log in as a seeded `BACENTA_LEADER` persona (per the
   Development Authentication guide), and confirm the dashboard/People
   list still returns that persona's own data — this alone proves the
   `SET LOCAL` + transaction wiring didn't just silently break every
   query.
6. The actual security proof: with `psql`, connect as `ecclesia_app`
   directly (not through the app) and run, in one session with no
   `app.current_branch_id` ever set:
   `SELECT * FROM people.persons LIMIT 1;` — this must **fail** with
   `unrecognized configuration parameter "app.current_branch_id"` (the
   Blueprint-exact policy has no `missing_ok` fallback, by design — fail
   closed). Then `SET app.current_branch_id = '<a real branch id>';`
   followed by the same `SELECT` must return only that Branch's rows,
   never another Branch's, even though `ecclesia_app` has full
   `SELECT`/`INSERT`/`UPDATE`/`DELETE` grants on the table.
7. Confirm a sweep job run (e.g. trigger `silent-drift-sweep` locally)
   still processes every seeded Branch, not just one — proving
   `PrismaRootService`'s `listBranches()` bootstrapping path still works
   correctly now that RLS is live for the role it would otherwise be
   blocked by.

If step 6's first `SELECT` does *not* fail, RLS is not actually enforcing
for `ecclesia_app` (most likely cause: it was accidentally created with
`BYPASSRLS`, or the migration was applied against a database where
`ecclesia_app` already existed with different attributes from a prior,
different setup) — treat that as a hard blocker, not a warning.

## 9. Implementation status and refinements found while building

Everything described above is now built in both `apps/api` and
`apps/worker`, exactly as designed, with three small refinements
discovered only once the actual per-file wiring was underway:

- **`BranchDirectoryRepository`** (`apps/worker/src/platform/database/`) —
  a single new repository wrapping `PrismaRootService.branch.findMany(...)`,
  used by all four sweep jobs' `listBranches()` bootstrap instead of each
  job's own `*SweepRepository` injecting `PrismaRootService` directly. Not
  called out by name in §2/§4 above (written before implementation) - kept
  each `*SweepRepository` on the RLS-scoped `PrismaService` exclusively,
  rather than mixing both clients into one repository class.
- **A latent DI-reachability gap, found and fixed, predating this sprint** —
  `apps/worker`'s `SilentDriftSweepRepository`/`AttendanceCompletenessSweepRepository`/
  `FollowUpSlaSweepRepository` already injected `PrismaService`, but their
  own Nest modules only ever imported `EventsModule`, which never exported
  `PrismaService` (only `WorkerDatabaseModule`, which `EventsModule`
  imports but didn't re-export). This is a runtime-only failure mode -
  TypeScript's structural typing has no concept of NestJS's module-graph
  DI resolution, so `tsc --noEmit` (this sandbox's only verification tool)
  could never have caught it, and neither could `pnpm build`. Fixed by
  having `EventsModule` re-export `WorkerDatabaseModule` as a whole (the
  standard Nest pattern - a provider can only appear in another module's
  `exports` if it's also that module's own `providers`, so re-exporting
  the whole imported module was the correct fix, not listing individual
  classes). This was necessary regardless of RLS, since `SqsConsumerBase`
  now also needs `PrismaService` reachable the same way.
- **`SqsConsumerBase.processMessage()`'s error handling grew slightly
  broader, disclosed here as a small, deliberate behavior change** — the
  idempotency check (`ProcessedEventRepository.tryRecord`) now runs inside
  the same `try`/`catch` as `handle()` (both are inside the one
  `runInBranchScope` call). Previously, a `tryRecord` failure would have
  propagated uncaught out of `processMessage()` entirely; now it's treated
  the same as a `handle()` failure - logged, message left unacknowledged
  for SQS redelivery. This is more consistent (one failure-handling policy
  for the whole unit of work, not two), not a workaround.

**Verification performed in this sandbox:** `tsc --noEmit` passes with
zero errors for `apps/api`'s and `apps/worker`'s app code and spec code
(one unrelated, pre-existing implicit-`any` error in
`apps/api/src/modules/people/repositories/role-assignment.repository.spec.ts`
is untouched by this sprint and predates it). New unit tests
(`prisma.service.spec.ts` in both apps, `branch-scope.interceptor.spec.ts`
in `apps/api`) exercise the `Object.defineProperty`/`AsyncLocalStorage`
mechanism and `runInBranchScope`'s UUID guard without needing a live
database - both are safely testable without one, per each spec file's own
doc comment. **What remains unverified in this sandbox, unavoidably:**
this app's own Jest cannot execute here at all (`@swc/core`'s native
binding fails to load, the same pre-existing limitation
`WORKER_DESIGN_NOTES.md` already discloses) - none of the tests above,
new or pre-existing, have actually been *run*, only written and
`tsc`-verified. §8's manual procedure is still the only real proof this
works, and still requires the user's own machine.
