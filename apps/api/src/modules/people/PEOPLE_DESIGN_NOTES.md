# People domain — design notes

Read this alongside `libs/domain/people/README.md` (the framework-agnostic
rules this module orchestrates), `libs/rbac`'s `request-context.ts` (the
`EcclesiaRequestContext` contract this module fulfills the second half
of), and `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md` (Sprint 1.4 -
one of its two open questions, CLUSTER scope, was resolved as a follow-up
to this milestone; see "CLUSTER scope is now resolved" below. The other,
multi-Role-Assignment Persons, remains open and carries forward
unchanged). Same discipline as every prior sprint: every design choice
cites the Blueprint/PRD section it comes from, or is explicitly flagged
as inferred/unresolved.

## What this milestone builds

The first bounded-context module (PRD §13.1's People domain, Release-1/R1
priority items only - FR-PPL-01 through FR-PPL-07). `libs/rbac`'s guards
(built Sprint 1.1) and `AuthGuard`'s `ActorContext` (built Sprint 1.4) get
their first real consumer here.

| Area | File(s) | PRD/Blueprint basis |
|---|---|---|
| Lifecycle-stage state machine | `libs/domain/people/src/lib/lifecycle-stage.ts` | PRD §12.5, BR-PPL-03, FR-PPL-03 |
| Role Assignment eligibility gate | `libs/domain/people/src/lib/role-assignment-eligibility.ts` | BR-PPL-04, FR-PPL-06 |
| Group membership cardinality | `libs/domain/people/src/lib/group-membership-rules.ts` | BR-PPL-01/02, FR-PPL-04/05 |
| Duplicate-candidate matching | `libs/domain/people/src/lib/duplicate-detection.ts` | FR-PPL-02 |
| Person/lifecycle/group-membership/role-assignment Zod schemas | `libs/contracts/src/lib/people.schemas.ts` | Blueprint §6.3 |
| `EcclesiaRequestContext` assembly (shared, reusable by every future domain module) | `apps/api/src/platform/rbac/` | Inferred - see below |
| Person CRUD + lifecycle transitions | `apps/api/src/modules/people/controllers/person.controller.ts` + `services/person.service.ts` | PRD §17.3 "Person" rows |
| Bacenta/Basonta assignment (+ PRD §19.1 step 6's automatic lifecycle side effect) | `.../controllers/group-membership.controller.ts` + `services/group-membership.service.ts` | PRD §17.3 "Bacenta/Basonta: reassign member", §19.1 |
| Role Assignment grant, including the Poimen gate | `.../controllers/role-assignment.controller.ts` + `services/role-assignment.service.ts` | PRD §17.3 "Role Assignment" row, §24 OQ-02 |

## What this milestone deliberately does not build

- **FR-PPL-08 (configurable custom profile fields)** - explicitly H2 priority in PRD §13.1. `db/schema.prisma`'s `customFields` column exists (Sprint 1.3) but is not writable through `updatePersonSchema` yet.
- **FR-PPL-09 (guardian/household link workflow)** - PRD §24 OQ-01's own resolution says "schema only... no workflow or UI"; `guardianPersonId` is accepted on create/update, but no dedicated household surface is built, matching that resolution exactly.
- **Search & directory (PRD §16.1 capability)** - `GET /v1/people/:id` (single-record read) is built; role-scoped search/listing across a Branch/Bacenta is not. Deferred as a separate, genuinely different feature (pagination, filtering, and a *collection*-shaped RBAC scope check that the current `ResourceContext` model - one resource at a time - doesn't naturally express).
- **The full Person profile view (FR-PPL-07's "complete, queryable history")** - `GET /v1/people/:id` returns the Person's current fields only, not their joined Group-membership/Role-Assignment history. Building that view is straightforward on top of `PersonRepository`/`GroupMembershipRepository` but was left out to keep this milestone's surface reviewable; flagged as a near-term, low-risk follow-up, not a design gap.
- **PRD §16.1's persistent "Duplicate resolution queue" surface.** FR-PPL-02 is implemented as a *synchronous* check at `POST /v1/people` time (query candidates, 409 with the match list, caller resubmits with `overrideDuplicateCheck: true` to proceed) rather than writing candidates to a persistent, Admin-facing queue. **This is a narrower substitute, not the full requirement** - there is no `duplicate_candidates` (or equivalent) table in the Sprint 1.3 schema, and adding one is a schema change outside an application-layer milestone's scope per the locked roadmap's phase separation. Needs a decision: add the schema table (reopening Sprint 1.3), or confirm synchronous-reject-with-override is an acceptable Release-1 substitute for the persistent queue PRD §16.1 describes.

## Design decisions that are inferred, not cited (flagged explicitly)

1. **How `EcclesiaRequestContext` gets assembled.** `libs/rbac/src/lib/request-context.ts` states the contract (`actor` + `resource` + `branchConfig`) and explicitly defers *how* the latter two get populated to "each domain module as it is built." Neither document specifies a mechanism. This module's answer: `EcclesiaContextGuardBase` (`apps/api/src/platform/rbac/ecclesia-context.guard-base.ts`), an abstract Guard (must run before `RbacGuard`, since Nest runs all Guards before any Interceptor) that domain modules subclass, implementing only `loadResource()`. Built in `platform/rbac/` rather than inside the People module specifically so every future bounded-context module reuses it rather than re-solving the same problem. See that file's own doc comment for the full reasoning.
2. **`BranchConfigurationService` lives in `apps/api/src/platform/rbac/`, not `libs/config`.** `libs/config`'s own README says "per-Branch configuration access... lands alongside the Prisma/database milestone" - but Sprint 1.3 never actually populated it, and its contract (Prisma-backed? framework-agnostic with injected data access?) was never designed. Redesigning `libs/config` without evidence for its intended shape would be scope creep beyond this milestone. Recommended follow-up: migrate `BranchConfigurationService` into `libs/config` once that library's actual contract is decided.
3. **`resource.basontaId` is resolved from the *actor's* perspective, not the Person's**, when loading a Person resource for RBAC scope evaluation. See `PersonResourceContextGuard`'s own doc comment - a Person may hold several concurrent active Basonta memberships (BR-PPL-02), but `ResourceContext.basontaId` only holds one value; this guard checks whether the *specific* Basonta the acting Basonta Leader leads is among the Person's active memberships, rather than picking an arbitrary one.
4. **`RoleAssignmentController` calls `evaluate()` imperatively inside `RoleAssignmentService`, bypassing the declarative `@RequirePermission`/`RbacGuard` pipeline every other route uses.** PRD §17.3 names two different actions for what is one client-facing endpoint (`people.role_assignment.grant_shepherd` when the role being granted is `BACENTA_LEADER`, Poimen-gated; `people.role_assignment.grant` otherwise) - a static, decoration-time `@RequirePermission` cannot branch on `request.body.role`. `libs/rbac`'s own `evaluate.ts` doc comment names this exact escape hatch ("what any service-layer code should call for an imperative check outside the HTTP guard pipeline") - this is that sanctioned case.
5. **No `dto/` folder**, despite Blueprint §6.4's per-module sketch showing one. This codebase's actual contract strategy (established well before this milestone) is Zod schemas consumed directly by `ZodValidationPipe`, with no class-validator decorators anywhere to add - a `dto/` folder here would only re-export `libs/contracts` types under a different path.
6. **Duplicate-detection age tolerance (`AGE_TOLERANCE_YEARS = 2`).** FR-PPL-02 says "approximate age" with no number. Unlike PRD FR-PC-05's silent-drift thresholds (which the PRD itself flags as "N=3/M=3... provisional... pending one live calibration session"), there is no equivalent calibration commitment on record for this threshold anywhere in either document. Treated the same way regardless - an engineering placeholder, not a citation - and named here so it gets the same calibration treatment before it's relied on operationally.

## CLUSTER scope is now resolved (follow-up to this milestone)

This module's own endpoints (`people.person.read`/`update`, `people.person.lifecycle_stage.update`, `people.role_assignment.grant`/`grant_shepherd`, all with `CLUSTER`-scope rows for `ASSISTANT_PASTOR`) were the concrete reason Sprint 1.4's CLUSTER-scope gap could no longer stay open - Pastoral Care's flagship Assistant Pastor cluster view depends on it working. Fixed in `libs/rbac` (`ActorContext.clusterBacentaIds: string[]`, populated from `role_assignments.scope_group_ids`; `evaluate.ts`'s CLUSTER check now tests set membership against `resource.bacentaId` instead of equality against a `clusterId` nothing could populate) and in `ActorContextResolverService`. See `AUTH_DESIGN_NOTES.md`'s "Resolved" section for the full before/after. No changes were needed in this module's own guards/services - `PersonResourceContextGuard` and friends already populated `resource.bacentaId` correctly; they were only ever blocked by the actor side of the equation.

## One pre-existing gap (Sprint 1.4) still open, with real, concrete consequences here

**A Person with more than one concurrently active Role Assignment cannot authenticate at all** (`ActorContextResolverService` throws `ConflictException`) - so they cannot act as an actor against any People endpoint either. Deliberately not re-solved here (see `AUTH_DESIGN_NOTES.md` Open Question #1) - it needs an actual product decision (multi-role `ActorContext`? client-specified "acting as"?), not a mechanical fix like CLUSTER scope turned out to be.

## Row-Level Security is still not wired (db/DESIGN_NOTES.md Open Question #3 - now more consequential)

This module is the first to issue real queries against `people.persons` / `people.groups` / `people.group_memberships` / `people.role_assignments`. Every query in `PersonRepository`/`GroupMembershipRepository`/`RoleAssignmentRepository` filters by `branchId` (or a related record already scoped to one) explicitly in application code - this is, today, the *only* enforcement of Branch isolation. The RLS backstop Blueprint §7.3 describes (`SET LOCAL app.current_branch_id` per request, plus a non-owner Postgres role) is still not wired anywhere, exactly as `db/DESIGN_NOTES.md` already flagged. That gap was low-stakes while no domain module queried these tables; it is not anymore. Recommended as a near-term follow-up, not built in this milestone (the non-owner database role half is infrastructure/deployment work, not application code).

## Pastoral Care milestone follow-ups (this module, touched again)

The Pastoral Care milestone required three changes back in this module -
see `apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md` for
the full reasoning on each:

1. **Group (Bacenta/Basonta) CRUD backfilled.** This module previously
   only supported *assigning* a Person to a pre-existing Group, never
   creating the Group itself (FR-PC-01/FR-MIN-01) - `GroupRepository`/
   `GroupService`/`GroupController`/`GroupResourceContextGuard` added,
   plus the previously-missing `people.group.*` permission-matrix rows
   (`[INFERRED]`, no PRD §17.3 row covers Group creation).
2. **Bacenta Leader succession fixed.** `RoleAssignmentService.grant()`
   now closes a prior active `BACENTA_LEADER` assignment for the same
   Bacenta (`RoleAssignmentRepository.findActiveBacentaLeader`/
   `createWithSuccession`) instead of silently allowing two concurrently
   -active leaders, per PRD §17.2's "exactly one active Bacenta Leader per
   Bacenta at a time" and §19.4 step 6.
3. **`PersonScopeService` extracted and exported.** The Person-scope
   -resolution logic previously duplicated/reused awkwardly between
   `PersonResourceContextGuard` and `GroupMembershipResourceContextGuard`
   is now a proper injectable service, exported from `PeopleModule` so
   Pastoral Care's own resource-context guards can consume it via DI -
   the concrete instance of Blueprint §7.2's "calls that module's public
   service interface" pattern.
4. **A module-boundary violation fixed.** `RoleAssignmentRepository` used
   to query `prisma.poimenEnrollment` directly (a `pastoral_care`-schema
   table) for the Poimen gate check - `RoleAssignmentService` now injects
   Pastoral Care's exported `PoimenEnrollmentService` instead.
   `PeopleModule` and `PastoralCareModule` now import each other via
   `forwardRef` as a result - a genuine bidirectional public-service
   dependency between the two bounded contexts.

## Gatherings milestone follow-ups (this module, touched again)

The Gatherings milestone required three more changes back in this module -
see `apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md` for the
full reasoning on each:

1. **`GroupScopeService` extracted and exported.** "What RBAC scope does
   this Group belong to" was previously inline logic inside
   `GroupResourceContextGuard` (this module's own guard) - extracted into
   an injectable service, mirroring `PersonScopeService`'s own extraction
   the prior milestone, so Gatherings' guards can resolve a Bacenta/Basonta
   scope via DI whenever a Gathering/series/visitor-intake names an
   `ownerGroupId`/`groupId`/`bacentaPreferenceGroupId`, instead of
   duplicating the Group-type-to-scope mapping or reaching into
   `GroupRepository`/Prisma directly.
2. **`GroupLeadershipService` added and exported.** A single narrow
   method, `getActiveBacentaLeaderPersonId(groupId, now)`, wrapping
   `RoleAssignmentRepository.findActiveBacentaLeader` (the same lookup
   `RoleAssignmentService.grant()`'s succession logic already uses) - the
   one Role Assignment fact Gatherings' `VisitorIntakeService` needs
   (US-A2's "Follow-up task defaults to the matching Shepherd") without
   exporting `RoleAssignmentRepository` itself.
3. **`PersonService` exported (was module-private).** Gatherings'
   `VisitorIntakeService` creates and lifecycle-transitions the visitor's
   Person record through this same service, reusing FR-PPL-01's create
   path, FR-PPL-02's duplicate detection, and FR-PPL-03's state-machine
   validation unchanged, rather than writing a second Person-mutation path
   inside Gatherings.

No module-boundary violations were found this time - Gatherings only
consumes People's already-exported (or newly-exported) services, the same
pattern established fixing Pastoral Care's earlier violation.

## Stewardship milestone follow-up (this module, touched again - by reference, not by edit)

Unlike Pastoral Care and Gatherings, the Stewardship milestone required
**no changes** to this module - `GroupScopeService` and `PersonScopeService`
(both already exported) were consumed exactly as-is by Stewardship's
Financial Transaction and Expense resource-context guards respectively.
See `apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md`'s
"Cross-module consumption" section for the specifics. No module-boundary
violation was found this time either.

## Ministry milestone follow-up (this module, touched again)

Like Pastoral Care and Gatherings before it, the Ministry milestone
needed one genuinely new export - `GroupScopeService` alone was not
enough this time:

1. **`GroupRosterService` added and exported.** Three methods
   (`countActiveMembers`, `listActiveMembers`,
   `countActiveMinistryMembershipsForPerson`), wrapping three new
   `GroupMembershipRepository` query methods
   (`countActiveByGroup`/`listActiveByGroup`/
   `countActiveMinistryMembershipsForPerson`) added alongside the
   existing `applyChange`. Ministry's `StaffingTargetService` (FR-MIN-03's
   adequacy ratio) and `RosterService` (FR-MIN-01's roster view, FR-MIN-04's
   overcommitment flag) all need "which/how many Persons are actively
   rostered" - `GroupMembership` data this module already owns, that no
   prior export exposed a read path for. "Active" uses the exact same
   `endedAt IS NULL` definition `GroupMembershipService` itself already
   applies for BR-PPL-01/02 - no new activeness concept invented.

Considered and rejected: adding a Basonta-Leader-lookup method to
`GroupLeadershipService` (its one existing method,
`getActiveBacentaLeaderPersonId`, is Bacenta-specific by name and by the
repository call it wraps). Ministry's actual endpoints turned out not to
need "who leads this Basonta" at all - RBAC's `OWN_GROUP` scope check
already resolves "is the actor the leader of this specific Group" via
`ActorContext.basontaId`/`ResourceContext.basontaId` equality, with no
lookup required at the service layer. See
`apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md` for the full
reasoning. No module-boundary violation was found this time either.

## Resolved (People Web Admin sprint)

Building `apps/web-admin`'s People directory/profile pages surfaced three
real read-path gaps this module's write side already anticipated but
never exposed over HTTP:

1. **No `GET /people` at all.** PRD §16.1's "Search & directory"
   capability ("a Shepherd searches within their Bacenta context by
   default; an Admin searches the whole Branch") had no backing route.
   Added `GET /people` (`PersonController.list`), reusing the existing
   `people.person.read` action/scope rows unchanged - `groupId` query
   param (OWN_GROUP/CLUSTER-scoped roles, resolved via `GroupScopeService`
   and, for the actual roster, `GroupRosterService.listActiveMembers` -
   People's own already-exported service) or its absence (BRANCH-scoped
   roles, falls back to the actor's Branch) selects which. `search` is a
   plain case-insensitive first/last-name substring match -
   `[Design Decision]`, not a PRD-specified algorithm.
2. **`GET /people/:personId/group-memberships` and
   `GET /people/:personId/role-assignments` didn't exist** - both
   controllers had a `POST` (write) only. FR-PPL-07 explicitly requires
   "a complete, queryable history... including closed/past ones" for
   both record types, and PRD §16.1's Person profile view names "role
   history" as a shown field. Added both as ordinary declaratively-RBAC'd
   `GET` routes; `people.group_membership.read` is a brand-new action
   (mirroring `.update`'s existing scope rows exactly), and
   `people.role_assignment.read` already existed but only had an ADMIN
   row.
3. **[Bug fix]** `people.role_assignment.read` granted only ADMIN, even
   though RESIDENT_PASTOR/ASSISTANT_PASTOR both hold
   `.grant`/`.update` for the same resource. Added matching `.read` rows
   at the same scopes (BRANCH/CLUSTER) - a role able to grant/update a
   Role Assignment being unable to read what it granted is inconsistent
   with every other grant+read pairing already in the matrix. Also added
   WORKER/MEMBER SELF-scope rows to both new `.read` actions, matching
   `people.person.read`'s existing SELF rows for those two roles.

See `libs/rbac/src/lib/permission-matrix.ts`'s own inline comments at
each new row, and `apps/web-admin/src/app/pages/People/PEOPLE_PAGE_DESIGN_NOTES.md`
for the client side of this.

## Ministry Web Admin sprint follow-up (this module, touched again)

Building the Ministry web-admin page's Basonta directory surfaced a real
gap: `GroupRepository`/`GroupService`/`GroupController` had `create`,
`getById`, and `update` but **no way to list Groups at all** - a caller
had to already know a specific Group id. Added `GET /groups`
(`GroupController.list`, `GroupListResourceContextGuard`,
`GroupRepository.findByBranch`, `listGroupsQuerySchema`'s optional `type`
filter), reusing the existing `people.group.read` action/scope rows
unchanged. Deliberately always resolves to the actor's own Branch (no
OWN_GROUP/CLUSTER case, unlike `GET /people`'s `groupId`-driven branching)
- see `GroupListResourceContextGuard`'s own doc comment for why a
*listing* route has no single Group to resolve an OWN_GROUP/CLUSTER scope
from, and `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`'s
"Resolved (Ministry Web Admin sprint)" section for the Ministry-side
reasoning this served.

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/`prisma` execution against real `node_modules` or a live database in this environment. Verified via the same static methods used in Sprints 1.2-1.4 (brace-balance and import-resolution checks). Needs a real `pnpm install && pnpm lint && pnpm test && pnpm build` run, and ultimately exercising these endpoints against the real local Postgres from Sprint 1.3's verification, before this can be considered proven correct rather than merely reviewed.
