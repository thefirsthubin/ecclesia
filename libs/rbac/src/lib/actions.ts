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

  // Gathering (row: "Gathering: create/configure")
  'gatherings.gathering.create',
  'gatherings.gathering.update',
  'gatherings.gathering.read',

  // Attendance (row: "Attendance: record")
  'gatherings.attendance.create',
  'gatherings.attendance.read',

  // Financial Transaction (rows: record / verify / reconcile)
  'stewardship.transaction.record',
  'stewardship.transaction.verify',
  'stewardship.transaction.reconcile',
  'stewardship.transaction.read',

  // Expense (rows: request / approve)
  'stewardship.expense.request',
  'stewardship.expense.approve',

  // Follow-up task (row: "Follow-up task: create/assign")
  'pastoral_care.followup_task.create',
  'pastoral_care.followup_task.update',
  'pastoral_care.followup_task.read',

  // Pastoral notes (row: "Pastoral notes: view/create")
  'pastoral_care.notes.read',
  'pastoral_care.notes.create',

  // Insights (rows: Branch / cluster / own-Bacenta dashboards)
  'insights.branch_dashboard.read',
  'insights.cluster_dashboard.read',
  'insights.bacenta_dashboard.read',

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
