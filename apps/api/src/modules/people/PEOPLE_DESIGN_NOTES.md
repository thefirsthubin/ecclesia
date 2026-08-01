# People domain — design notes

Read this alongside `libs/domain/people/README.md` (the framework-agnostic
rules this module orchestrates), `libs/rbac`'s `request-context.ts` (the
`EcclesiaRequestContext` contract this module fulfills the second half
of), and `apps/api/src/platform/auth/AUTH_DESIGN_NOTES.md` (Sprint 1.4 -
two of its open questions carry forward unchanged into this module, noted
below). Same discipline as every prior sprint: every design choice cites
the Blueprint/PRD section it comes from, or is explicitly flagged as
inferred/unresolved.

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

## Two pre-existing gaps (Sprint 1.4) that now have real, concrete consequences

Both were already disclosed in `AUTH_DESIGN_NOTES.md`; restated here because this module is the first place they actually bite:

1. **CLUSTER scope always denies.** Every `ASSISTANT_PASTOR` row in the permission matrix that this module's endpoints check (`people.person.read`/`update` at `CLUSTER` scope, `people.person.lifecycle_stage.update` at `CLUSTER` scope, `people.role_assignment.grant`/`grant_shepherd` at `CLUSTER` scope) will deny an Assistant Pastor acting on a Person outside their own led Bacenta, even a Person legitimately within their cluster, until the CLUSTER-scope schema gap is resolved. Assistant Pastors can still act on Persons within a Bacenta they personally lead (`OWN_GROUP`, if they also hold a `BACENTA_LEADER` assignment) or, more likely in practice, this is simply non-functional for them today.
2. **A Person with more than one concurrently active Role Assignment cannot authenticate at all** (`ActorContextResolverService` throws `ConflictException`) - so they cannot act as an actor against any People endpoint either. Not re-solved here; same open product decision as before.

## Row-Level Security is still not wired (db/DESIGN_NOTES.md Open Question #3 - now more consequential)

This module is the first to issue real queries against `people.persons` / `people.groups` / `people.group_memberships` / `people.role_assignments`. Every query in `PersonRepository`/`GroupMembershipRepository`/`RoleAssignmentRepository` filters by `branchId` (or a related record already scoped to one) explicitly in application code - this is, today, the *only* enforcement of Branch isolation. The RLS backstop Blueprint §7.3 describes (`SET LOCAL app.current_branch_id` per request, plus a non-owner Postgres role) is still not wired anywhere, exactly as `db/DESIGN_NOTES.md` already flagged. That gap was low-stakes while no domain module queried these tables; it is not anymore. Recommended as a near-term follow-up, not built in this milestone (the non-owner database role half is infrastructure/deployment work, not application code).

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/`prisma` execution against real `node_modules` or a live database in this environment. Verified via the same static methods used in Sprints 1.2-1.4 (brace-balance and import-resolution checks). Needs a real `pnpm install && pnpm lint && pnpm test && pnpm build` run, and ultimately exercising these endpoints against the real local Postgres from Sprint 1.3's verification, before this can be considered proven correct rather than merely reviewed.
