# libs/domain/people

Framework-agnostic business logic for the People bounded context (PRD
§13.1): Person identity, the lifecycle-stage state machine (PRD §12.5),
Group/GroupMembership invariants (PRD §12.3, BR-PPL-01/02/04).

Per Blueprint §6.2/§6.4, this library must depend only on `@ecclesia/contracts`
- never on another domain library, never on `libs/rbac`. Cross-domain
orchestration happens one layer up, in `apps/api`'s `people` module.

**Status (People domain milestone):** real domain logic, no database or
framework code.

| File | Purpose |
|---|---|
| `lifecycle-stage.ts` | The 7-state Member Journey state machine (PRD §12.5), transcribed edge-for-edge. `checkLifecycleTransition(from, to)` is the literal enforcement of FR-PPL-03's acceptance criterion. |
| `role-assignment-eligibility.ts` | BR-PPL-04/FR-PPL-06: Worker/Shepherd/Basonta Leader/Assistant Pastor/Resident Pastor/Treasurer (and, by inference, Acting Resident Pastor) require `lifecycle_stage = MEMBER`. Documents and resolves a real discrepancy between BR-PPL-04's prose list and FR-PPL-06's fuller list - see the file's own doc comment. |
| `group-membership-rules.ts` | BR-PPL-01/02, FR-PPL-04/05: exactly one active Bacenta membership (auto-closing the prior one), unlimited concurrent Basonta memberships. Pure decision logic - no database access. |
| `duplicate-detection.ts` | FR-PPL-02's matching rule (name+phone, or name+Bacenta+approximate age). Ships with a provisional age-tolerance placeholder, flagged the same way PRD's own silent-drift N=3/M=3 threshold is flagged as pending real calibration - see `PEOPLE_DESIGN_NOTES.md` in `apps/api/src/modules/people`. |

**Why enums are duplicated here rather than imported.** `LifecycleStage`
(this library) and `Role` (`libs/rbac`) both also exist as
`db/schema.prisma` enums and, for `Role`, as `libs/rbac/src/lib/roles.ts`.
This library cannot import from `libs/rbac` (module boundary rule) or
from Prisma's generated client (a database/apps/api-layer concern), so
its own `LifecycleStage` union is the third independent transcription of
the same PRD §12.5 state list. All three are expected to stay in sync by
convention and by each one's own test suite asserting the exact literal
list, not by a shared import - a tradeoff of the "domain library depends
only on contracts" boundary rule (Blueprint §6.2), not an oversight.
