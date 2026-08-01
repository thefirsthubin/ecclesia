# Database design notes (Sprint 1.3)

**How this document came to exist:** `db/migrations/README.md` commits this
migration to implementing Blueprint §7.2 (seven bounded-context Postgres
schemas), §7.3 (Row-Level Security), §7.4 (the append-only Financial
Transaction event log), and §7.5 (the temporal `GROUP_MEMBERSHIP` model).
The actual Blueprint/PRD text for those sections was not available in this
session. Given that choice, every entity, field, and constraint below is
traced to something already committed to this repository - primarily
`libs/rbac`'s types, permission matrix, and action taxonomy (which a past
session transcribed directly from PRD §17.2-17.4), and every domain
library's `README.md` (which cite specific PRD/Blueprint sections for the
business logic each library will eventually hold). Nothing here is
transcribed from the Blueprint itself, because the Blueprint text was not
provided. **This schema is a draft pending review against the actual
Blueprint §7.2-7.5 text - treat every "Evidence" citation below as exactly
that: evidence, not a quotation of the source of truth.**

Where evidence ran out, the entity or field is either left out entirely
(see "Deliberately not built" below) or flagged as an open question rather
than guessed.

## Traceability index

| Schema object | Evidence |
|---|---|
| Seven Postgres schemas: `people`, `pastoral_care`, `ministry`, `gatherings`, `stewardship`, `insights`, `platform` | `apps/api/src/app/app.module.ts`'s bounded-context module list (PeopleModule, PastoralCareModule, MinistryModule, GatheringsModule, StewardshipModule, InsightsModule, PlatformModule = 7) matches `db/migrations/README.md`'s "seven bounded-context schemas" count exactly, and matches the action-namespace prefixes already used throughout `libs/rbac/src/lib/actions.ts` (`people.*`, `gatherings.*`, `stewardship.*`, `pastoral_care.*`, `insights.*`, `platform.*`). |
| `Group` (unifies Cluster/Bacenta/Basonta with a `type` discriminator + self-referencing `parentGroupId`, rather than three separate tables) | `libs/rbac/src/lib/evaluate.ts`'s `resourceInScope` comment: "Bacenta Leader and Basonta Leader the same *shape* of authority... just over different **group types**"; `libs/domain/people/README.md` says "Group/GroupMembership invariants," not "Bacenta/GroupMembership"; the codebase's established pattern of one generalized entity with a type discriminator instead of parallel tables (Gatherings' own README: "the generalized Gathering type hierarchy - 'Everything Is A Gathering'"). **This is an inference by analogy, not a direct citation - flagged in Open Questions.** |
| `Person.lifecycleStage` modeled as a plain string, not a Postgres enum | `libs/domain/people/README.md`: "the lifecycle-stage state machine (PRD §12.5)" confirms a state machine exists, but no state names are evidenced anywhere in this repo. An enum would require guessing the actual state vocabulary, which risks contradicting the real PRD §12.5 states later - "Domain Language is Sacred" (engineering-principles.md §2) argues against inventing the words. |
| `Person.poimenStatus` as a real 3-value enum (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`) | `libs/rbac/src/lib/types.ts`'s `ResourceContext.candidatePoimenStatus` literal union - exact values, directly copied. |
| `RoleAssignment` has `effectiveFrom`/`effectiveTo` (time-bound) | `libs/rbac/src/lib/roles.ts`'s own doc comment: "the succession runbook models interim authority as an ordinary, **time-bound Role Assignment**." |
| `GroupMembership` has `validFrom`/`validTo` (temporal) | `db/migrations/README.md`: "the temporal GROUP_MEMBERSHIP model (§7.5)" - the word "temporal" is the source's own word, not mine. |
| `FinancialTransactionEvent` is an append-only event log, not a mutable row with a status column | `db/migrations/README.md`: "the append-only Financial Transaction event log (§7.4)"; `libs/domain/stewardship/README.md`: "the Financial Transaction **state machine** (PRD §12.7)" - modeled as a sequence of immutable events (`RECORDED`/`VERIFIED`/`RECONCILED`) rather than a mutable status field, because "append-only event log" and "state machine" together describe event sourcing, not a single mutable record. |
| `FinancialTransactionEvent.eventType` enum values (`RECORDED`, `VERIFIED`, `RECONCILED`) | The three action names in `libs/rbac/src/lib/actions.ts`: `stewardship.transaction.record`, `.verify`, `.reconcile`. |
| `FinancialTransactionEvent.recordedByPersonId` distinct from the verifying actor | `libs/rbac/src/lib/record-level-checks.ts`'s `differentActorThanRecorder` (BR-STW-04 / PRD §17.4) needs exactly this fact to exist on the resource. |
| `platform.configurations` table name | `libs/rbac/src/lib/types.ts`'s `BranchConfiguration` doc comment names it literally: `` `platform.configurations` ``. |
| `Configuration` fields (`gatheringTypes`, `churchPulseWeights`, `poimenGateEnabled`, `followupSlaDefaults`) | `libs/config/README.md` and `libs/config/src/lib/config.ts`'s doc comment, verbatim list: "gathering types, Church Pulse weights, the Poimen-gate flag..., follow-up SLA defaults." `poimenGateEnabled`'s exact name/type also matches `BranchConfiguration.poimenGateEnabled: boolean` in `libs/rbac/src/lib/types.ts`. |
| `AuditLog` | `libs/rbac/src/lib/actions.ts`'s `platform.audit_log.read` action, scoped per-role in the permission matrix (Branch/Cluster/OwnGroup) - a scoped, queryable read implies a persisted, filterable table, not just a log stream. Also engineering-principles.md §5: "denials are logged as rigorously as approvals." |
| `Gathering`/`GatheringSeries` split for recurrence | `libs/domain/gatherings/README.md`: "recurrence-series handling." |
| `Attendance` has no status enum - a row's existence means present | No evidence of an "absent" state anywhere; `libs/domain/gatherings/README.md`'s "attendance-completeness evaluation" implies completeness is computed by comparing recorded Attendance rows against expected Group membership at gathering time, not by storing explicit absence rows. |

## Deliberately not built

**`ministry` schema: declared, no tables.** `libs/domain/ministry/README.md` describes "Basonta staffing-adequacy calculation, worker overcommitment detection," which is enough to guess at a `MinistryAssignment` entity - but `libs/rbac/src/lib/actions.ts` has **zero** `ministry.*` actions. Every other bounded context in this codebase was built RBAC-first (Sprint 1.1 defined the full action taxonomy before Sprint 1.3 touches a table). Building Ministry tables now would put the database ahead of an authorization model that doesn't yet exist for it - the opposite order from how every other domain here was built. Recommend deferring Ministry's schema to whenever its RBAC actions are defined.

**`insights` schema: declared, no tables.** `libs/domain/insights/README.md`: Insights "Consumes only the Engagement Signal shape defined in `@ecclesia/contracts`" - its primary input is a stream/contract shape, not something Insights itself owns as a table. Whether an Engagement Signal or a computed Church Pulse score gets persisted to Postgres at all (versus staying in an event stream, e.g. via the Worker app) is genuinely unspecified here. Left empty rather than guessed.

**No `Ministry`, `EngagementSignal`, or `ChurchPulseScore` tables.** Same reasoning as above.

## Open questions (need the real Blueprint/PRD text to close)

1. **Is `Group` (unified Cluster/Bacenta/Basonta with a type discriminator) actually how the Blueprint models this, or are Cluster/Bacenta/Basonta separate tables?** This is the single biggest structural inference in this schema (see Traceability index above). Everything downstream (`RoleAssignment`, `GroupMembership`, `Gathering`) depends on this choice.
2. **`Person.lifecycleStage`**: what are the actual state names and transitions (PRD §12.5)? Modeled as an unconstrained string for now.
3. **BR-PPL-01, BR-PPL-02, BR-PPL-04** (`libs/domain/people/README.md` cites these for "Group/GroupMembership invariants"; BR-PPL-03 is not cited anywhere in this repo) - what do they actually constrain? (E.g., can a Person hold membership in more than one Bacenta simultaneously? This schema assumes not, enforced by `GroupMembership`'s temporal model, but that assumption is unconfirmed.)
4. **BR-STW-02, 03, 05 through 11** (`libs/domain/stewardship/README.md` cites "BR-STW-01 through BR-STW-11"; only 01 and 04 are known from `libs/rbac`) - do any of these require additional fields, tables, or constraints on `FinancialTransactionEvent`/`Expense` beyond what's built here?
5. **Expense rejection**: only `request`/`approve` actions exist in `libs/rbac`. Is there a reject/decline path with its own state, or is "not approved" simply the absence of an approval?
6. **Row-Level Security mechanism**: this migration enables RLS and adds `branch_id`-scoped policies using a Postgres session variable (`app.current_branch_id`, set via `SET LOCAL` per request/transaction). This is a reasonable, common pattern but **not evidenced** by anything in this repo - the actual GUC naming convention, whether Cluster/Bacenta-level policies are also required (vs. Branch-level RLS with narrower scoping left entirely to the application layer, per engineering-principles.md §5's "RLS is a backstop under application-layer filtering, not a replacement for it"), and which Postgres role(s) the app connects as (RLS is bypassed by table owners/superusers by default) are all unconfirmed.
7. **Primary key strategy**: UUIDs (`gen_random_uuid()`) are used throughout as a reasonable default. Not evidenced.
8. **`AuditLog`**: is this really a Postgres table, or should `platform.audit_log.read` instead be served by querying the structured pino log stream (`nestjs-pino`, Sprint 1.2)? Built as a table here because a *scoped* read (Branch/Cluster/OwnGroup, per the permission matrix) is hard to serve efficiently from a log stream, but this is an inference, not a citation.
9. **`Attendance` and `FollowupTask` status vocabularies**: not evidenced beyond the actions that create/read/update them.

## What Sprint 1.4 (authentication) and each domain module still need to wire up

- Nothing in this migration sets the Postgres session variables the RLS
  policies check (`app.current_branch_id`, etc.) - there is no
  authenticated actor yet to derive them from. That wiring is a
  Prisma middleware/interceptor that populates them from
  `EcclesiaRequestContext` (`libs/rbac`), landing with Sprint 1.4 or the
  first domain module that needs real data access.
- `libs/config`'s typed accessors over the `platform.configurations` table
  (referenced by its own README as landing "alongside the Prisma/database
  milestone") are not built in this sprint - only the table they will read
  from.
