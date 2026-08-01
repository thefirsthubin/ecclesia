# Ministry domain — design notes

Read this alongside `libs/domain/ministry/README.md` (the
framework-agnostic staffing-adequacy/overcommitment logic this module
orchestrates), `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`, and
`apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md` (the two
modules this one consumes public services from - see "Cross-module
consumption" below). Same discipline as every prior sprint: every design
choice cites the Blueprint/PRD section it comes from, or is explicitly
flagged as inferred/unresolved.

Ministry is the sixth and last bounded-context module in the locked
roadmap - after this milestone, every module named in Blueprint §4.2's
inventory is built.

## What this milestone builds

| Area | File(s) | PRD/Blueprint basis |
|---|---|---|
| Staffing adequacy + overcommitment (pure functions) | `libs/domain/ministry/src/lib/{staffing-adequacy,overcommitment}.ts` | FR-MIN-03/04 |
| Set/correct a staffing target (upsert) + live adequacy read | `controllers/staffing-target.controller.ts` + `services/staffing-target.service.ts` | FR-MIN-02/03 |
| Worker availability self-service | `controllers/worker-availability.controller.ts` + `services/worker-availability.service.ts` | §16.3 (H2) |
| Basonta roster view + overcommitment flag list | `controllers/roster.controller.ts` + `services/roster.service.ts` | FR-MIN-01/§16.3, FR-MIN-04 |

**FR-MIN-01 (Basonta create/configure) is *not* reimplemented here.**
On inspection it is already fully functional through People's existing
`GroupController`/`GroupService`/`GroupRepository`: `Group.type` is a
plain, ungated constructor parameter - `type: 'MINISTRY'` already works
today with zero repository changes, and `GroupService`'s own doc comment
already cites `FR-PC-01/FR-MIN-01` together. Basonta roster add/remove is
likewise already fully functional through People's existing
`GroupMembershipController`/`GroupMembershipService` (BR-PPL-02's
unconstrained-concurrency rule was already correctly implemented there).
This milestone only builds what did not already exist: staffing targets/
adequacy, worker availability, and the roster/overcommitment *read
views* - see "What §16.3 names that already existed" below for the one
partial exception (the roster view itself).

## Cross-module consumption (Blueprint §7.2), not duplication

`MinistryModule` imports `PeopleModule` (for `GroupScopeService`,
newly-exported `GroupRosterService`) and, for the first time in this
codebase, `GatheringsModule` (for the newly-exported
`GatheringScopeService`) - both as ordinary imports, no `forwardRef`;
neither module needs anything back from Ministry.

- **`GroupScopeService`** (already exported, unchanged). Resolves a
  Basonta's `ResourceContext` from its `groupId` - the fourth
  bounded-context consumer after Gatherings, Stewardship, and Insights.
- **`GroupRosterService`** (new People export this milestone). Three
  methods - `countActiveMembers`, `listActiveMembers`,
  `countActiveMinistryMembershipsForPerson` - wrapping three new
  `GroupMembershipRepository` query methods. `StaffingTargetService`
  needs the first (FR-MIN-03's adequacy ratio); `RosterService` needs the
  second and third (FR-MIN-01's roster view, FR-MIN-04's overcommitment
  flag). See `PEOPLE_DESIGN_NOTES.md`'s own "Ministry milestone
  follow-up" section for why a Basonta-Leader-lookup method on
  `GroupLeadershipService` was considered and rejected instead - Ministry
  's endpoints turned out not to need "who leads this Basonta" at all,
  since `OWN_GROUP` scope already resolves that via
  `ActorContext.basontaId`/`ResourceContext.basontaId` equality with no
  service-layer lookup required.
- **`GatheringScopeService`** (new Gatherings export this milestone, its
  first ever). One method, `loadScope(gatheringId): Promise<{ branchId }>`
  - `StaffingTargetService.create()` validates a client-supplied
  `gatheringId` exists and belongs to the same Branch as the target
  Basonta before writing, the same "validate the cross-module reference
  before insert" discipline `PledgeService.fulfill()`/`ExpenseService`
  already apply to their own cross-entity references.

## Why `ministry.staffing_target.create` doubles as update (no separate `.update` action)

FR-MIN-02's "define a staffing target" is naturally re-invoked as a
Basonta Leader's estimate changes closer to the event.
`StaffingTargetRepository.upsert()` is keyed on `db/schema.prisma`'s own
`@@unique([gatheringId, groupId])` - re-submitting for the same
(Gathering, Basonta) pair corrects the existing row rather than erroring
or duplicating. This is not a new pattern: `AttendanceRecordRepository.upsert()`
already established the identical "re-recording is a correction, not a
duplicate" precedent for `@@unique([gatheringId, personId])`, and
`gatherings.attendance.create` already covers both the first record and
every subsequent correction under one action. `ministry.staffing_target.create`
does the same.

## FR-MIN-03: "rostered" means active `GroupMembership`, not a per-Gathering assignment

`db/schema.prisma`'s `ministry` schema models only `StaffingTarget` (a
target count against one Group+Gathering pair) - there is no "who is
specifically assigned to serve at this Gathering" entity. FR-MIN-03's own
acceptance criterion ("a ratio... updating as workers are added to the
roster") confirms the intended reading: adding a worker to the roster
means opening a `GroupMembership` via People's existing
`GroupMembershipService`, not a Ministry-owned per-Gathering assignment
action. `StaffingTargetService`'s every read therefore computes adequacy
live from the Basonta's *current* active-membership count against the
stored target - "compute-on-read," the same pattern Insights'
`PulseScoreService` already established for Church Pulse (no scheduler
needed, and none exists in this codebase to run it any other way).

## FR-MIN-04: overcommitment is a disclosed proxy, not the literal acceptance criterion

FR-MIN-04's acceptance criterion: "A worker rostered on 4+ overlapping
**Gathering** commitments in one week is flagged." No per-Gathering
roster-assignment entity exists in the schema (see above) - a Person's
specific concurrent *Gathering* commitments cannot be computed at all
against what's actually modeled. The closest computable proxy,
implemented here, is a Person's count of **concurrent active Basonta
memberships** (`GroupRosterService.countActiveMinistryMembershipsForPerson`)
- a Person serving many Basontas at once is a reasonable, disclosed
approximation of overcommitment, not the same measurement the PRD
describes. `DEFAULT_OVERCOMMITMENT_THRESHOLD = 4` is still
`[PRD-DERIVED]` from the acceptance criterion's own "4+" number, even
though it's applied to a different (but related) count than the PRD's
literal wording. True Gathering-level overlap detection needs a
per-Gathering roster-assignment schema addition outside an
application-layer milestone's scope - the same "needs a schema change,
not an engineering guess" framing the Stewardship milestone used for
FR-STW-07's bank-deposit comparison.

## What §16.3 names that already existed vs. genuinely didn't

§16.3's "Basonta roster view" key surface is the one item on this
milestone's list that turned out to be a **real, previously-unbuilt
gap**, not something to skip: People's `GroupMembershipController` only
ever had a `POST .../group-memberships` (assign) route - no
`GET`/list endpoint existed anywhere in the codebase before this
milestone. `RosterController`'s `GET /ministry/groups/:groupId/roster`
fills that gap, reading through the newly-exported `GroupRosterService`
rather than duplicating `GroupMembership` storage or query logic inside
Ministry.

## No `ASSISTANT_PASTOR` `CLUSTER` row on any Ministry action (a structural limitation, not an omission)

`evaluate.ts`'s `resourceInScope()` `CLUSTER` case tests
`resource.bacentaId` set-membership against `actor.clusterBacentaIds`
only - it never consults `resource.basontaId`. `GroupScopeService`
populates `basontaId` (not `bacentaId`) for a `MINISTRY`-type Group, so a
`CLUSTER`-scoped row on any Basonta-scoped Ministry action could never
actually match under any real request - it would be a decorative,
non-functional matrix row. This is a genuine structural gap: an Assistant
Pastor has no scope mechanism today to see Basontas across their cluster
(clusters are defined purely as sets of *Bacenta* group ids,
`ActorContext.clusterBacentaIds`, per Sprint 1.4's own resolution of
Open Question #1 - Basontas were never part of that mechanism). Closing
this would need either a parallel `clusterBasontaIds` set or a broader
scope-model change - deliberately not invented here, this deep into a
locked roadmap, without a specific PRD requirement driving it. Flagged
rather than silently worked around with a row that looks correct but
never fires. (Stewardship's `stewardship.project.read` CLUSTER row for
`ASSISTANT_PASTOR` has the same latent issue, structurally, for a
different reason - that resource has no `bacentaId` at all - but was not
re-examined as part of this milestone.)

## Inferred permission rows (PRD §17.3 gaps, not transcription omissions)

Same discipline as every prior module's own inferred rows - flagged at
their declaration site in `actions.ts` and summarized here:

- **All seven `ministry.*` actions.** §17.3's matrix predates the
  Ministry domain's own capabilities entirely - the only §17.3 rows
  mentioning Basonta Leader at all belong to *other* domains' actions
  (Person/Group/Gathering/Attendance/Expense), never a Ministry-specific
  one. Modeled with the same "leadership role gets `OWN_GROUP`, Resident
  Pastor gets `BRANCH` oversight" shape used throughout this codebase's
  other inferred rows, and worker-availability's `SELF` scope citing
  §16.3's own "Worker/Member" persona naming for that specific surface.

## What this milestone deliberately does not build

- **True Gathering-level overcommitment detection.** See its own section
  above - needs a per-Gathering roster-assignment schema entity that
  doesn't exist.
- **FR-MIN-02/03/04's H2 priority items were still built in full** (unlike
  some other modules' H2 deferrals) since the underlying `ministry` schema
  tables already existed, fully migrated, from Sprint 1.3 - there was no
  schema gap forcing a partial build the way FR-STW-07 or NFR-PRIV-02
  forced partial builds elsewhere.
- **A staffing-gap alert ahead of a major Gathering** (§16.3's
  "Notifications emitted... Staffing gap alert ahead of a major Gathering
  (H2)"). No scheduler exists in this codebase to evaluate "N days before
  the Gathering, is adequacy still below target" on any cadence - the
  same disclosed gap category as every other module's missing scheduler
  (Pastoral Care's silent-drift sweep, Gatherings' completeness sweep,
  Stewardship's SLA trigger, Insights' EventBridge/SQS pipeline).
  `StaffingTargetService`'s compute-on-read adequacy is available any
  time a Basonta Leader checks it manually; nothing pushes a proactive
  notification.
- **`basonta_roster.updated` as an actual emitted Engagement Signal.**
  Blueprint §10.4 names this as the "Serving" category's Ministry-side
  producer event, feeding Insights' Church Pulse. Not wired up - the same
  "no event bus exists yet" gap Insights' own design notes already
  disclose at length for the whole Engagement Signal pipeline.
- **The `ASSISTANT_PASTOR` cluster-oversight gap.** See its own section
  above - needs a scope-model extension, not built here.

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/
`prisma` execution against real `node_modules` or a live database in this
environment. Verified via the same static methods used in every prior
sprint (brace-balance and import-resolution checks across every new/
changed file this milestone, spanning `apps/api/src/modules/ministry`,
`libs/domain/ministry`, `libs/contracts`, `libs/rbac`, and the touched
files in `apps/api/src/modules/people`/`apps/api/src/modules/gatherings`).
Needs a real `pnpm install && pnpm lint && pnpm test && pnpm build` run,
and ultimately exercising these endpoints against the real local Postgres
from Sprint 1.3's verification, before this can be considered proven
correct rather than merely reviewed. This is also the last of the six
bounded-context modules - once verified, the locked roadmap's domain
build-out is complete.
