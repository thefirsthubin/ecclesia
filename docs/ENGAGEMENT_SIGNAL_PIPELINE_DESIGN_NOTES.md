# Engagement Signal Ingestion Pipeline — design notes

Milestone brief (verbatim, paraphrased here only for the section header):
"Implement the complete Engagement Signal ingestion pipeline exactly as
defined in the PRD and Technical Blueprint," consuming existing domain
events, reusing the existing Worker architecture, integrating
EventBridge/SQS "exactly as designed," feeding Church Pulse/Silent
Drift/Leadership Alerts/Branch/Cluster/Bacenta dashboards, staying
deterministic (no AI/heuristics), and explicitly requiring every design
decision and PRD/Blueprint deviation to be documented before it's made.
This file is that documentation.

## The one finding that reshaped this milestone's actual scope

The brief's own framing ("Church Pulse, Insights, Silent Drift, and
Leadership Alerts are still driven primarily by seeded/manual data")
turned out to be inaccurate as a description of *this* codebase's current
state, and research confirmed it before any code was written:

- **`apps/worker` already has a fully real, wired ingestion pipeline** -
  `InsightsConsumer` (SQS), `AuditConsumer` (SQS), a nightly
  `ChurchPulseRecomputeJob`, and five scheduled sweeps, all built in an
  earlier Worker milestone. `apps/worker/README.md` states "Blueprint
  §10's full consumer/sweep inventory is built."
- **The Insights domain (`apps/api/src/modules/insights`) already computes
  Church Pulse/Silent Drift/Alerts from real `EngagementSignal` rows**, not
  from seed data - `db/seed.ts` seeds zero `EngagementSignal`/`PulseScore`/
  `Alert` rows. Dashboards compute-on-read from whatever signals actually
  exist.
- **The web-admin and mobile dashboard screens already call the real API
  endpoints** (`useBranchDashboard`, `useBacentaDashboard`, etc.) - not
  mock/local data.
- **The one genuine, load-bearing gap**: zero domain-module write paths in
  `apps/api` (Gatherings/People/Pastoral Care/Stewardship/Insights)
  actually called `.publish()` to put an Engagement Signal on the bus.
  `apps/worker`'s `EventBridgePublisherService` existed and worked; nothing
  in `apps/api` ever constructed an envelope and called it. The two
  `apps/api`-adjacent design docs that said otherwise
  (`INSIGHTS_DESIGN_NOTES.md`, `engagement-signal.service.ts`'s own doc
  comment) were themselves stale, written before the Worker milestone
  closed most of what they described as missing, and were never updated -
  corrected in place as part of this milestone (see those files' diffs).

**Consequence for scope**: "implement the complete pipeline" reduced to
one well-defined, bounded change - add the missing `.publish()` calls at
the exact point each domain fact already happens, using the
already-established envelope shape, already-established idempotency
model, and already-established consumer/scoring logic, touching nothing
else. This is smaller and lower-risk than the brief's own framing implied,
which is itself worth surfacing rather than silently doing more or less
work than the actual gap warranted.

## What was built

A new `EventBridgePublisherService` in `apps/api/src/platform/events/`
(mirroring `apps/worker`'s own class - see "Deviation 1" below), wired via
a new `EventsModule` into five bounded-context modules, and seven new
`.publish()` call sites:

| Signal category (PRD §8.1) | Event type published | File / method |
|---|---|---|
| Attendance consistency | `attendance.recorded` | `gatherings/services/attendance-record.service.ts` → `record()` |
| Bacenta participation | `bacenta_meeting.attendance_recorded` | same method, branched on `gathering.type` |
| Serving | `role_assignment.active` | `people/services/role-assignment.service.ts` → `grant()` |
| Serving | `basonta_roster.updated` | `people/services/group-membership.service.ts` → `assign()`, only when `group.type === 'MINISTRY'` |
| Visitor retention | `lifecycle_stage.transitioned` | `people/services/person.service.ts` → `transitionLifecycleStage()`, **and** `group-membership.service.ts` → `assign()`'s own PRD §19.1 step 6 side effect |
| Follow-up responsiveness | `follow_up.completed` | `pastoral-care/services/follow-up-task.service.ts` → `complete()` |
| Stewardship (giving, privacy-normalized) | `giving.activity_recorded` | `stewardship/services/financial-transaction.service.ts` → `record()`, only when `giverPersonId` is set |
| Leadership engagement | `insights.alert_action_recorded` | `insights/services/alert.service.ts` → `resolve()` |

Every call site publishes **after** its existing write already succeeds,
using data already in scope - no new queries, no new business rules, no
change to what any of these methods actually decide. Each service gained
exactly one new constructor parameter (`EventBridgePublisherService`) and
1-3 lines at its existing return point. Tests were added/extended in each
service's own `.spec.ts` asserting the right envelope is published (or, in
the negative cases, that it deliberately is not).

Two already-real event types (`pastoral_care.silent_drift_flagged`,
`pastoral_care.follow_up_task_sla_breached`, plus two Stewardship-sweep
types) continue to be published by `apps/worker`'s existing sweeps,
unchanged - this milestone did not touch them (see Deviation 2).

## Design decisions and deviations from the PRD/Blueprint

Per the brief's own requirement, every deviation is named here, with the
alternative considered and why it was rejected.

### Deviation 1 — a second, near-duplicate `EventBridgePublisherService`, not a shared one

The Blueprint doesn't specify where the publisher class should live.
`apps/api` needed one; `apps/worker` already had one. The two options were
a shared `libs/platform-events` leaf library, or an app-private copy in
`apps/api` mirroring `apps/worker`'s class almost verbatim.

**Chosen: an app-private copy** (`apps/api/src/platform/events/`), for two
reasons. First, this workspace's own `enforce-module-boundaries` rule
already forbids one `scope:app-backend` project depending on another -
`apps/api` structurally cannot import from `apps/worker` regardless, so
"shared" would have meant a new library either way. Second, the exact same
choice was already made and documented for the read-side equivalent:
`apps/worker/src/consumers/insights/engagement-signal.repository.ts`'s own
doc comment calls itself "deliberately a separate Prisma repo from
apps/api's, not a shared import, per Nx module-boundary rules." Following
that precedent keeps this milestone's shape consistent with how the
codebase already handles this exact tension, rather than introducing a new
one-off library for a single ~30-line class. The one intentional
difference between the two copies: `Source: 'ecclesia.api'` vs.
`'ecclesia.worker'` on the underlying `PutEvents` call, so a downstream
consumer or operator can tell which process actually published a given
signal - both classes' own doc comments name this as a construction, not a
Blueprint citation (identical to how the original class already flagged
`Source`/`DetailType` as inferred, not specified).

### Deviation 2 — existing sweep-published event-type strings were left as-is, not renamed to match the Blueprint's literal catalog

Blueprint §10.4's catalog names `follow_up.sla_breached`. The shipped,
already-tested, already-consumed event type is
`pastoral_care.follow_up_task_sla_breached` (from
`FollowUpSlaSweepJob`, built in an earlier milestone). Two stewardship
sweep-published types (`stewardship.flagged_transaction_sla_breached`,
`stewardship.pledge_reminder_due`) have no Blueprint catalog entry at all.

**Chosen: leave every existing sweep-published type string unchanged.**
The brief's own "Do NOT... Redesign any existing architecture" instruction
governs here directly - renaming a live, already-consumed event type is a
breaking change to `apps/worker`'s own `InsightsConsumer` test fixtures
and any real downstream EventBridge Rule filtering on that literal string,
for a purely cosmetic gain (matching Blueprint prose exactly). The
alternative (renaming to match) was rejected as strictly higher risk for
zero functional benefit - nothing consumes these signals by matching
against the Blueprint's own text, only against whatever string the
producer and consumer already agree on.

### Deviation 3 — `follow_up.completed`'s payload has no `outcome` field

Blueprint §10.4's catalog sketch shows this event's payload as
`{ personId, outcome }`. `FollowUpTaskService.complete(id: string)`'s
actual signature (unchanged by this milestone) takes no outcome
parameter, and `FollowUpTask`'s own Prisma schema has no such column - a
Shepherd marks a task `COMPLETED` with no free-text or enum outcome
recorded anywhere in this codebase today.

**Chosen: publish without an `outcome` field** (`payload: { followUpTaskId
}` only). Inventing an outcome value (e.g. defaulting to `'reconnected'`,
or fabricating an enum) would be exactly the "introduce new business
rules" the brief prohibits - there is no real data to report, so none is
reported. A future milestone that adds outcome-capture to
`FollowUpTaskService.complete()` itself can extend this payload trivially;
this milestone does not invent the field it would need.

### Deviation 4 — `giving.activity_recorded` fires only when there's an individual `giverPersonId`

The catalog names this signal generically ("giving activity"). A
Bacenta-collected offering (`FinancialTransaction.sourceGroupId` set,
`giverPersonId` left unset by design - see that service's own pre-existing
doc comment) has no individual giver at all.

**Chosen: skip publishing entirely for group-collected transactions.**
There is no Person to attribute an individual engagement signal to for a
collection-point entry; publishing with a null `subjectPersonId` would
either violate the envelope schema (`subjectPersonId` is `z.string().uuid()`
when present, not nullable) or require inventing a placeholder identity -
both rejected as fabricating data the domain doesn't have. Payload itself
is also deliberately empty (`{}`), per PRD §17.6's privacy boundary: no
amount, transaction id, or channel - the catalog's own description names
only "personId, occurredAt," both of which are already envelope-level
fields, not payload contents.

### Deviation 5 — `lifecycle_stage.transitioned` has two producers, not one

The catalog names one event type sourced from People. In this codebase,
lifecycle-stage transitions genuinely happen at two different call sites -
`PersonService.transitionLifecycleStage()` (the general-purpose endpoint)
and `GroupMembershipService.assign()`'s own PRD §19.1 step 6 side effect
(FOLLOW_UP → ASSIGNED_TO_BACENTA, deliberately rejected by the former and
required to go through the latter - a pre-existing, unrelated design
decision this milestone didn't touch).

**Chosen: publish the identical event type/payload shape from both call
sites**, rather than having one delegate to the other. The two methods
already cannot share logic (that's the entire reason
`requiresGroupMembershipToTransition` rejects the transition from
`PersonService` in the first place) - forcing them to share a publish call
would mean reintroducing exactly the coupling that rejection exists to
prevent, for no benefit: both branches are still, semantically, one
Person's lifecycle stage changing.

### Non-deviation worth naming: no `actor`/`ActorContext` parameter was added to any method signature

Two of the six touched methods (`PersonService.transitionLifecycleStage`,
`FollowUpTaskService.complete`) don't take an `actor: ActorContext`
parameter today. Every `EngagementSignalEnvelope`'s `subjectPersonId`
field names the *subject* of the signal (the person whose stage changed,
the person a follow-up was about), never the acting user - so no method
signature needed to change to publish correctly. This was verified against
the envelope schema before writing any code, specifically to avoid an
unnecessary API-surface change these two methods' callers (controllers,
other tests) would otherwise have had to absorb.

## What still doesn't flow through this pipeline, and why

- **Real AWS infrastructure.** No EventBridge bus, EventBridge Rule, or
  SQS queue is provisioned anywhere (no CDK/Terraform in this repo -
  `infra/modules/README.md` is a placeholder). This was true before this
  milestone and is unchanged by it - provisioning real cloud infrastructure
  is outside a code-only milestone's reach, and was already a disclosed,
  pre-existing gap (`.env.example`'s dummy queue URLs). `apps/api`'s new
  publisher makes a genuine, non-mocked `PutEvents` SDK call the same way
  `apps/worker`'s always has - it will fail at runtime against a real
  environment with no bus, exactly as `apps/worker`'s own publisher would.
- **`EngagementSignalService.record()` (apps/api) is still not called by
  anything.** It remains apps/api's in-process landing point, distinct from
  the new bus-publishing path - see that file's own updated doc comment.
- **UI screens were not modified.** Every dashboard/screen the brief names
  (`ChurchPulseCard`, `InsightsPage`, `ShepherdDashboardScreen`, etc.) was
  confirmed, before writing any code, to already call the real API
  endpoints rather than mock data - per the brief's own "do not modify
  completed UI screens unless required to display live data," none needed
  touching, since none required a code change to display live data once
  real signals exist.
- **`role_assignment.active` fires for every role grant, not filtered by
  role type.** The Blueprint's own catalog pairs this event with "Serving"
  specifically, but its producer description ("People/Ministry") doesn't
  name a role-type filter, and adding one (e.g. excluding `BACENTA_LEADER`
  grants) would be inventing a business rule with no textual basis. Left
  unfiltered, deliberately.

## Verification

See the repo-wide, long-standing sandbox limitations already disclosed in
every prior milestone's own design notes (`WORKER_DESIGN_NOTES.md`,
`INSIGHTS_DESIGN_NOTES.md`'s own "Known sandbox limitation" section):
`tsc`/`eslint`/`jest`/`prisma` cannot execute against real `node_modules`
or a live database in this environment. This milestone's own verification
attempt and results are recorded in the commit/PR this change ships in,
using the same static-review discipline (import resolution, brace
balance, cross-file type consistency) used throughout this project - not a
substitute for a real `pnpm install && pnpm lint && pnpm test && pnpm build`
run, which still needs to happen before this is considered proven correct
rather than merely reviewed.
