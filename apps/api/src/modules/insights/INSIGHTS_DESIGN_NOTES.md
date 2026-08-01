# Insights domain — design notes

Read this alongside `libs/domain/insights/README.md` (the
framework-agnostic Church Pulse scoring/trend logic this module
orchestrates) and `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`
(the module this one consumes public services from - see "Cross-module
consumption" below). Same discipline as every prior sprint: every design
choice cites the Blueprint/PRD section it comes from, or is explicitly
flagged as inferred/unresolved.

## Why Insights, not Ministry

The locked roadmap left Ministry/Insights' order undecided. Insights went
first for the same reason Stewardship went ahead of it: its RBAC
groundwork had been sitting unused since Sprint 1.1 - `libs/rbac`
already carried the three dashboard-read actions
(`insights.branch_dashboard.read`/`cluster_dashboard.read`/
`bacenta_dashboard.read`) and their full permission-matrix rows, before
any Insights module existed to consume them. Additionally, all six Church
Pulse signal sources (§12.8) already exist as a byproduct of the four
domain modules already built (Attendance from Gatherings, Group
Membership/Role Assignment/Visitor conversion from People, Follow-up
outcomes from Pastoral Care, Financial giving from Stewardship) - Ministry
has none of that groundwork; it starts from zero RBAC scaffolding and
zero of its own signal sources built yet.

## What this milestone builds

The fifth bounded-context module (PRD §13.6's Insights domain).

| Area | File(s) | PRD/Blueprint basis |
|---|---|---|
| Weighted Church Pulse scoring model | `libs/domain/insights/src/lib/church-pulse-scoring.ts` | PRD §12.8, BR-INS-01, OQ-10 |
| Trend-decline evaluation | `libs/domain/insights/src/lib/pulse-trend.ts` | FR-INS-03, §11.2 |
| EngagementSignal/PulseScore/Alert Zod schemas | `libs/contracts/src/lib/insights.schemas.ts` | Blueprint §6.3, §10.3 |
| Engagement Signal ingestion (`record()`, no controller) | `services/engagement-signal.service.ts` | Blueprint §10.3/§10.4/§10.6 |
| Church Pulse compute-on-read (Branch/Group only) | `services/pulse-score.service.ts` | FR-INS-01, NFR-PRIV-02 |
| Trend alerting + act/dismiss resolution | `services/alert.service.ts` | FR-INS-03, FR-INS-05 |
| Branch/Bacenta/Cluster dashboards | `controllers/dashboard.controller.ts` | FR-INS-04 |
| Single-Alert read/resolve | `controllers/alert.controller.ts` | FR-INS-03/05 |

## Cross-module consumption (Blueprint §7.2), not duplication

`InsightsModule` imports `PeopleModule` as an ordinary import (no
`forwardRef` - People needs nothing back from Insights). One
already-exported People service is consumed unchanged, no new exports
required this milestone:

- **`GroupScopeService`.** `GroupDashboardResourceContextGuard`
  (bacenta/cluster dashboards) and `AlertResourceContextGuard`
  (GROUP-scoped alerts) resolve a Bacenta's `ResourceContext` from its
  `groupId`, the third bounded-context consumer of this service after
  Gatherings and Stewardship.

**`InsightsModule` exports `EngagementSignalService`** - the one module
in this codebase, so far, that exports something. See "The missing
Engagement Signal ingestion pipeline" below for why.

## NFR-PRIV-02 is a hard release gate, enforced in code, not just policy

RISK-06 names it explicitly: "Person-level Church Pulse scoring must not
ship until a separate access-control review is complete." This is not a
scope-management choice this milestone made for convenience - it is
enforced structurally:

- `PulseScoreService` has exactly two public methods,
  `computeAndStoreBranchScore(branchId)` and
  `computeAndStoreGroupScore(branchId, groupId)`. Neither accepts nor can
  construct a `personId`/`PERSON`-scoped call. There is no
  `computeAndStorePersonScore` method anywhere in this module.
- `EngagementSignalRepository.countByTypeInWindow()` has no `personId`
  filter parameter - it can only scope a query to a whole Branch or one
  Group, never to an individual Person's own signal history.
- `PulseScoreScopeType` (the Prisma enum) still includes `PERSON` for
  type-fidelity with `db/schema.prisma`, and `pulseScoreScopeTypeSchema`/
  `AlertResourceContextGuard` handle it defensively (falling back to a
  Branch-only `ResourceContext` rather than crashing) - but nothing in
  this module's actual code paths ever produces a `PERSON`-scoped
  `PulseScore`/`PulseScoreHistory`/`Alert` row. FR-INS-01's own priority
  table marks Person-level scoring H2/H3 ("pending privacy design per
  §9.3"), consistent with this exclusion.

## Compute-on-read, not a scheduled job (same disclosed limitation as every prior sprint)

FR-INS-01's acceptance criterion says a Church Pulse score should update
"on a defined cadence." No scheduler/worker exists anywhere in this
codebase - the same gap already disclosed for Pastoral Care's
silent-drift sweep, Gatherings' completeness sweep, and Stewardship's
SLA-trigger and Pledge-reminder delivery. `PulseScoreService` works
around this the same way those did: every dashboard endpoint recomputes
the score fresh from the trailing signal window as a side effect of being
read, upserts the "current" `PulseScore` row, appends a
`PulseScoreHistory` point, and hands off to `AlertService` to evaluate
the trend against that freshly-appended history. A Branch/Bacenta that
nobody views for a while simply has a stale `PulseScore`/no new
`PulseScoreHistory` points until the next read - not wrong, but not the
"defined cadence" the PRD's language implies either.

## The missing Engagement Signal ingestion pipeline (Blueprint Ch.4/§10.6)

Blueprint §10.4's Engagement Signal catalog names seven concrete event
types (`attendance.recorded`, `bacenta_meeting.attendance_recorded`,
`role_assignment.active`/`basonta_roster.updated`,
`follow_up.completed`/`follow_up.sla_breached`,
`insights.alert_action_recorded`, `lifecycle_stage.transitioned`,
`giving.activity_recorded`) produced by Gatherings/People/Pastoral
Care/Stewardship and consumed asynchronously via an EventBridge/SQS bus
by `apps/worker` (§10.6: "a few seconds to minutes of propagation delay
... is explicitly acceptable"). **None of that bus, and no
`apps/worker` consumer, exists anywhere in this codebase** - the same
category of gap already disclosed for every prior milestone's missing
scheduler, just for an event bus instead of a cron trigger.

This milestone deliberately does **not** invent a synchronous substitute
wiring calls directly from Gatherings/People/Pastoral Care/Stewardship
into `EngagementSignalService.record()` - that would silently redesign an
architecture the Blueprint explicitly describes as asynchronous
(§10.6's own stated latency tolerance is evidence the design intends
decoupling, not a synchronous call graph) without evidence that's an
equivalent substitution rather than a different one. Instead:

- `EngagementSignalService` is built completely, with the one method
  (`record()`) a future `apps/worker` consumer would call once the bus
  exists, and is exported from `InsightsModule` so any future consumer -
  worker-based or otherwise - can inject it directly.
- It has **no HTTP controller** - nothing in this milestone calls it, by
  design, since there is no producer wired up yet to call it from.
- `recordEngagementSignalSchema` (`libs/contracts`) defines the one
  canonical wire shape for that future call, narrower than Blueprint
  §10.3's full envelope (no `eventId`/`eventType`/`schemaVersion`) since
  those envelope fields belong to whatever unwraps the bus message before
  calling this service, not to the signal's own persisted shape.

**Practical consequence:** every dashboard built this milestone is
functionally correct against whatever `EngagementSignal` rows already
exist in the database, but no rows will exist in a real deployment until
this ingestion pipeline is built - Church Pulse scores will read as 0
for every Branch/Bacenta until then. This is the single largest
follow-up this milestone leaves open.

## Alert inbox: embedded per-dashboard, not a separate cross-cutting endpoint

PRD §16.6's capabilities table names "Alert inbox (all leadership roles,
scoped)" as its own surface. This milestone serves it as the `alerts`
array already embedded in each dashboard response
(`branchDashboardResponseSchema`/`groupDashboardResponseSchema`) rather
than building a separate `GET /insights/alerts` list endpoint, for the
same structural reason the cluster dashboard is a single-Bacenta
drill-down rather than a true ranked list (next section):
`evaluate.ts`'s `resourceInScope()` has no `ResourceContext` shape for
"many scopes' alerts at once," and a Branch-wide `GET /insights/alerts`
list resource (mirroring `FinancialTransactionListResourceContextGuard`'s
Branch-only precedent) would only ever be satisfiable by `RESIDENT_PASTOR`/
`ADMIN`'s `BRANCH`-scoped grant - `ASSISTANT_PASTOR`'s `CLUSTER` and
`BACENTA_LEADER`'s `OWN_GROUP` grants could never match a resource with no
`bacentaId`. Each dashboard's own already-correctly-scoped alert list
avoids this problem entirely. `GET /insights/alerts/:id` and
`PATCH /insights/alerts/:id/resolve` (single-Alert, `AlertResourceContextGuard`)
exist for acting on one alert once a leader has found it in their
dashboard's list.

## The cluster dashboard is a single-Bacenta drill-down, not a ranked list

Same structural limitation already disclosed for People's deferred
search/directory: `ResourceContext` (`libs/rbac/src/lib/types.ts`) models
one resource at a time via a single `bacentaId`, and `evaluate.ts`'s
`CLUSTER` scope check tests that one `bacentaId` against the actor's
`clusterBacentaIds` set membership. There is no shape here for "return
every Bacenta in my cluster, ranked" (US-G2) without an architectural
extension to the resource-context model itself - inventing one
unilaterally, this deep into a locked roadmap, would be a bigger
redesign than this milestone should make unprompted.

`GET /insights/cluster-dashboard/:groupId` is therefore built as a
near-identical twin of `GET /insights/bacenta-dashboard/:groupId` -
same `GroupDashboardResourceContextGuard`, same response shape, different
`@RequirePermission` action (and therefore different
`permission-matrix.ts` scope rows: `ASSISTANT_PASTOR` gets `CLUSTER` on
the cluster route, `BACENTA_LEADER` gets `OWN_GROUP` on the bacenta
route). An Assistant Pastor viewing their cluster today drills into one
Bacenta at a time by id, rather than seeing all of them ranked in one
response.

## Provisional scoring constants (not citations - see each constant's own doc comment)

- **`PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE = 10`**
  (`church-pulse-scoring.ts`). Neither the PRD nor the Blueprint specify
  how a raw signal count within the trailing window becomes a 0-100
  category sub-score - §12.8 defers "the exact weighting formula... and
  alert thresholds" to this functional domain chapter, but PRD §13.6's
  own FR-INS rows never supply it either. A genuine specification gap,
  not an oversight.
- **`DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS = 10`** (`pulse-trend.ts`).
  FR-INS-03 requires the threshold to be "configurable" but states no
  default value anywhere - unlike the trailing window, which §11.2's
  Pastor Emmanuel scenario ("dropped 15 points over 3 weeks") gives a
  concrete worked example for (`DEFAULT_PULSE_TREND_WINDOW_DAYS = 21`,
  which *is* `[PRD-DERIVED]`). 10 points is disclosed as a placeholder
  smaller than §11.2's own 15-point illustration, so that scenario would
  in fact trigger under this default.
- **`DEFAULT_CHURCH_PULSE_WEIGHTS`** (equal 1/6 per category). This one
  *is* a direct citation, not a placeholder this module invented -
  PRD §24's OQ-10 resolution text states explicitly: "Release 1 ships
  with equal weighting across all six signal categories as an explicitly
  labeled provisional placeholder." `PulseScoreService.findChurchPulseWeights()`
  falls back to this default whenever a Branch has no
  `platform.configurations.church_pulse_weights` row configured yet (the
  expected steady state, since FR-INS-02's weight-configuration screen
  itself is H2 and not built this milestone).

## The six signal-source types vs. §8.1's six scoring categories (a narrative inconsistency, not silently resolved)

§12.8's flowchart names six *signal source* boxes (Attendance, Group
Membership changes, Financial Transactions, Follow-up outcomes, Role
Assignments, Visitor-to-Member conversions). §8.1 separately names six
*scoring* categories (attendance consistency, Bacenta participation,
serving activity, follow-up responsiveness, leadership engagement,
visitor retention) that do not map 1:1 onto the flowchart's boxes (e.g.
"leadership engagement" and "serving activity" both plausibly derive from
the same Role Assignment source; "Financial Transactions" has no
identically-named §8.1 category). `libs/domain/insights` treats the
flowchart's six signal-source types as the computational unit - see
`church-pulse-scoring.ts`'s own doc comment - since that is what
`EngagementSignal.signalType` is actually typed by, and flags this
inconsistency rather than inventing a mapping table to silently resolve
it.

## Inferred permission rows (PRD §17.3 gaps, not transcription omissions)

Same discipline as every prior module's own inferred rows (People's
Group-creation gap, Pastoral Care's poimen_enrollment gap, Stewardship's
Project/Pledge gap) - flagged at their declaration sites in `actions.ts`
and summarized here:

- **`insights.alert.read`/`insights.alert.resolve`.** §17.3's matrix
  predates the Alert-inbox surface named in §16.6's capabilities table
  entirely - no row names it at all. Modeled with the identical
  role/scope shape as the three dashboard-read rows (`RESIDENT_PASTOR`
  BRANCH, `ASSISTANT_PASTOR` CLUSTER, `BACENTA_LEADER` OWN_GROUP, `ADMIN`
  BRANCH on read only) since FR-INS-04/BR-INS-02's RACI already governs
  every other Insights surface identically.

## What this milestone deliberately does not build

- **The real Engagement Signal ingestion pipeline.** See its own section
  above - the single largest follow-up.
- **FR-INS-02's weight-configuration screen (H2).** Explicitly lower
  priority than FR-INS-01/03/04/05 (all R1) per PRD §13.6's own priority
  column. `PulseScoreRepository.findChurchPulseWeights()` reads
  `platform.configurations.church_pulse_weights` if an Admin has already
  set it via some future screen, but no endpoint in this milestone writes
  it.
- **Person-level Church Pulse scoring.** NFR-PRIV-02 hard gate - see its
  own section above.
- **A true multi-Bacenta ranked-list cluster dashboard (US-G2).** See its
  own section above.
- **A separate cross-cutting Alert inbox list endpoint.** See "Alert
  inbox" section above - served per-dashboard instead.
- **`insights.alert_action_recorded` as an actual emitted Engagement
  Signal.** Blueprint §10.4 lists this as the "leadership engagement"
  signal source's producer event, self-referentially fed by Insights'
  own `AlertService.resolve()`. Not wired up this milestone, for the same
  reason nothing else emits onto the (nonexistent) bus yet -
  `AlertService.resolve()` persists the resolution to `insights.alerts`
  directly, which is itself readable by future dashboard reads, but does
  not additionally round-trip through an `EngagementSignal` row.

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/
`prisma` execution against real `node_modules` or a live database in this
environment. Verified via the same static methods used in every prior
sprint (brace-balance and import-resolution checks across every new/
changed file this milestone). Needs a real
`pnpm install && pnpm lint && pnpm test && pnpm build` run, and ultimately
exercising these endpoints against the real local Postgres from Sprint
1.3's verification, before this can be considered proven correct rather
than merely reviewed.
