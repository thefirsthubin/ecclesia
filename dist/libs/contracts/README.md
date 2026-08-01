# libs/contracts

Shared DTOs and Zod schemas (Blueprint §6.3): the single source of truth
for API request/response shapes and the Engagement Signal envelope
(Blueprint §10.3), consumed by `apps/api`, `apps/worker`, `apps/mobile`,
and `apps/web-admin` alike. A leaf library - depends on nothing else in
the workspace.

**Status (People domain milestone):** `people.schemas.ts` holds the first
real Zod schemas - Person create/update/response, lifecycle-transition,
group-membership, and role-assignment request/response shapes for the
People bounded context (PRD §13.1). Consumed by `apps/api`'s
`ZodValidationPipe` at the API boundary and by the People module's
services for their own response shaping. `LifecycleStage`/`Role` enums
are re-declared here rather than imported from `libs/domain/people` /
`libs/rbac` - see that file's own doc comment for why (this library's
"depends on nothing else in the workspace" leaf-library rule).
