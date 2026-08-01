# libs/domain/stewardship

Framework-agnostic business logic for Stewardship (PRD §13.5):

- `financial-transaction-status.ts` - the two PRD §12.7 state machines
  under the single `FinancialTransaction` entity: the inbound sub-flow
  (`RECORDED` -> `VERIFIED`/`FLAGGED` -> `RECONCILED`, with
  `FLAGGED` -> `UNDER_INVESTIGATION` for an unresolved discrepancy) and
  the outbound/Expense sub-flow (`REQUESTED` -> `APPROVED`/`REJECTED` ->
  `PAID` -> `RECEIPT_RETAINED`). `[BLUEPRINT-EXACT]` transitions,
  `[INFERRED]` SCREAMING_SNAKE_CASE casing (the PRD's own Mermaid diagrams
  use PascalCase) - see the module's own doc comment.

BR-STW-04's same-actor-verification check (the record-level rule, not the
state machine) lives in `libs/rbac`'s `record-level-checks.ts`
(`DIFFERENT_ACTOR_THAN_RECORDER`), not here - Blueprint §9.4's own
separation between "domain state machine" and "authorization policy."

Depends only on `@ecclesia/contracts`, same rule as every other
`libs/domain/*` library.

**Status:** real domain logic (Stewardship domain-modeling milestone).
