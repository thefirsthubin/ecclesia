/**
 * BR-PPL-04 / FR-PPL-06: certain Role Assignments may only be held by a
 * Person whose current `lifecycle_stage` is `MEMBER` (PRD §12.5's Design
 * Note: "Worker," "Shepherd," "Assistant Pastor," "Resident Pastor," and
 * "Treasurer" are responsibilities layered on top of the terminal
 * lifecycle stage of Member, not further stages).
 *
 * **Which roles are gated - a real discrepancy between the two citing
 * requirements, resolved here in favor of the fuller list.** BR-PPL-04's
 * own prose lists five roles (Worker, Shepherd, Assistant Pastor,
 * Resident Pastor, Treasurer) and omits Basonta Leader. But BR-PPL-04's
 * own "Enforcement point" column names FR-PPL-06 as where this is
 * enforced, and FR-PPL-06's requirement text explicitly includes
 * "Basonta Leader" in its parenthetical list. Since BR-PPL-04 designates
 * FR-PPL-06 as its own enforcement point, FR-PPL-06's fuller six-role
 * list is treated as authoritative here rather than BR-PPL-04's own
 * shorter prose restatement - this is documents disagreeing with
 * themselves in a way worth flagging, not a silent pick.
 */
const GATED_ROLES = [
  'WORKER',
  'BACENTA_LEADER',
  'BASONTA_LEADER',
  'ASSISTANT_PASTOR',
  'RESIDENT_PASTOR',
  'TREASURER',
  // [INFERRED, not a direct citation] Blueprint §8.6 models
  // ACTING_RESIDENT_PASTOR as reusing the Resident Pastor Role Assignment
  // mechanism with "identical authority... for the duration of the
  // assignment" - extended here by the same reasoning
  // `permission-matrix.ts` already applies (generating its rules from
  // RESIDENT_PASTOR's rules rather than hand-duplicating). Neither
  // document states this eligibility gate explicitly for the acting role.
  'ACTING_RESIDENT_PASTOR',
] as const;

export type GatedRole = (typeof GATED_ROLES)[number];

export function isGatedRole(role: string): role is GatedRole {
  return (GATED_ROLES as readonly string[]).includes(role);
}

export interface RoleAssignmentEligibilityCheck {
  eligible: boolean;
  reason: string;
}

/**
 * `role` and `lifecycleStage` are typed as plain strings, not imported
 * enum types - this library depends only on `libs/contracts` (Blueprint
 * §6.2/§6.4), and both the full `Role` catalog (`libs/rbac`) and
 * `LifecycleStage` (this library's own `lifecycle-stage.ts`) already
 * exist as the canonical types call sites should narrow with before
 * calling this function.
 */
export function checkRoleAssignmentEligibility(role: string, lifecycleStage: string): RoleAssignmentEligibilityCheck {
  if (!isGatedRole(role)) {
    return {
      eligible: true,
      reason: `'${role}' is not one of the lifecycle-stage-gated roles (BR-PPL-04/FR-PPL-06); no precondition applies`,
    };
  }
  if (lifecycleStage !== 'MEMBER') {
    return {
      eligible: false,
      reason: `BR-PPL-04/FR-PPL-06: '${role}' requires the Person's lifecycle_stage to be MEMBER (currently '${lifecycleStage}')`,
    };
  }
  return { eligible: true, reason: `BR-PPL-04/FR-PPL-06: lifecycle_stage is MEMBER, precondition satisfied` };
}
