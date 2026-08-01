# Pastoral Care domain — design notes

Read this alongside `libs/domain/pastoral-care/README.md` (the
framework-agnostic rules this module orchestrates) and
`apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md` (the module this one
has a bidirectional dependency on - see "Why `forwardRef`" below). Same
discipline as every prior sprint: every design choice cites the
Blueprint/PRD section it comes from, or is explicitly flagged as
inferred/unresolved.

## What this milestone builds

The second bounded-context module (PRD §13.2's Pastoral Care domain).

| Area | File(s) | PRD/Blueprint basis |
|---|---|---|
| Silent-drift decision tree | `libs/domain/pastoral-care/src/lib/silent-drift.ts` | PRD §15.8, BR-PC-02, FR-PC-05 |
| Follow-up task trigger/SLA/escalation rules | `libs/domain/pastoral-care/src/lib/follow-up-task.ts` | FR-PC-03, FR-PC-04/BR-PC-04, OQ-06 |
| Poimen status progression | `libs/domain/pastoral-care/src/lib/poimen-enrollment.ts` | FR-PC-06 |
| Poimen/Follow-up-task/Pastoral-note Zod schemas | `libs/contracts/src/lib/pastoral-care.schemas.ts` | Blueprint §6.3 |
| Poimen enrollment CRUD | `controllers/poimen-enrollment.controller.ts` + `services/poimen-enrollment.service.ts` | FR-PC-06 |
| Follow-up task creation/completion/escalation | `controllers/follow-up-task.controller.ts` + `services/follow-up-task.service.ts` | FR-PC-03/04, BR-PC-04 |
| Pastoral notes create/list | `controllers/pastoral-note.controller.ts` + `services/pastoral-note.service.ts` | §16.2, NFR-PRIV-01 |
| Group (Bacenta/Basonta) CRUD, backfilled into People | `apps/api/src/modules/people/{controllers,services,repositories}/group*.ts` | FR-PC-01, FR-MIN-01 |
| Bacenta Leader succession, backfilled into People | `apps/api/src/modules/people/repositories/role-assignment.repository.ts` (`findActiveBacentaLeader`/`createWithSuccession`) | PRD §17.2, §19.4 step 6 |
| `PersonScopeService`, People's exported public service interface | `apps/api/src/modules/people/services/person-scope.service.ts` | Blueprint §7.2 |

## Two People-module gaps this milestone found and fixed

This module's own design surfaced two pre-existing gaps in the People
module (built the prior milestone) that had to be closed before Pastoral
Care's own endpoints could be built correctly on top of them:

1. **People never built Group (Bacenta/Basonta) creation** - only
   assignment of a Person to a pre-existing Group. FR-PC-01/FR-MIN-01
   require creating the Group itself. Backfilled as `GroupRepository`/
   `GroupService`/`GroupController` inside the People module (`people.groups`
   is People-schema-owned per Blueprint §7.2's mapping table, so it belongs
   there, not in Pastoral Care, even though FR-PC-01 is a Pastoral Care
   requirement). See "Inferred permission rows" below for the RBAC gap this
   also required closing.
2. **`RoleAssignmentService.grant()` never closed a prior active
   `BACENTA_LEADER` assignment for the same Bacenta when granting a new
   one**, silently allowing PRD §17.2's "exactly one active Bacenta Leader
   per Bacenta at a time" invariant to be violated - the exact succession
   scenario PRD §19.4 step 6 describes ("the prior Bacenta Leader ... has
   their Role Assignment closed with an end date"). Fixed with
   `RoleAssignmentRepository.findActiveBacentaLeader`/`createWithSuccession`
   (a transactional close-then-open, the same pattern
   `GroupMembershipRepository.applyChange` already used for FR-PPL-04's
   equivalent Group Membership invariant) and wired into
   `RoleAssignmentService.grant()`.

## A module-boundary violation this milestone found and fixed

**People's `RoleAssignmentRepository` used to query
`prisma.poimenEnrollment` directly** (`findPoimenStatus`), reading a table
Blueprint §7.2 assigns to the `pastoral_care` schema/module, not `people`
- a violation of the stated rule that "a module's repository code only
ever queries its own schema directly." This was introduced during the
People milestone (before `PoimenEnrollmentService` existed to consume
instead) and is fixed here: `RoleAssignmentService` now injects Pastoral
Care's exported `PoimenEnrollmentService.getStatus()` instead.

**Why `forwardRef(() => PeopleModule)` / `forwardRef(() => PastoralCareModule)`
on both sides.** Fixing the violation above created a genuine
bidirectional dependency: `PeopleModule`'s `RoleAssignmentService` needs
Pastoral Care's `PoimenEnrollmentService` (the Poimen gate check), and
`PastoralCareModule`'s own resource-context guards
(`PoimenEnrollmentResourceContextGuard`, `FollowUpTaskCreateResourceContextGuard`/
`FollowUpTaskResourceContextGuard`, `PastoralNoteResourceContextGuard`) need
People's `PersonScopeService` to resolve "which Bacenta/Basonta is this
resource about" for a candidate/subject Person. Two modules needing each
other's public service interface is a real property of these two bounded
contexts, not an accident of file organization - `forwardRef` is Nest's
documented mechanism for exactly this (both `@Module()` decorators list
each other in `imports`; no individual provider's own constructor forms an
unresolvable cycle, since `PoimenEnrollmentService` itself injects nothing
from People).

## `PersonScopeService` - extracted this milestone

Previously, "resolve a target Person's `bacentaId`/`basontaId` for RBAC
scope checking" was a plain exported function
(`loadPersonResourceContext`) in `person-resource-context.guard.ts`,
reused awkwardly by `GroupMembershipResourceContextGuard` importing it
directly. Extracted into a proper injectable `PersonScopeService`,
exported from `PeopleModule`, so every Pastoral Care resource-context
guard (and `FollowUpTaskService`/`PastoralNoteService`, which also need a
subject Person's `branchId`) consumes it via DI instead of reaching into
People's `PersonRepository`/Prisma layer directly. This is the concrete
instance of Blueprint §7.2's "calls that module's public service
interface" pattern that this milestone's own architecture required
getting right before Pastoral Care could be built without repeating
People's own earlier mistake.

## Inferred permission rows (PRD §17.3 gaps, not transcription omissions)

PRD §17.3's permission matrix has no row for two capabilities this
milestone needed:

- **Group creation** (`people.group.create/read/update`). §17.3 has a
  "Bacenta/Basonta: reassign member" row but none for creating the Group
  entity itself. Modeled as: RESIDENT_PASTOR/ADMIN create+read+update at
  BRANCH; ASSISTANT_PASTOR read+update at CLUSTER only (deliberately no
  create authority - deciding which cluster a brand-new Bacenta belongs to
  is itself unresolved, `db/DESIGN_NOTES.md` Open Question #1);
  BACENTA_LEADER/BASONTA_LEADER read+update at OWN_GROUP.
- **Poimen enrollment tracking** (`pastoral_care.poimen_enrollment.create/read/update`).
  §19.4's workflow narrative names "Resident Pastor or Assistant Pastor...
  Admin (record-keeping support)" as the actors, but §17.3's matrix has no
  corresponding row. Modeled the same shape as `pastoral_care.notes.*`
  immediately above it in `permission-matrix.ts`: RESIDENT_PASTOR at
  BRANCH, ASSISTANT_PASTOR at CLUSTER, ADMIN limited to read+update
  (record-keeping support, not initiating enrollment) per §19.4's own
  phrasing.

Both are marked `[INFERRED - no PRD §17.3 row covers this]` at their
declaration sites in `libs/rbac/src/lib/actions.ts` and
`permission-matrix.ts`.

## What this milestone deliberately does not build

- **FR-PC-03's automatic Follow-up task creation trigger, with its
  default-assignee resolution.** §19.1 step 3: a First-Time-Guest's
  Follow-up task is "assigned by default rule (geographic/Bacenta
  preference, or a rotation among Shepherds if no preference given)."
  There is no concrete, buildable algorithm for this anywhere in the PRD -
  no rotation-state field exists in `db/schema.prisma`, and "geographic
  preference" is not a captured Person field. `FollowUpTaskService.create()`
  requires an explicit `assignedToPersonId` on every call; it is not wired
  into `PersonService.transitionLifecycleStage` as an automatic side
  effect. `libs/domain/pastoral-care`'s `determineFollowUpTaskTrigger()`
  is ready to consume once a default-assignee resolution exists. **Needs a
  product decision**, not an engineering guess.
- **BR-PC-04's automatic escalation-target resolution.** "Escalates to the
  assigned Person's organizational superior (typically Shepherd ->
  Assistant Pastor)" requires an org-hierarchy lookup (who is this
  Shepherd's Assistant Pastor?) that is not modeled anywhere in the schema
  - Role Assignment scoping (`scope_group_ids`) describes *what* an
  Assistant Pastor oversees, not a direct reporting-line pointer from a
  specific Bacenta Leader to a specific Assistant Pastor.
  `FollowUpTaskService.escalate()` requires the caller to supply
  `escalatedToPersonId` explicitly rather than inventing that resolution.
  `libs/domain/pastoral-care`'s `isFollowUpTaskPastSla()` is ready to
  consume once both a scheduler and this resolution exist.
- **The automatic silent-drift sweep itself (§19.3's "scheduled evaluation
  run, e.g. nightly").** `evaluateSilentDrift()` (`libs/domain/pastoral-care`)
  is a pure function ready to consume attendance *counts* as input - but
  the actual source of those counts, `gatherings.attendance_records`,
  does not exist yet (the Gatherings domain is unbuilt). No
  `SilentDriftFlag` repository/service/controller is built this milestone
  for the same reason: there is nothing real to trigger it against yet.
  This is a genuine cross-domain dependency gap, not an oversight -
  revisit once Gatherings exists.
- **FR-PC-06's hard-gate-vs-soft-input UI surface** for viewing "all
  Poimen-eligible candidates for Shepherd appointment" (H2 priority per
  PRD §13.2's own acceptance criteria) - the underlying data
  (`PoimenEnrollmentService.getStatus`) exists and is already consumed by
  the Poimen gate; the aggregate candidate-list view is a Release-2
  surface, not built here.
- **FollowUpTaskStatus's richer outcome taxonomy.** FR-PC-04's acceptance
  criteria names specific outcomes ("reconnected, no response, not
  interested, assigned to Bacenta") but `db/schema.prisma`'s
  `FollowUpTaskStatus` enum (`OPEN`/`ESCALATED`/`COMPLETED`) is a
  `[PRD-DERIVED]` "reasonable minimal set," not an exact transcription -
  a pre-existing Sprint 1.3 schema decision, not something this milestone
  redesigns. `complete()` moves a task to the single terminal `COMPLETED`
  state regardless of which specific outcome applied.

## Gatherings milestone follow-up (this module, touched again)

`FollowUpTaskService` is now additionally exported from `PastoralCareModule`
(previously only `PoimenEnrollmentService` was) - see
`apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md`. Gatherings'
`VisitorIntakeService` consumes it for US-A1/FR-GTH-04's automatic
Follow-up task, reusing FR-PC-03/04's SLA-computation and persistence logic
unchanged rather than a second Follow-up-task writer inside Gatherings (which
would also violate schema ownership - `pastoral_care.follow_up_tasks`
belongs to this module, not Gatherings). No change to `FollowUpTaskService`
itself was required; every call still requires an explicit
`assignedToPersonId`, so this milestone's own conditional-auto-creation
logic (documented in `GATHERINGS_DESIGN_NOTES.md`) sits entirely on the
calling side.

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/
`prisma` execution against real `node_modules` or a live database in this
environment. Verified via the same static methods used in every prior
sprint (brace-balance and import-resolution checks, ~90 touched/created
files this milestone). Needs a real
`pnpm install && pnpm lint && pnpm test && pnpm build` run, and ultimately
exercising these endpoints against the real local Postgres from Sprint
1.3's verification, before this can be considered proven correct rather
than merely reviewed.
