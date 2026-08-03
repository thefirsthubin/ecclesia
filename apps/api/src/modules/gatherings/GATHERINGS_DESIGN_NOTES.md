# Gatherings domain — design notes

Read this alongside `libs/domain/gatherings/README.md` (the
framework-agnostic rules this module orchestrates) and both
`apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md` and
`apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md` (the two
modules this one consumes public services from - see "Cross-module
consumption" below). Same discipline as every prior sprint: every design
choice cites the Blueprint/PRD section it comes from, or is explicitly
flagged as inferred/unresolved.

## What this milestone builds

The third bounded-context module (PRD §13.4's Gatherings domain).

| Area | File(s) | PRD/Blueprint basis |
|---|---|---|
| Attendance-completeness window check | `libs/domain/gatherings/src/lib/attendance-completeness.ts` | FR-GTH-05, US-D3 |
| Gathering status transition model | `libs/domain/gatherings/src/lib/gathering-status.ts` | §12.4 (`[INFERRED]` forward-only model, see below) |
| Gathering/GatheringSeries/AttendanceRecord/VisitorIntake Zod schemas | `libs/contracts/src/lib/gatherings.schemas.ts` | Blueprint §6.3 |
| GatheringSeries create/read | `controllers/gathering-series.controller.ts` + `services/gathering-series.service.ts` | FR-GTH-02, §12.4 |
| Gathering create/read/update | `controllers/gathering.controller.ts` + `services/gathering.service.ts` | FR-GTH-01, §12.4 |
| Attendance record/list/completeness-check | `controllers/attendance-record.controller.ts` + `services/attendance-record.service.ts` | FR-GTH-03/05, BR-GTH-01 |
| Visitor intake (Person creation + conditional Follow-up task) | `controllers/visitor-intake.controller.ts` + `services/visitor-intake.service.ts` | FR-GTH-04/BR-GTH-03, US-A1/US-A2 |
| `GroupScopeService`, People's exported public service interface | `apps/api/src/modules/people/services/group-scope.service.ts` | Blueprint §7.2 |
| `GroupLeadershipService`, People's exported public service interface | `apps/api/src/modules/people/services/group-leadership.service.ts` | Blueprint §7.2, US-A2 |
| `PersonService` exported from People (was private) | `apps/api/src/modules/people/people.module.ts` | Blueprint §7.2 |
| `FollowUpTaskService` exported from Pastoral Care (was private) | `apps/api/src/modules/pastoral-care/pastoral-care.module.ts` | Blueprint §7.2 |

## Cross-module consumption (Blueprint §7.2), not duplication

`GatheringsModule` imports both `PeopleModule` and `PastoralCareModule` as
ordinary imports (no `forwardRef` - neither of those two modules needs
anything from Gatherings, so there is no cycle to break, unlike the
bidirectional People/Pastoral Care dependency documented in
`PASTORAL_CARE_DESIGN_NOTES.md`). Three services are consumed rather than
re-implemented:

- **`GroupScopeService` (People, newly extracted this milestone).**
  Gatherings' own guards (`GatheringCreateResourceContextGuard`,
  `GatheringResourceContextGuard`, `GatheringSeriesCreateResourceContextGuard`,
  `GatheringSeriesResourceContextGuard`, `AttendanceResourceContextGuard`,
  `VisitorIntakeResourceContextGuard`) all need "what RBAC scope does this
  Bacenta/Basonta Group belong to" whenever a Gathering, series, or visitor
  intake names an `ownerGroupId`/`groupId`/`bacentaPreferenceGroupId`. This
  is the exact same lookup `GroupResourceContextGuard` (People) already had
  inline - extracted into an injectable service (mirroring
  `PersonScopeService`'s own extraction the prior milestone) so Gatherings
  consumes it via DI instead of duplicating the Group-type-to-`bacentaId`/
  `basontaId` mapping logic, or reaching into `GroupRepository`/Prisma
  directly.
- **`GroupLeadershipService` (People, new).** `VisitorIntakeService` needs
  "who currently leads this Bacenta" to resolve US-A2's "Follow-up task
  defaults to the matching Shepherd" when a visitor names a Bacenta
  preference. Wraps `RoleAssignmentRepository.findActiveBacentaLeader` -
  the same lookup `RoleAssignmentService.grant()`'s own succession logic
  already uses (built the Pastoral Care milestone) - rather than exporting
  `RoleAssignmentRepository` itself.
- **`PersonService` (People, newly exported).** `VisitorIntakeService`
  creates the Person via `PersonService.create()`, reusing FR-PPL-01's
  create path and FR-PPL-02's duplicate detection unchanged, then calls
  `PersonService.transitionLifecycleStage()` to move a confirmed first-time
  attendee to `FIRST_TIME_GUEST` - reusing FR-PPL-03's state-machine
  validation rather than writing a second, parallel Person-lifecycle
  mutation path inside Gatherings.
- **`FollowUpTaskService` (Pastoral Care, newly exported).**
  `VisitorIntakeService` calls `FollowUpTaskService.create()` for US-A1's
  "automatic Follow-up task" outcome, reusing FR-PC-03/04's SLA-computation
  and persistence logic rather than writing a second Follow-up-task writer
  inside Gatherings (which would also violate schema ownership -
  `pastoral_care.follow_up_tasks` belongs to Pastoral Care, not Gatherings).

## FR-GTH-04/US-A2: why the auto-created Follow-up task is conditional

`VisitorIntakeService.submit()` always creates the Person (FR-GTH-04 is
fully satisfied regardless), but only auto-creates a Follow-up task when
**both** `firstTimeGuest` is true **and** a `bacentaPreferenceGroupId` is
supplied **and** `GroupLeadershipService.getActiveBacentaLeaderPersonId()`
resolves to an active Shepherd. This is US-A2's exact, concretely-specified
path: "Given a visitor form indicates a Bacenta preference... then the
Follow-up task defaults to the matching Shepherd." When no preference is
given, §19.1 step 3's "rotation among Shepherds if no preference given"
fallback has no buildable algorithm behind it - the same gap
`PASTORAL_CARE_DESIGN_NOTES.md` already flagged as needing a product
decision, restated here since visitor intake is the concrete call site it
blocks. This service does not invent a rotation scheme. The response's
`followUpTaskCreated: boolean` field tells the caller which case occurred,
so a UI can prompt an Usher/Admin to assign a Follow-up task manually when
it's `false`.

## The "Usher" role gap (found, not fixed)

PRD narrative (§16.4, the persona list, and FR-GTH-03/FR-GTH-04's own
acceptance criteria) repeatedly names "Usher" as the actor who records
attendance and captures visitor intake forms. `libs/rbac/src/lib/roles.ts`'s
`ROLES` array has no `USHER` entry, and §17.3's permission-matrix column
headers omit it too - this predates this milestone (Sprint 1.1 built the
role catalog from §17.3's literal column headers) but is the first
milestone where it concretely blocks something: there is no role to assign
`gatherings.attendance.create`/`gatherings.visitor_intake.create` to that
matches the PRD's own narrative. `permission-matrix.ts` instead grants
those actions to `BACENTA_LEADER`/`BASONTA_LEADER` (whose Bacenta/Basonta
these Gatherings usually belong to) and `ASSISTANT_PASTOR`/`ADMIN` at wider
scopes - a reasonable stand-in, not a citation. **Needs a product decision**
on whether `USHER` should be added to the canonical Role catalog, which
would also require revisiting §17.3's permission matrix at its source
rather than inferring rows for a role that doesn't formally exist.

## Recurrence-rule format gap (found, not fixed)

PRD §12.4 requires recurring Gathering series ("define recurring series;
manage individual instance exceptions") but never specifies
`recurrenceRule`'s format (RRULE? a custom DSL?) or an expansion algorithm
for turning one series definition into dated `Gathering` instances.
`GatheringSeriesService` stores `recurrenceRule` as an opaque string and
does **not** auto-generate instances from it; `Gathering` instances are
always created explicitly via `GatheringService.create()`, optionally
referencing a series' `seriesId`. This still fully satisfies §12.4's own
edge case ("any one of which can be individually cancelled or reassigned
without altering the series definition") - `GatheringService.update()`
only ever touches the single instance row identified by `id`, never the
series. **Needs a product decision** on the recurrence format before an
expansion algorithm can be built.

## What this milestone deliberately does not build

- **The Branch-wide attendance-completeness sweep/report and reminder
  notification.** FR-GTH-05/§16.4 describe flagging *all* Gatherings with
  incomplete attendance past the window, with a reminder surfaced to the
  relevant leader. `AttendanceRecordService.checkCompleteness()` only
  evaluates a single named Gathering (`evaluateAttendanceCompleteness()`,
  `libs/domain/gatherings`) - there is no scheduled sweep job, no
  aggregate "all incomplete Gatherings this week" query, and no
  notification delivery mechanism in this codebase yet (the same "no
  scheduler exists" gap `PASTORAL_CARE_DESIGN_NOTES.md` already flagged
  for the silent-drift sweep). The per-Gathering check is the buildable
  unit; the sweep is a scheduling/notification-infrastructure concern this
  milestone doesn't invent.
- **FR-GTH-06's OnlineGathering special handling.** Named H3 priority in
  PRD §13.4. On inspection this is trivially satisfied by the existing
  generic `Gathering` model: `type` is a Branch-configured string (not a
  fixed enum, per §12.4's own implementation note), so "Online Service" is
  just another configured `type` value, and `venue` doubles as a
  meeting-link field with no schema change needed. No special code was
  required or written.
- **A `SilentDriftFlag`/attendance-count consumer for Pastoral Care.**
  This milestone finally makes `gatherings.attendance_records` real, which
  was the cross-domain dependency `PASTORAL_CARE_DESIGN_NOTES.md` flagged
  as blocking the silent-drift sweep - but wiring `evaluateSilentDrift()`
  up to real attendance counts is Pastoral Care's own follow-up work, not
  built here (this milestone only produces the data; consuming it belongs
  to the module that owns `SilentDriftFlag`).

## Ministry milestone follow-up (this module, touched again)

The Ministry milestone required one small addition here - the first time
this module exports anything. `GatheringScopeService.loadScope(gatheringId)`
(one method, `{ branchId }`) was extracted so Ministry's
`StaffingTargetService` (FR-MIN-02) can validate a client-supplied
`gatheringId` exists and belongs to the correct Branch before writing a
`StaffingTarget` row, without reaching into `GatheringRepository`/Prisma
directly - the same schema-ownership rule every other cross-module
consumption in this codebase already follows. Deliberately a narrower
shape than `GroupScopeService`'s `ResourceContext` (`branchId` only, no
`bacentaId`/`basontaId`) since it is not used for RBAC scope resolution -
a `StaffingTarget`'s scope is its target Group, not the Gathering it
references. See
`apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.

## Resolved (Gatherings Web Admin sprint)

Building `apps/web-admin`'s Gathering calendar (§16.4's "upcoming and
past Gatherings, filterable by type and Group... All operator roles")
surfaced two real gaps:

1. **`GET /gatherings` had no BRANCH-wide case at all.** `ownerGroupId`
   was required, so a BRANCH-scoped actor (Resident Pastor, and now
   Admin - see below) had no way to list Gatherings without already
   knowing a specific Bacenta/Basonta's id, and a Branch-wide Gathering
   (Sunday Service, `ownerGroupId` null) could never appear in any list
   result at all. The identical shape of gap `GET /people`,
   `GET /pastoral-care/follow-up-tasks`, and `GET /groups` each already
   closed for their own domains. Made `ownerGroupId` optional
   (`listGatheringsQuerySchema`); its absence now falls back to
   `GatheringRepository.listByBranchAndRange` (new), resolved via
   `GatheringListResourceContextGuard`'s new Branch fallback branch (same
   shape as `PersonListResourceContextGuard`). Also added an optional
   `type` exact-match filter - the other half of §16.4's "filterable by
   type and Group" - to both `listByGroupAndRange` and the new
   `listByBranchAndRange`. `GatheringController.listForGroup`/
   `GatheringService.listForGroup` were renamed to `list`/`list(actor,
   query)` since the method no longer only serves the Group-scoped case;
   `GET /gatherings?ownerGroupId=...` callers (the Shepherd Dashboard's
   Today's-Meeting/Attendance-Summary cards) are unaffected - same URL,
   same response shape.
2. **[Bug fix]** `gatherings.gathering.read` and `gatherings.attendance.read`
   both had RESIDENT_PASTOR create/read parity but **no ADMIN row at
   all**, even though ADMIN already held `.create`/`.update` on both
   actions - the same class of gap the Shepherd Dashboard sprint fixed
   for BACENTA_LEADER on these same two actions (see those rows'
   own `reason` fields, immediately above the new ADMIN ones). Added
   matching ADMIN BRANCH rows to both - needed so the web-admin calendar
   can show per-Gathering attendance-completeness status
   (`GET .../attendance-records/completeness`) for an Admin, not only a
   Resident Pastor.

See `apps/web-admin/src/app/pages/Gatherings/GATHERINGS_PAGE_DESIGN_NOTES.md`
for the client side, including why Attendance Capture and Visitor Intake
are not built on web-admin this pass (both are Usher-primary flows, and
the "Usher role gap" this file already discloses above blocks them
structurally, not just by choice).

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/
`prisma` execution against real `node_modules` or a live database in this
environment. Verified via the same static methods used in every prior
sprint (brace-balance and import-resolution checks across every new/changed
file this milestone, including the People/Pastoral Care export changes).
Needs a real `pnpm install && pnpm lint && pnpm test && pnpm build` run, and
ultimately exercising these endpoints against the real local Postgres from
Sprint 1.3's verification, before this can be considered proven correct
rather than merely reviewed.
