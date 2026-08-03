/**
 * Action taxonomy derived from the 18 domain/action rows of PRD §17.3.
 * Dot-namespaced as `<bounded context>.<resource>.<verb>`, matching the
 * two worked examples in Blueprint §9.3 (`stewardship.transaction.record`,
 * `people.role_assignment.grant_shepherd`) exactly, so the code these
 * examples describe and the code that actually exists agree.
 *
 * Where a single PRD row's cell contains multiple letters (e.g.
 * "R, U (Branch)"), each letter becomes its own action here - the
 * permission engine needs to express "this role may read but not update"
 * as two separate rules, not one rule with a compound effect.
 *
 * `people.role_assignment.grant_shepherd` is deliberately distinct from
 * the more general `people.role_assignment.grant`: it is the one action
 * in the whole matrix that carries a record-level policy check
 * (`POIMEN_GATE_IF_ENABLED`, PRD §24 OQ-02 resolution), so it cannot
 * share a rule with granting a Worker or Basonta Leader role, which
 * carry no such gate.
 */
export const ACTIONS = [
  // Person (PRD §17.3 row: "Person: create/edit profile")
  'people.person.create',
  'people.person.read',
  'people.person.update',

  // Person (row: "Person: assign lifecycle stage")
  'people.person.lifecycle_stage.read',
  'people.person.lifecycle_stage.update',

  // Role Assignment (row: "Role Assignment: grant Shepherd/Worker/etc.")
  'people.role_assignment.grant_shepherd',
  'people.role_assignment.grant',
  'people.role_assignment.update',
  'people.role_assignment.read',

  // Bacenta/Basonta (row: "Bacenta/Basonta: reassign member")
  'people.group_membership.update',
  // FR-PPL-07 ("maintain a complete, queryable history of a Person's
  // GROUP_MEMBERSHIP... records"). §17.3's row only names "reassign
  // member," but FR-PPL-07 explicitly requires this history be viewable -
  // a real gap between the two source documents, same category as the
  // `people.group.*` gap above, not a transcription omission. Added during
  // the People Web Admin sprint - see PEOPLE_DESIGN_NOTES.md.
  'people.group_membership.read',

  // [INFERRED - no PRD §17.3 row covers this] Group (Bacenta/Basonta)
  // creation/configuration itself (FR-PC-01, FR-MIN-01). §17.3's table
  // has a "reassign member" row but none for creating the Group entity
  // in the first place - a real gap in the source document, not a
  // transcription omission. See PASTORAL_CARE_DESIGN_NOTES.md.
  'people.group.create',
  'people.group.update',
  'people.group.read',

  // Gathering (row: "Gathering: create/configure")
  'gatherings.gathering.create',
  'gatherings.gathering.update',
  'gatherings.gathering.read',

  // Attendance (row: "Attendance: record")
  'gatherings.attendance.create',
  'gatherings.attendance.read',

  // [INFERRED - no PRD §17.3 row covers this] Digital visitor capture
  // (FR-GTH-04, BR-GTH-03). §16.4 names "Ushers, self-service (future)"
  // as the primary actors, but "Usher" is not a modeled `Role`
  // (`libs/rbac/src/lib/roles.ts` - the PRD §17.2 role catalog Sprint 1.1
  // transcribed has no Usher entry, and §17.3's own column headers omit
  // it too) - a genuine gap between the narrative personas and the
  // formal RBAC model, not something this milestone invents a fix for.
  // Modeled with the same role/scope shape as `gatherings.attendance.create`
  // immediately above (the roles who can already record attendance are
  // the same roles present at a Gathering to also capture a visitor).
  // See GATHERINGS_DESIGN_NOTES.md.
  'gatherings.visitor_intake.create',
  'gatherings.visitor_intake.read',

  // Financial Transaction (rows: record / verify / reconcile)
  'stewardship.transaction.record',
  'stewardship.transaction.verify',
  'stewardship.transaction.reconcile',
  'stewardship.transaction.read',

  // Expense (rows: request / approve)
  'stewardship.expense.request',
  'stewardship.expense.approve',

  // [INFERRED - no PRD §17.3 row covers this] Expense: pay / attach
  // receipt (FR-STW-09/BR-STW-08). §17.3's matrix stops at "approve" -
  // who executes payment and who attaches the retained receipt afterward
  // is named in PRD narrative ("payment executed," "receipt attached and
  // archived," §12.7) but has no permission-matrix row. `pay` is modeled
  // as a Treasurer action (money movement is Finance Team's designated
  // function, BR-STW-03); `receipt` is modeled as available to the same
  // roles who may request an expense (§17.3's "Expense: request" row) -
  // the original requester is the one holding the physical receipt after
  // their own purchase - restricted at the service layer to the specific
  // transaction's own `requestedByPersonId`, not a new record-level check.
  // See STEWARDSHIP_DESIGN_NOTES.md.
  'stewardship.expense.pay',
  'stewardship.expense.receipt',
  'stewardship.expense.read',

  // [INFERRED - no PRD §17.3 row covers this] Project / Pledge (FR-STW-08,
  // H2). §17.3's matrix predates this H2 feature entirely - no row names
  // it at all. Modeled with the same role/scope shape as "Gathering:
  // create/configure" for Project (a Branch/cluster-level leadership
  // action creating a structural entity), and "Financial Transaction:
  // record" for Pledge (a Member's own commitment, SELF-scoped, verified/
  // read by the same Treasurer/Pastor roles who already see Financial
  // Transactions). See STEWARDSHIP_DESIGN_NOTES.md.
  'stewardship.project.create',
  'stewardship.project.read',
  'stewardship.pledge.create',
  'stewardship.pledge.read',
  'stewardship.pledge.fulfill',

  // [INFERRED - no PRD §17.3 row covers this] Bank Deposit Confirmation
  // (FR-STW-07's previously-unbuilt bank-deposit comparison half, closed
  // in the Stewardship gaps sprint). Modeled with the same role/scope
  // shape as `stewardship.transaction.reconcile` (a Finance Team
  // record-keeping action against a Verified transaction) - `confirm` and
  // `read` are both Treasurer/BRANCH by default, with `read` additionally
  // open to the same Pastor roles who already read Financial Transactions.
  // See STEWARDSHIP_DESIGN_NOTES.md.
  'stewardship.bank_deposit.confirm',
  'stewardship.bank_deposit.read',

  // Follow-up task (row: "Follow-up task: create/assign")
  'pastoral_care.followup_task.create',
  'pastoral_care.followup_task.update',
  'pastoral_care.followup_task.read',

  // Pastoral notes (row: "Pastoral notes: view/create")
  'pastoral_care.notes.read',
  'pastoral_care.notes.create',

  // [INFERRED - no PRD §17.3 row covers this] Poimen enrollment tracking
  // (FR-PC-06). §19.4's workflow narrative names actors ("Resident Pastor
  // or Assistant Pastor... Admin (record-keeping support)") but §17.3's
  // matrix has no corresponding row. See PASTORAL_CARE_DESIGN_NOTES.md.
  'pastoral_care.poimen_enrollment.create',
  'pastoral_care.poimen_enrollment.update',
  'pastoral_care.poimen_enrollment.read',

  // [INFERRED - no PRD §17.3 row covers this] Silent-drift flag reads
  // (FR-PC-05, §15.8's decision tree). §17.3's matrix predates the
  // Shepherd Dashboard sprint that first reads `SilentDriftFlag` rows
  // through an HTTP endpoint - the worker's nightly sweep
  // (`apps/worker/src/jobs/silent-drift-sweep`) has written them since
  // the Insights milestone, but no controller in this codebase exposed
  // them until now. Modeled with the identical role/scope shape as
  // `insights.alert.read` (the same "leadership roles, scoped to their
  // organizational responsibility" RACI, FR-INS-04/BR-INS-02, applied to
  // a Pastoral Care - not Insights - owned resource) since a silent-drift
  // flag is exactly the kind of scoped, actionable alert that surface
  // already models. See SHEPHERD_DASHBOARD_DESIGN_NOTES.md.
  'pastoral_care.silent_drift_flag.read',

  // Insights (rows: Branch / cluster / own-Bacenta dashboards)
  'insights.branch_dashboard.read',
  'insights.cluster_dashboard.read',
  'insights.bacenta_dashboard.read',

  // [INFERRED - no PRD §17.3 row covers this] Alert inbox (FR-INS-03/05).
  // §17.3's matrix predates the Alert-inbox surface named in §16.6's
  // capabilities table entirely - no row names it at all, the same gap
  // Project/Pledge had in Stewardship. Modeled with the identical
  // role/scope shape as the three dashboard-read rows immediately above
  // (the same "leadership roles, scoped to their organizational
  // responsibility" RACI, FR-INS-04/BR-INS-02) since an alert inbox is
  // itself just another Insights-scoped read/act surface. See
  // INSIGHTS_DESIGN_NOTES.md.
  'insights.alert.read',
  'insights.alert.resolve',

  // [INFERRED - no PRD §17.3 row covers this] Ministry: staffing targets,
  // roster, worker availability (FR-MIN-01 through 04). §17.3's matrix
  // predates the Ministry domain's own capabilities entirely - the only
  // §17.3 rows that mention Basonta Leader at all belong to *other*
  // domains' actions (Person/Group/Gathering/Attendance/Expense), the
  // same gap category as Stewardship's Project/Pledge and Insights' Alert
  // inbox. See MINISTRY_DESIGN_NOTES.md. No separate `.update` action -
  // `staffing_target.create` is an upsert keyed on the (gatheringId,
  // groupId) unique pair, the same "re-recording is a correction, not a
  // duplicate" precedent `gatherings.attendance.create` already
  // established for `AttendanceRecordRepository.upsert()`.
  'ministry.staffing_target.create',
  'ministry.staffing_target.read',
  'ministry.worker_availability.create',
  'ministry.worker_availability.read',
  'ministry.roster.read',
  'ministry.roster.overcommitment.read',

  // Configuration (row: "Configuration: gathering/role/group types")
  'platform.configuration.create',
  'platform.configuration.update',
  'platform.configuration.read',

  // Audit log (row: "Audit log: view")
  'platform.audit_log.read',
] as const;

export type Action = (typeof ACTIONS)[number];

export function isAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}
