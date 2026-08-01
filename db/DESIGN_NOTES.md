# Database design notes (Sprint 1.3 — rebuilt against the real Blueprint/PRD)

**Status:** This is a full rebuild. The first version of this schema was
designed without the actual Blueprint/PRD text (by explicit user
direction, since that text wasn't available in that session) and is now
known to have been wrong in several structural ways. `docs/Ecclesia_PRD.md`
and `docs/Ecclesia_Technical_Blueprint.md` are now in the repository
verbatim (copied byte-for-byte from the user's upload — see their md5sums
if you need to re-verify). Every entity and field below cites the exact
section, table, FR-ID, or BR-ID it comes from. Two confidence tiers are
used throughout, because the Blueprint itself is explicit that its §7.2
table lists "representative tables," not exhaustive column lists:

- **[BLUEPRINT-EXACT]** — the table or column is shown verbatim in
  Blueprint §7.2-7.5, §8, or §9 (table names, the four worked DDL
  examples, the RLS policy example).
- **[PRD-DERIVED]** — the table is *named* in Blueprint §7.2's
  schema-to-module mapping, but its column list is not given anywhere in
  either document. Fields are derived from the specific FR-/BR-ID(s) that
  describe that capability, cited per field. Treat these as a considered
  draft, not a transcription.

## What was wrong in the first version, and why

| First version | Correction | Evidence |
|---|---|---|
| `GroupType` enum had `CLUSTER`, `BACENTA`, `BASONTA`, with a self-referencing `parentGroupId` hierarchy | There is no Cluster entity. `Group.type` is exactly `PASTORAL_CARE` (Bacenta) or `MINISTRY` (Basonta) — no third type, no hierarchy | PRD §12.6 (the Group model table has exactly two rows); Blueprint §7.2 lists no `clusters` table. PRD line ~1164 (§17.2, Assistant Pastor row): "cluster assignment **is itself a configuration, not a hard-coded structure**" — cluster is a Role Assignment scope concept, not a Group |
| `GroupMembership.validFrom`/`validTo` | Renamed `started_at`/`ended_at`, added required-on-close `reason` | Blueprint §7.5's exact DDL |
| Financial data modeled as only an event log, no header row | Added `financial_transactions` (the header/current-state row) alongside `financial_transaction_events` (the append-only log) | Blueprint §7.4's exact DDL — both tables shown verbatim |
| `FinancialTransactionEvent.eventType` = RECORDED/VERIFIED/RECONCILED; `amount Decimal` | `financial_transactions.type` = OFFERING/TITHE/SPECIAL_OFFERING/PLEDGE/DONATION/EXPENSE (a CHECK constraint, shown verbatim); events use free-form `from_state`/`to_state` text, not a fixed 3-value enum (the real state machine has 8+ states per PRD §12.7, two different sub-flows); money stored as `amount_minor BIGINT`, not `Decimal(12,2)` | Blueprint §7.4 exact DDL; PRD §12.7's inbound/outbound state diagrams |
| Actors tracked via `personId` everywhere | Actors performing an auditable, security-relevant state transition (financial events, denial/audit logging) are tracked via `platform.users` (`actor_user_id`), not `people.persons` directly — a `User` is the authenticated Cognito identity; a `Person` is the pastoral/ministry profile. Fields that describe *who is responsible for* something (task assignment, leadership) still use `person_id`, matching the PRD's own wording for those specific requirements | Blueprint §7.4's `actor_user_id UUID NOT NULL REFERENCES platform.users(id)`; Blueprint §8.5: "every authentication event... logged... with the authenticated user" |
| `Person.poimenStatus` as a field on `Person` | Moved to its own `poimen_enrollments` table | Blueprint §7.2 lists `poimen_enrollments` as its own `pastoral_care`-schema table, separate from `persons` |
| `Person.lifecycleStage` as an unconstrained string | Now a real 7-state enum | PRD §12.5's state diagram and BR-PPL-03 give the exact, complete state list: `VISITOR`, `FIRST_TIME_GUEST`, `FOLLOW_UP`, `LAPSED`, `ASSIGNED_TO_BACENTA`, `SIX_WEEKS_PARTICIPATION`, `MEMBER` |
| `ministry` and `insights` schemas left empty | Both have real Release-1 tables per Blueprint §7.2's own mapping table — leaving them empty was itself the mistake (the "RBAC-first" reasoning that justified it doesn't apply once the actual Blueprint says otherwise) | Blueprint §7.2: `ministry` → `staffing_targets`, `worker_availability`; `insights` → `engagement_signals`, `pulse_scores`, `pulse_score_history`, `alerts` |
| No `platform.users`, `platform.sessions`, `platform.councils`, `Person.guardianPersonId` | All added | Blueprint §7.2's table list; Blueprint §8 (Authentication) for users/sessions; Blueprint §7.2's `persons` row: "includes optional nullable `guardian_person_id`"; PRD FR-ADM-03 for Council |
| `Expense` as an independent table with its own `ExpenseStatus` enum | Modeled as a 1:1 extension of a `financial_transactions` row with `type = 'EXPENSE'`, sharing the same `financial_transaction_events` state log as inbound transactions (Requested→Approved/Rejected→Paid→ReceiptRetained instead of Recorded→Verified→...) | PRD §12.7's outbound state diagram uses the same `FinancialTransaction` entity; Blueprint §7.4's `type` CHECK constraint includes `'EXPENSE'` as one of six transaction types. **[PRD-DERIVED, flagged below]** — this specific extension-table relationship (rather than some other way of storing Expense-only fields) is my construction, not shown verbatim |

## Traceability index — [BLUEPRINT-EXACT] entities

| Table | Schema | Source |
|---|---|---|
| Seven schemas (`people`, `pastoral_care`, `ministry`, `gatherings`, `stewardship`, `insights`, `platform`) | — | Blueprint §7.1 ADR-003, §7.2 |
| `branches`, `configurations`, `audit_log` | `platform` | Blueprint §7.2 |
| `persons` (incl. `guardian_person_id`), `groups`, `group_memberships`, `role_assignments` | `people` | Blueprint §7.2; `group_memberships` DDL in §7.5 |
| `financial_transactions`, `financial_transaction_events` | `stewardship` | Blueprint §7.4, full DDL shown |
| Row-Level Security: `ENABLE ROW LEVEL SECURITY` + `branch_id = current_setting('app.current_branch_id')::uuid` policy, per Branch-scoped table | — | Blueprint §7.3, exact policy shown for `financial_transactions`, generalized here to every Branch-scoped table per §7.3's own text ("every Branch-scoped table") |
| Append-only enforcement on `financial_transaction_events` (no UPDATE/DELETE grants for the app's DB role) | `stewardship` | Blueprint §7.4: "No UPDATE or DELETE grants... for the application's database role... enforced at the database-role permission level" — **note:** the first version of this migration used a trigger that raises an exception; the Blueprint's actual mechanism is a **`REVOKE`/role-permission** approach, not a trigger. Corrected below (see Open Question #2) |
| `poimen_gate_enabled` boolean on `platform.configurations` | `platform` | Blueprint §9.3, exact field name |
| One active `PASTORAL_CARE` `GROUP_MEMBERSHIP` per person via a partial unique index | `people` | Blueprint §7.5, exact index shown: `CREATE UNIQUE INDEX one_active_bacenta_per_person ON people.group_memberships (person_id) WHERE group_type = 'PASTORAL_CARE' AND ended_at IS NULL` |
| `financial_transaction_events.actor_user_id REFERENCES platform.users(id)` | `stewardship`/`platform` | Blueprint §7.4 |

## Traceability index — [PRD-DERIVED] entities (table named in Blueprint §7.2, columns derived from cited FR-/BR-IDs)

| Table | Fields derived from |
|---|---|
| `pastoral_care.follow_up_tasks` | FR-PC-03 (auto-creation trigger), FR-PC-04 (assignment to a Person, SLA window, escalation) |
| `pastoral_care.silent_drift_flags` | PRD §15.8's decision tree (BR-PC-02 operationalized); FR-INS-05 (act/dismiss resolution tracking) |
| `pastoral_care.poimen_enrollments` | FR-PC-06 (enrollment/completion status, `NOT_STARTED`/`IN_PROGRESS`/`COMPLETE` — same 3 values already used in `libs/rbac`'s `ResourceContext.candidatePoimenStatus`) |
| `pastoral_care.pastoral_notes` | §16.2 capability list; NFR-PRIV-01 restriction (ADMIN explicit deny already encoded in `libs/rbac`) |
| `ministry.staffing_targets` | FR-MIN-02 ("numeric staffing target against a specific Gathering instance") |
| `ministry.worker_availability` | §16.3 ("lets a worker mark themselves unavailable for a date range") |
| `gatherings.gathering_series` | FR-GTH-02 (recurring series generating dated instances) |
| `gatherings.gatherings` | PRD §12.4's exact field list: `id`, `type`, `scheduledStart`, `scheduledEnd`, `recurrenceRule`, `venue`, `ownerGroupId` (nullable), `status`, plus a `config` JSON column for type-specific fields (§12.4's implementation note) |
| `gatherings.attendance_records` | PRD §12.2: "a status (present, absent, excused)" — exact 3-value status; FR-GTH-03 (Branch/Bacenta-level scoping via `ownerGroupId`) |
| `gatherings.visitor_intake_submissions` | FR-GTH-04; §16.1 ("name, phone, how they heard about the church" as minimal capture fields) |
| `stewardship.expenses` | FR-STW-09 (approver ≠ requester, mandatory receipt before terminal state); PRD §12.7's outbound state diagram |
| `stewardship.projects`, `stewardship.pledges` | FR-STW-08 (target, pledge/donation tracking, single opt-in reminder — "never a repeated or pressuring sequence," resolved OQ-07) |
| `insights.engagement_signals` | PRD §12.8's flowchart: six signal source categories feeding one stream |
| `insights.pulse_scores`, `insights.pulse_score_history` | FR-INS-01 (Person/Group/Branch level scores); §12.8 ("Church Pulse: Person/Group/Branch level" as three outputs of the scoring engine) — modeled as a current-value table plus a full history table, mirroring the `financial_transactions`/`financial_transaction_events` current-state-plus-event-log pattern the Blueprint already establishes for exactly this "denormalized current value, full history separately" shape |
| `insights.alerts` | FR-INS-03 (trend/threshold alerts), FR-INS-05 (act/dismiss resolution) |
| `platform.users` | Blueprint §8 (Cognito-backed identity); only a minimal shape is built in Sprint 1.3 (enough for other tables' `actor_user_id`/`user_id` foreign keys to reference) — the full Cognito integration (custom `auth_method` attribute, MFA enrollment state) is Sprint 1.4's scope, not this one's |
| `platform.sessions` | Named in Blueprint §7.2's table list but never given schema detail anywhere in either document — Blueprint §8.3's token strategy describes Cognito's own device tracking, which may mean this table's real purpose is narrower than "sessions" implies. Built minimally (Open Question #4) |
| `platform.councils` | FR-ADM-03 ("Branch and Council as first-class entities from Release 1"); PRD §12.3's ERD: `COUNCIL ||--o{ BRANCH : oversees` |

## Open questions (still genuinely unresolved by the source documents)

1. **Assistant Pastor "cluster" scope mechanism.** Confirmed real (PRD §17.2, §11.3, §16.2/16.6 all reference it functionally) and confirmed *not* a Group entity (see the corrections table above), but neither document specifies its schema shape beyond "cluster assignment is itself a configuration." This migration models it as `role_assignments.scope_group_ids UUID[]` (nullable, populated only for cluster-scoped Role Assignments) — a plain array is the most literal reading of "configuration, not a hard-coded structure," but this is a construction, not a citation. `libs/rbac`'s `Scope` type already has a `CLUSTER` value and `ActorContext.clusterId` — that code will need to change from a single `clusterId` to something that can express "member of this set of Bacentas" once this is wired up (Sprint 1.4 or the Pastoral Care domain milestone).
2. **Append-only enforcement mechanism.** Blueprint §7.4 says no UPDATE/DELETE *grants* for the application's database role — i.e., enforced via `REVOKE`/role permissions, not a rejecting trigger. This requires a dedicated, non-owner application database role to exist and be the one the app actually connects as (the same prerequisite already flagged for RLS in Open Question #3 below) — until that role exists, this migration keeps the rejecting-trigger approach from the first version as an interim safeguard, clearly commented as such, so the append-only guarantee holds even before the role-based grant model is set up.
3. **RLS session role and GUC-setting mechanism.** Blueprint §7.3: "The API service sets `app.current_branch_id` as a session-local setting at the start of every request." Nothing in Sprint 1.2/1.3 does this yet — it depends on Sprint 1.4 authentication existing to derive a Branch from. Also unconfirmed: whether the app's database role is distinct from the migration-owning role (RLS is bypassed for table owners by default; Blueprint doesn't state the role name). **Still open as of the People domain milestone** (Sprint 1.4 authentication now exists, but this still isn't wired) — that milestone's first real bounded-context module now issues real queries against these RLS-enabled tables, relying entirely on explicit application-layer `branchId` filtering as the *only* current enforcement (see `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`), not merely the "backstop" layer Blueprint §7.3 intends RLS to be.
4. **`platform.sessions`.** No schema given anywhere. Modeled minimally (id, user_id, device identifier, created_at, revoked_at) as a plausible local record of Cognito-issued refresh-token sessions for the per-device revocation Blueprint §8.3 describes, but this is the least-evidenced table in this migration and should be revisited once Sprint 1.4 actually implements Cognito integration.
5. **`stewardship.expenses`' exact relationship to `financial_transactions`.** Modeled as a 1:1 extension table (see corrections table above) — a reasonable reading of the evidence, not a citation.
6. **Gathering `status` and `Group` lifecycle enum exact value sets.** PRD §12.4 names a `status` field on `Gathering` and §12.6 names `Active`/`Splitting`/`Merging`/`Archived` for `Group`, but doesn't enumerate `Gathering.status`'s values explicitly. Modeled `Group.lifecycleStatus` with the four given values (real citation); `Gathering.status` modeled minimally (`SCHEDULED`, `CANCELLED`, `COMPLETED`) since no PRD text enumerates it.
7. **`insights.pulse_scores` vs `pulse_score_history` split.** Both tables are named in Blueprint §7.2 but the current/history relationship between them is my inference by analogy to the `financial_transactions`/`financial_transaction_events` pattern, not a citation.

## What's still deliberately not built

- No columns for FR-PPL-08's configurable custom profile fields beyond a `custom_fields` JSONB column on `Person` — the field-definition/config side of that (Horizon 2, per §13.1) isn't specified further and would need its own configuration table when built.
- Cognito integration itself (Sprint 1.4): `platform.users` here is intentionally minimal.
- The Prisma middleware/interceptor that populates `app.current_branch_id` per request (Open Question #3) and the dedicated non-owner database role (Open Questions #2, #3) — both prerequisites for RLS/append-only enforcement to do anything at runtime, neither built yet.
