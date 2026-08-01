# Stewardship domain — design notes

Read this alongside `libs/domain/stewardship/README.md` (the
framework-agnostic state machines this module orchestrates) and
`apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md` (the module this one
consumes public services from - see "Cross-module consumption" below).
Same discipline as every prior sprint: every design choice cites the
Blueprint/PRD section it comes from, or is explicitly flagged as
inferred/unresolved.

## Why Stewardship, not Ministry or Insights

The locked roadmap left the order of Ministry/Gatherings/Stewardship/
Insights undecided. Gatherings went first (documented in its own design
notes). Stewardship went next, ahead of Ministry and Insights, because its
RBAC groundwork had been sitting unused since Sprint 1.1: `libs/rbac`
explicitly built BR-STW-04's same-actor record-level check
(`DIFFERENT_ACTOR_THAN_RECORDER`) and transcribed the full Financial
Transaction/Expense permission-matrix rows as Blueprint §9.3's own worked
example, before any Stewardship module existed to consume either - the
same "authorization plumbing built ahead of its first real consumer"
pattern the Poimen gate followed until the Pastoral Care milestone. This
module is that first real consumer.

## What this milestone builds

The fourth bounded-context module (PRD §13.5's Stewardship domain).

| Area | File(s) | PRD/Blueprint basis |
|---|---|---|
| Inbound/outbound state machines | `libs/domain/stewardship/src/lib/financial-transaction-status.ts` | PRD §12.7 |
| Financial Transaction/Expense/Project/Pledge Zod schemas | `libs/contracts/src/lib/stewardship.schemas.ts` | Blueprint §6.3 |
| Financial Transaction record/read/verify/flag/escalate/reconcile | `controllers/financial-transaction.controller.ts` + `services/financial-transaction.service.ts` | FR-STW-01 through 05/07, BR-STW-01 through 04 |
| Expense request/read/approve/reject/pay/receipt | `controllers/expense.controller.ts` + `services/expense.service.ts` | FR-STW-09, BR-STW-07/08 |
| Project create/read | `controllers/project.controller.ts` + `services/project.service.ts` | FR-STW-08/H2 |
| Pledge create/read/fulfill | `controllers/pledge.controller.ts` + `services/pledge.service.ts` | FR-STW-08/H2, OQ-07 |

## Cross-module consumption (Blueprint §7.2), not duplication

`StewardshipModule` imports `PeopleModule` as an ordinary import (no
`forwardRef` - People needs nothing back from Stewardship). Two
already-exported People services are consumed, unchanged, with no new
exports required this milestone:

- **`GroupScopeService`.** `FinancialTransactionCreateResourceContextGuard`/
  `FinancialTransactionResourceContextGuard` resolve a Bacenta-recorded
  offering's scope from `sourceGroupId`, exactly the same call Gatherings'
  own guards already make for `ownerGroupId`/`groupId`.
- **`PersonScopeService`.** `ExpenseCreateResourceContextGuard`/
  `ExpenseResourceContextGuard` resolve an Expense's scope from its
  requester's own Person scope (`db/schema.prisma`'s `Expense` has no
  `groupId` of its own, only `requestedByPersonId`) - the same pattern
  Pastoral Care's own guards already use for a Follow-up task's subject
  Person, applied here to the *requesting* Person instead.

**`platform.users` is queried directly, not through a cross-module
service.** `FinancialTransactionRepository.findUserIdByPersonId`/
`findPersonIdByUserId` query `prisma.user` directly, mirroring
`RoleAssignmentRepository.findUserIdByPersonId`'s own precedent (People
milestone) - `platform.users`/`platform.sessions` are shared platform
infrastructure (Blueprint §7.2), not another bounded context's private
schema, so this is not the module-boundary violation the Pastoral Care
milestone found and fixed for `pastoral_care.poimen_enrollments`.

## `DIFFERENT_ACTOR_THAN_RECORDER` reused for FR-STW-09, not duplicated

FR-STW-09 requires "action from a Person other than the requester" before
an Expense reaches `Approved` - structurally the same separation-of-duties
shape as BR-STW-04's verifier-differs-from-recorder rule. Rather than
registering a second, parallel record-level check with the same
implementation, `stewardship.expense.approve`'s permission-matrix rows
reuse `DIFFERENT_ACTOR_THAN_RECORDER` (`libs/rbac/src/lib/record-level-checks.ts`) -
its actual implementation only ever compares `actor.personId` against
`resource.recordedByPersonId`, a name generic enough to mean "whoever
performed the prior step" regardless of whether that step was recording a
gift or requesting an expense. `ExpenseResourceContextGuard` populates
`resource.recordedByPersonId` with the Expense's own `requestedByPersonId`
to make this work. This is also this codebase's first real *declarative*
use of `RecordLevelPolicyGuard` (`@UseGuards(..., RbacGuard,
RecordLevelPolicyGuard)`, on both the `verify`/`flag`/`escalate` Financial
Transaction routes and the `approve`/`reject` Expense routes) - every
prior `recordLevelCheck` consumer (`POIMEN_GATE_IF_ENABLED`, People
milestone) went through `RoleAssignmentService`'s imperative `evaluate()`
escape hatch instead, for reasons specific to that endpoint's
data-dependent action selection (see that service's own doc comment).
Stewardship's routes have no such complication, so they use the
declarative pipeline exactly as Blueprint §9.4's own worked example shows.

## `amountMinor` is a decimal string on the wire

`FinancialTransaction`/`Expense`/`Project`/`Pledge`'s minor-currency-unit
fields are Prisma `BigInt` (Blueprint §7.4). `BigInt` cannot round-trip
through `JSON.stringify` at all, and a JS `number` loses precision past
2^53 - every request/response schema in `libs/contracts/src/lib/stewardship.schemas.ts`
represents these fields as a decimal string (`z.string().regex(/^[0-9]+$/)`),
converted to/from Prisma's native `BigInt` only at the repository/service
boundary, documented at length in that file's own doc comment.

## Inferred permission rows (PRD §17.3 gaps, not transcription omissions)

Same discipline as People's Group-creation gap and Pastoral Care's
poimen_enrollment gap - flagged at their declaration sites in `actions.ts`
and `permission-matrix.ts`, summarized here:

- **`stewardship.transaction.read` for Treasurer/Bacenta Leader.** §17.3's
  table only lists these two roles against `.record`/`.verify`, but
  FR-STW-03's own acceptance criterion presupposes a Treasurer can already
  see the verification queue, and a Bacenta Leader recording an offering
  has an obvious need to see what they themselves recorded.
- **`stewardship.expense.pay`/`stewardship.expense.receipt`/
  `stewardship.expense.read`.** §17.3's matrix stops at "approve" - who
  executes payment and who attaches the retained receipt afterward is
  named in PRD narrative (§12.7: "payment executed," "receipt attached and
  archived") but has no matrix row at all. `pay` is modeled as
  Treasurer-only (money movement, BR-STW-03); `receipt` is modeled as
  available to the same roles who may request an expense, restricted at
  the *service* layer (not a new record-level check) to the specific
  transaction's own `requestedByPersonId` - the original requester is the
  one who made the purchase and holds the physical receipt.
- **`stewardship.project.*`/`stewardship.pledge.*`.** §17.3's matrix
  predates FR-STW-08 (H2) entirely - no row names Projects or Pledges at
  all. Modeled with the same role/scope shape as "Gathering:
  create/configure" for Project (a Branch/cluster-level leadership action
  creating a structural entity) and "Financial Transaction: record" for
  Pledge (a Member's own commitment, `SELF`-scoped).

## What this milestone deliberately does not build

- **FR-STW-07's bank-deposit comparison half.** "Aggregate `Verified`
  transactions into a weekly reconciliation view comparing recorded totals
  against confirmed bank deposits." `db/schema.prisma` has no
  bank-deposit-confirmation entity at all - `FinancialTransactionService.reconcile()`
  records the `Verified -> Reconciled` state transition itself (the half
  that *is* buildable against the existing schema), but the "compiled
  automatically... against bank deposit" comparison view needs a schema
  addition outside an application-layer milestone's scope, the same
  "needs a schema change, not an engineering guess" framing the People
  milestone used for PRD §16.1's persistent duplicate-resolution queue.
- **The `Flagged -> UnderInvestigation` automatic SLA trigger.** PRD
  §12.7's "discrepancy unresolved past SLA" names no concrete duration
  anywhere, and no scheduler exists in this codebase yet (the same gap
  already flagged for Pastoral Care's silent-drift sweep and Gatherings'
  attendance-completeness sweep). `FinancialTransactionService.escalate()`
  exists as a manual transition a Treasurer/Admin invokes; nothing calls
  it automatically.
- **NFR-INT-01's Mobile Money provider integration.** H2 priority -
  `channel: MOBILE_MONEY` is recorded as a plain fact on every inbound
  transaction (FR-STW-05), but no MTN MoMo (or equivalent) API integration
  exists to auto-confirm those transactions.
- **Pledge reminder delivery.** `reminderOptIn` is accepted and stored
  (OQ-07's resolution: "a single, opt-in, gentle notice... never a
  repeated or pressuring sequence"), but no scheduler exists to actually
  send it - the same "no scheduler" gap as the SLA trigger above.
- **Project progress aggregation.** FR-STW-08's acceptance criterion
  ("shows total pledged, total received, and progress against a stated
  target") needs a `SUM(...)` aggregate query across a Project's Pledges
  and their fulfilling transactions - straightforward to add on top of
  `PledgeRepository`/`FinancialTransactionRepository` but left out to keep
  this milestone's surface reviewable, the same "flagged as a near-term,
  low-risk follow-up, not a design gap" framing the People milestone used
  for the full Person profile view.
- **A Bacenta Leader's Financial-Transaction list/queue view.** The
  `GET /v1/financial-transactions` list endpoint is Branch-scoped only
  (`FinancialTransactionListResourceContextGuard`) - a `BACENTA_LEADER`'s
  own `OWN_GROUP`-scoped `.read` grant cannot be satisfied by a
  Branch-wide list resource today; they use `GET /v1/financial-transactions/:id`
  for individual records they already know the id of instead.

## Known sandbox limitation

Same disclosed limitation as every prior sprint: no `tsc`/`eslint`/`jest`/
`prisma` execution against real `node_modules` or a live database in this
environment. Verified via the same static methods used in every prior
sprint (brace-balance and import-resolution checks across every new/changed
file this milestone). Needs a real
`pnpm install && pnpm lint && pnpm test && pnpm build` run, and ultimately
exercising these endpoints against the real local Postgres from Sprint
1.3's verification, before this can be considered proven correct rather
than merely reviewed.
