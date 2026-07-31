# libs/domain/people

Framework-agnostic business logic for the People bounded context (PRD
§13.1): Person identity, the lifecycle-stage state machine (PRD §12.5),
Group/GroupMembership invariants (PRD §12.3, BR-PPL-01/02/04).

Per Blueprint §6.2/§6.4, this library must depend only on `@ecclesia/contracts`
- never on another domain library, never on `libs/rbac`. Cross-domain
orchestration happens one layer up, in `apps/api`'s `people` module.

**Status:** scaffolded once `apps/api`'s module skeleton exists.
