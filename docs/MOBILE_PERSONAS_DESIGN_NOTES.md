# Mobile Personas Milestone — Design Notes

Milestone brief (verbatim): "completing the remaining mobile personas...
The Shepherd experience is complete. Implement: 1. Ministry Leader
(Dashboard, Roster, Events, Profile) 2. Finance Officer (Dashboard,
Verify, Reconcile, Profile) 3. Resident Pastor (Dashboard, Alerts,
Cluster/Branch, Profile)." Requirements: reuse the existing Design
System/Components/Bottom Navigation/Authentication/APIs; do not redesign
the Shepherd experience; each persona exposes only what its RBAC grants
permit; deliver working navigation, responsive layouts, tests,
documentation, and a passing lint/test/build. Same disclosure discipline
as every prior milestone: every choice below is a direct citation or an
explicit `[Design Decision]`.

## 1. Persona → role mapping

The brief names personas by job title, not by `RoleDto`. Resolved by
matching each title against `libs/rbac`'s role catalog and PRD §17.2's
own role descriptions:

- **Ministry Leader** → `BASONTA_LEADER` (leads a Basonta, PRD's Ministry
  group — the "Ministry" in "Ministry Leader" is the tell).
- **Finance Officer** → `TREASURER` (the only `BRANCH`-scoped role with
  `stewardship.transaction.verify`/`.reconcile` grants — "Finance
  Officer" is this app's own label, not a distinct `RoleDto`).
- **Resident Pastor** → `RESIDENT_PASTOR`, and its Blueprint §8.6 interim
  twin `ACTING_RESIDENT_PASTOR` — the latter's rules are generated
  verbatim from the former's (`permission-matrix.ts`'s own bottom-of-file
  comment), so both get identical mobile treatment.

## 2. `[Bug fix]` RBAC gap: Basonta Leader could create Events but never read them back

`BASONTA_LEADER` held `gatherings.gathering.create`/`.update` and
`gatherings.attendance.create` at `OWN_GROUP` scope, but no
`.read` grant for either action at all — the exact same class of gap the
Shepherd Dashboard sprint had already found and fixed for
`BACENTA_LEADER` (see that role's own rows in `permission-matrix.ts`,
each with a "[Bug fix, Shepherd Dashboard sprint]" `reason`). Without a
fix, the Events tab's list view (`GET /gatherings?ownerGroupId=...`)
would 403 for every Ministry Leader, unconditionally — not a scope
mismatch to work around client-side, a genuine missing grant with a
direct, already-established precedent for how this codebase closes that
exact class of gap.

Fixed by adding two rows, mirroring `BACENTA_LEADER`'s own fix exactly:

```
{ role: 'BASONTA_LEADER', action: 'gatherings.gathering.read', effect: 'ALLOW', scope: 'OWN_GROUP' }
{ role: 'BASONTA_LEADER', action: 'gatherings.attendance.read', effect: 'ALLOW', scope: 'OWN_GROUP' }
```

No other permission-matrix row changed. This is the only backend change
in this milestone — everything else is `apps/mobile` only, per the
brief's "reuse... existing APIs" instruction.

## 3. Shared infrastructure changes

All four screens per persona reuse the exact same `@ecclesia/ui-native`
component library, `BottomNav`, hand-built `Navigator`, and Dev-Auth
`AuthContext` the Shepherd experience already established — nothing in
`libs/ui`, `AuthContext.tsx`, or the underlying `api-client.ts` changed.

- **`navigation/Navigator.tsx`** — `ScreenName` grew six new members
  (`ministry-roster`, `ministry-events`, `finance-verify`,
  `finance-reconcile`, `pastor-alerts`, `pastor-cluster`). `'dashboard'`
  and `'profile'` are deliberately *not* duplicated per persona — every
  persona's tab bar has exactly one Dashboard and one Profile tab at
  those same two keys; `App.tsx`'s `CurrentScreen` branches the Dashboard
  case on `actor.role` instead.
- **`navigation/AppShell.tsx`** — `TABS` (a single fixed Shepherd array)
  became `TABS_BY_ROLE`, keyed by `RoleDto`, with `SHEPHERD_TABS` copied
  verbatim from the original array (same five keys/labels/icons/order/
  `testId` — "Do NOT redesign the Shepherd experience"). `AppShell` takes
  a new optional `role` prop (default `'BACENTA_LEADER'`) rather than
  reading `useAuth()` itself — `AppShell.spec.tsx`'s existing tests render
  this component standalone with no `AuthProvider` ancestor, and keeping
  `AppShell` decoupled from that context meant zero changes were needed
  to keep those tests passing. `App.tsx`'s `RootNavigator` passes
  `role={state.actor.role}` explicitly, since it already has the actor in
  hand. Roles with no built persona (`ASSISTANT_PASTOR`, `ADMIN`,
  `WORKER`, `MEMBER`, `COUNCIL_OVERSEER`, `VISITOR`) fall back to
  `DEFAULT_TABS` (Dashboard, Profile only).
- **`App.tsx`** — `CurrentScreen` gained one `case` per new `ScreenName`
  plus a `DashboardForRole` sub-component that renders the right
  Dashboard screen for `BACENTA_LEADER`/`BASONTA_LEADER`/`TREASURER`/
  `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`, and an honest
  `UnsupportedDashboardScreen` (new, `screens/UnsupportedDashboard/`) for
  any other role — not a silent fallback to another persona's dashboard,
  which would show data/actions that role has no RBAC grant for and
  would simply fail against the API.
- **`lib/session.ts`** — `useSession()` (Shepherd-only, throws without a
  `bacentaId`) is completely unchanged; two new hooks were added
  alongside it: `useActorSession()` (role-agnostic, never throws for a
  missing group id — used by Finance Officer/Resident Pastor, both
  `BRANCH`-scoped with no group of their own) and `useMinistrySession()`
  (the `BASONTA_LEADER` mirror of `useSession()`, scoped to
  `actor.basontaId`, throws the same way for a non-Basonta actor).
- **`lib/usePersonName.ts`** (new) — `usePersonNameByToken(personId,
  authToken)`, the role-agnostic sibling of `ShepherdDashboard/hooks/
  useShepherdDashboardData.ts`'s own `usePersonName` (which internally
  calls `useSession()` and therefore throws for three of this app's four
  personas). Used by `ProfileScreen` and `MinistryRosterScreen`.
- **`screens/Profile/ProfileScreen.tsx`** — generalized from a
  Shepherd-only screen to one shared by all four personas.
  `useSession()`/`useGroupName()` (both Bacenta-only) were replaced with
  `useActorSession()`/`useGroupNameById()` (new, in `hooks/useGroupName.ts`
  alongside the original, unchanged `useGroupName()`) /
  `usePersonNameByToken()`. A new `GROUP_LABELS` map picks "Bacenta" /
  "Basonta" / (nothing at all, row omitted) per role — a `BRANCH`-scoped
  Treasurer or Resident Pastor has no single Group of their own to name.
  Rendered output for `BACENTA_LEADER` is byte-for-byte unchanged from
  before this milestone.
- **`libs/ui/core/src/lib/icon-registry.ts`** — two additions,
  `landmark`/`building` (`Landmark`/`Building2` from `lucide-react`/
  `lucide-react-native`, both confirmed present in the installed
  packages before adding — same verification discipline the earlier
  `coins`/`clipboardList` addition used), for the Finance Officer's
  Reconcile tab and the Resident Pastor's Branch tab respectively. No
  existing icon was a close enough fit (the same reasoning that earlier
  addition's own doc comment gives).

## 4. Ministry Leader (`BASONTA_LEADER`)

Every action below is `OWN_GROUP`-scoped to the Ministry Leader's own
Basonta (`permission-matrix.ts`).

- **Dashboard** (`screens/MinistryDashboard/`) — Roster size +
  overcommitment-flag count (`ministry.roster.read`/
  `.overcommitment.read`) and the next upcoming Event
  (`gatherings.gathering.read`), each linking to its own full tab.
- **Roster** (`screens/MinistryRoster/`) — `GET /ministry/groups/:id/roster`
  + `.../roster/overcommitment` (`RosterController`, unmodified),
  read-only. Adding/removing a roster member is a
  `people.group_membership.update` action this screen does not surface —
  no add/remove-member UI exists anywhere in this app yet, on any
  persona, to model this screen's own affordance after, and building one
  from scratch is outside this milestone's named scope (Dashboard/
  Roster/Events/Profile, not roster editing).
- **Events** (`screens/MinistryEvents/`) — list (`GET /gatherings?
  ownerGroupId=...`, the read grant added in §2) + create form (`POST
  /gatherings`). `[Known limitation]` `scheduledStart` is a plain text
  `Input`, not a native date/time picker — no such component exists
  anywhere in `@ecclesia/ui-native` (the closest precedent,
  `OfferingRecordingScreen`'s amount entry, takes the same "plain
  `Input` with format guidance" approach), and building one is a Design
  System component addition outside "reuse existing components." A
  malformed value fails fast via the API's own validation, surfaced in
  `submitError`.
- **Profile** — shared `ProfileScreen`, unmodified beyond §3's
  generalization.

## 5. Finance Officer (`TREASURER`)

Every action below is `BRANCH`-scoped (`permission-matrix.ts`).

- **Dashboard** (`screens/FinanceDashboard/`) — count awaiting
  verification (`GET /financial-transactions?state=RECORDED`) and this
  week's unmatched-Bacenta count (`GET /bank-deposit-confirmations/
  reconciliation`), each linking to its own tab.
- **Verify** (`screens/FinanceVerify/`) — the FR-STW-03/04 queue:
  Verify/Flag/Escalate (`POST /financial-transactions/:id/{verify,flag,
  escalate}`). BR-STW-04's separation-of-duties rule (a Treasurer may
  never verify a transaction they themselves recorded) is enforced
  server-side by `RecordLevelPolicyGuard`'s `DIFFERENT_ACTOR_THAN_RECORDER`
  check, not re-implemented client-side — a rejected action surfaces the
  API's own error message inline, the same "server is the source of
  truth" approach `MinistryEventsScreen`'s date validation takes.
- **Reconcile** (`screens/FinanceReconcile/`) — both halves of what
  `permission-matrix.ts` groups under "reconcile": the weekly bank-deposit
  comparison (`GET`/`POST /bank-deposit-confirmations{,/reconciliation}`,
  FR-STW-07) and per-transaction reconciliation (`POST
  /financial-transactions/:id/reconcile`, FR-STW-05) for `VERIFIED`
  transactions. `[Known limitation]` Fixed to the current calendar week
  (`currentWeekStartDate()`) — there is no "browse other weeks"
  affordance; the brief names "Reconcile," not "Reconciliation history,"
  and `weeklyReconciliationResponseSchema`'s own contract has no list-of-
  weeks endpoint to browse against.
- **Profile** — shared `ProfileScreen`.

## 6. Resident Pastor (`RESIDENT_PASTOR` / `ACTING_RESIDENT_PASTOR`)

Every action below is `BRANCH`-scoped.

- **Dashboard** (`screens/PastorDashboard/`) — `GET
  /insights/branch-dashboard` (FR-INS-04) drives both cards: Church
  Pulse (same `getChurchPulseBand` band/color logic `ChurchPulseCard`
  already uses for the Shepherd's own Bacenta-scoped score — one shared
  source of truth for what a score "means," just a different scope) and
  open-alert count.
- **Alerts** (`screens/PastorAlerts/`) — reuses the Dashboard's already-
  fetched `alerts` field rather than a second network call. There is no
  `GET /insights/alerts` list endpoint (`AlertController` only exposes
  single-Alert `GET`/`PATCH /:id/resolve`) — this is the same "Alert
  inbox: embedded per-dashboard" decision this codebase already settled
  on for the Shepherd's own `NotificationsCard`, inherited here rather
  than re-decided. Resolve (`ACTED`/`DISMISSED`) hits the single-Alert
  endpoint directly and refetches the Dashboard's data.
- **Cluster/Branch** (`screens/PastorClusterBranch/`) — `[Design
  Decision]` There is no distinct "Cluster" Group type anywhere in this
  schema (`GROUP_TYPE_VALUES` is only `PASTORAL_CARE`/`MINISTRY` —
  `people.schemas.ts`), and `insights.cluster_dashboard.read`'s own
  backing endpoint (`GET /insights/cluster-dashboard/:groupId`) operates
  on an ordinary Bacenta's `groupId`, just under a different RBAC
  action/scope reserved for `ASSISTANT_PASTOR` — there is no "list of
  clusters" for any role to browse, ever. Built instead as: the Branch
  Pulse header (reusing the Dashboard's own data) plus a Branch-wide list
  of every Bacenta (`GET /groups?type=PASTORAL_CARE`), each row
  expandable in place to its own Pulse score (`GET
  /insights/bacenta-dashboard/:groupId`), fetched **lazily, only once a
  row is expanded** — fetching every Bacenta's dashboard unconditionally
  on screen load would be an unbounded N+1 burst for a Branch with many
  Bacentas, and `groupDashboardResponseSchema`'s own doc comment already
  describes this endpoint as "a single-Bacenta drill-down... not a true
  multi-Bacenta ranked list."
- **Profile** — shared `ProfileScreen`.

## 7. What was deliberately not built

- **`ministry.staffing_target.*`** (FR-MIN-02/03) has no surface on the
  Ministry Leader Dashboard/Roster/Events/Profile screens —
  `StaffingTargetController` only exposes `POST` (create/upsert) and
  `GET /:id` (single, by an id this app has no way to discover, no list
  endpoint), so there is no honest way to build a "current target vs.
  actual" view without either guessing an id or adding a backend list
  endpoint the brief did not ask for.
- **Expense request/approve/pay** is not surfaced anywhere on the
  Finance Officer persona — the brief names Dashboard/Verify/Reconcile/
  Profile specifically, not Expenses; `TREASURER` does hold
  `stewardship.expense.*` grants, but building that surface is a distinct
  deliverable this milestone's brief did not list.
- **Roster add/remove** (Ministry Leader) — see §4.

## 8. Tests

One spec file per new/changed screen/hook, following this codebase's
existing per-screen convention (mock `lib/session`, exercise real
`useAsyncData`/`apiGet`/`apiPost`/`apiPatch` against a mocked
`global.fetch`):

- `MinistryDashboardScreen.spec.tsx`, `MinistryRosterScreen.spec.tsx`,
  `MinistryEventsScreen.spec.tsx` — 10 tests.
- `FinanceDashboardScreen.spec.tsx`, `FinanceVerifyScreen.spec.tsx`,
  `FinanceReconcileScreen.spec.tsx` — 10 tests.
- `PastorDashboardScreen.spec.tsx`, `PastorAlertsScreen.spec.tsx`,
  `PastorClusterBranchScreen.spec.tsx` — 9 tests.
- `App.spec.tsx` — extended with one "renders the right Dashboard + tab
  bar" test per new persona, plus `ACTING_RESIDENT_PASTOR` and the
  no-built-persona fallback case.
- `AppShell.spec.tsx` — extended with one tab-set test per new persona
  plus the fallback case, via the new `role` prop.
- `ProfileScreen.spec.tsx` — extended with a Ministry Leader ("Basonta,"
  not "Bacenta") case and a Treasurer (no Group row at all) case,
  alongside the original, unmodified Shepherd case.

## 9. Verification — actually run, not just statically reviewed

Every prior milestone's own design notes disclose the same limitation:
no `pnpm`/`tsc`/`eslint`/`jest` execution was possible in that sandbox.
That was re-checked for this milestone, and it no longer fully holds:
`pnpm` itself is still unavailable (no `pnpm` binary, `corepack enable`
fails with `EACCES`, and `npm install pnpm` 403s — no registry access),
but Nx's own locally-installed binaries
(`node_modules/.bin/{jest,eslint,tsc}`) work directly, bypassing the
`pnpm`-shaped package-manager detection Nx's own CLI wrapper needs. That
made a real, not statically-reviewed-only, verification pass possible
this time:

- **`jest`** (`apps/mobile/jest.config.ts`, run in batches to fit this
  sandbox's per-command time budget): **all 23 spec files, 112 tests,
  pass** — every new persona's specs, `App.spec.tsx`/`AppShell.spec.tsx`
  (including the two tests exercising the real, unmocked `AppShell` —
  see below), `ProfileScreen.spec.tsx`, and every pre-existing spec file
  this milestone did not intend to change (`ShepherdDashboardScreen`,
  `FollowUpQueueScreen`, `OfferingRecordingScreen`,
  `AttendanceCaptureScreen`, `AuthContext`, `Navigator`, `LoginScreen`,
  `useAsyncData`, `useOfferingRecordingData`, `PriorityCard`,
  `ChurchPulseCard`).
  - **This also resolves a pending item from the previous sprint**: a
    `SafeAreaView`-mocking fix in `App.spec.tsx` (diagnosed and applied
    before this milestone started, but never re-run to confirm) is
    confirmed working — `App.spec.tsx`'s five `authenticatedAs(...)`
    tests all pass.
  - One test (`MinistryDashboardScreen`'s first case) needed
    `--testTimeout=15000` to pass reliably in isolation — cold-start
    Metro/Babel transform overhead on the very first test in a fresh
    `jest` process, not a logic bug (confirmed: the same test passes in
    170ms once the transform cache is warm, and passes without any
    timeout override as part of the full 23-file batch run).
- **`eslint`** (`node_modules/.bin/eslint`, this workspace's flat
  config): every new/changed file in `apps/mobile`, plus
  `libs/rbac/src/lib/permission-matrix.ts` and
  `libs/ui/core/src/lib/icon-registry.ts` — **zero errors** after one
  fix (an unused `init` parameter in a test mock,
  `FinanceVerifyScreen.spec.tsx`).
- **`tsc --noEmit`**: `apps/mobile/tsconfig.app.json`,
  `apps/mobile/tsconfig.spec.json`, `libs/rbac/tsconfig.lib.json`,
  `libs/ui/core/tsconfig.lib.json` — **zero errors**.
- **Not run**: `libs/rbac`'s own Jest suite (`permission-matrix.spec.ts`,
  `evaluate.spec.ts`) — that project's `jest.config.ts` uses `@swc/jest`
  (per `jest.preset.js`), and this sandbox's `@swc/core` native binding
  fails to load (`Error: Failed to load native binding`) — a pre-existing
  environment limitation `apps/mobile`'s own `jest.config.ts` doc comment
  already explains why that project deliberately avoids `@swc/jest`
  (Flow-syntax stripping in RN's polyfills). Mitigated by inspection
  instead: `permission-matrix.spec.ts` has no assertion referencing
  `gatherings.gathering.read`/`gatherings.attendance.read` for
  `BASONTA_LEADER` (grepped before and after the addition), and
  `evaluate.spec.ts` builds its own inline test matrix rather than
  importing `PERMISSION_MATRIX`, so it cannot be affected by this
  addition at all. Both new rows are purely additive (no existing row
  was edited or removed) — this needs a real `pnpm test` run on a
  machine with a working `@swc/core` binding to be fully confirmed, but
  the risk surface is about as small as a two-line, additive,
  precedent-mirroring change can be.

## 10. `[Bug fix]` The above verification was incomplete: real `pnpm test` failed under parallel load

§9's "all 23 spec files, 112 tests, pass" claim was true only under this
sandbox's forced `--runInBand` (serial) execution. The user's own real
`pnpm test` run on their machine — genuine parallel Jest workers across
all 18 projects, contending for the same CPU cores — surfaced real
failures this sandbox's serial runs had masked: `mobile:test` (9 of 23
suites, 11 of 112 tests) and `ui-native:test` both failed, all with
"Exceeded timeout of 5000 ms," plus one distinct non-timeout failure in
`FinanceReconcileScreen.spec.tsx`. Two root causes, both genuine gaps in
this project's Jest configuration, not logic bugs in the milestone's own
screens/hooks:

- **Jest's `testTimeout` default (5000ms) was never overridden** in
  `apps/mobile/jest.config.ts` or `libs/ui/native/jest.config.ts`. This
  milestone added nine new screens, each mounting several `Skeleton`
  loading states via `CardAsyncBoundary` — a meaningful increase in this
  project's async-test surface, on top of RN's own Metro/Babel transform
  already being CPU-heavier than the rest of this monorepo's `@swc/jest`
  projects (§9's own note that even a single cold-start test needed
  `--testTimeout=15000` to pass reliably was an early warning sign of
  this same marginal-timeout issue, not fully connected at the time).
  Fixed: `testTimeout: 20000` added to both jest configs.
- **RTL's `waitFor()` default poll timeout (1000ms,
  `@testing-library/react-native`'s own `asyncUtilTimeout` config) was
  also never overridden anywhere in this project**, and is a separate
  budget from Jest's own `testTimeout` — raising the latter alone does
  not extend the former. This is what caused
  `FinanceReconcileScreen.spec.tsx`'s "confirming a deposit refetches the
  reconciliation view" test to fail with RTL's own "Unable to find an
  element with testID: finance-reconcile-deposit-open-bacenta-1" (not a
  Jest timeout) under real contention. Fixed: `configure({
  asyncUtilTimeout: 10000 })` added to both `test-setup.ts` files.

Also investigated: `Skeleton.tsx`'s `Animated.loop` cleanup throws a
`TypeError` under Jest's automocked `NativeAnimatedHelper` on every
Skeleton unmount (a pre-existing, cosmetic issue predating this
milestone — visible as a caught `console.error`, not a test failure, in
every spec file that renders a `Skeleton`). A defensive `try/catch`
around `loop.stop()` was added, but confirmed (by re-running with the
guard in place) that this console.error persists — the actual throw
site is deeper inside React Native's own Animated internals, not
`loop.stop()` itself, and is unrelated to the real timeout/`waitFor`
failures above. Left in as harmless defensive code; the `console.error`
noise itself is a separate, lower-priority cosmetic cleanup not pursued
further here.

**Re-verified after both fixes** (this sandbox, `--runInBand`):
`Skeleton.spec.tsx`, `MinistryDashboardScreen.spec.tsx` (3/3), and
`FinanceReconcileScreen.spec.tsx` (3/3, including the previously-failing
"confirming a deposit" test) all pass. **Not re-verified**: a full real
parallel `pnpm test` run — this sandbox has no `pnpm` binary (§9) and,
independently, became intermittently unresponsive to `jest`/`eslint`
invocations partway through this fix (unexplained; not disk space, not
zombie processes, not cache bloat — plain shell commands stayed
responsive throughout). **Needs a real `pnpm test` run on the user's
machine to fully confirm** both `mobile:test` and `ui-native:test` are
now clean.

`worker:test` also failed on the user's real run — confirmed unrelated to
this milestone (`apps/worker` was never touched here) once the actual
failure output was shared:
`church-pulse-recompute.job.spec.ts`'s "creates a PULSE_DECLINE alert..."
test expected `createAlert` to fire but it never did.

Root cause: `ChurchPulseRecomputeJob.computeAndStore`/
`evaluateAndCreateAlertIfNeeded` build `now` from the real system clock
(`new Date()`, not injected), and the spec feeds
`findRecentHistoryByScope` two **hardcoded absolute** timestamps
(2026-07-15 / 2026-08-01) that only both land inside
`evaluatePulseTrend`'s 21-day trailing window while the suite happens to
run on or before 2026-08-05T00:00:00.000Z. Today is 2026-08-05 — the
window had already rolled past the July point, silently collapsing
`earliest`/`latest` to the same August point and producing a 0-point
delta instead of the intended 20-point decline. `evaluatePulseTrend`
itself is correct; this was a test fixture quietly decaying with the
calendar, not a logic bug, and would have kept failing (permanently,
from 2026-08-05 onward) on every future run regardless of any other
change. Fixed by pinning the clock with `jest.useFakeTimers()` +
`setSystemTime(new Date('2026-08-01T12:00:00.000Z'))` in a `beforeEach`,
making the fixture dates' relationship to "now" deterministic instead of
calendar-dependent. Verified by hand (windowStart = 2026-07-11T12:00,
both fixture points fall inside it, delta = 60 − 80 = −20 ≤ −10
threshold ⇒ `declined: true`) — this sandbox cannot execute
`apps/worker`'s Jest suite at all (`@swc/core` has no Linux binding
here, same limitation §9 discloses for `libs/rbac`), so this needs a
real `pnpm nx run worker:test` run to fully confirm. `eslint`/`tsc
--noEmit` on the changed spec file are both clean.
