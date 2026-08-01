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
declare const GATED_ROLES: readonly ["WORKER", "BACENTA_LEADER", "BASONTA_LEADER", "ASSISTANT_PASTOR", "RESIDENT_PASTOR", "TREASURER", "ACTING_RESIDENT_PASTOR"];
export type GatedRole = (typeof GATED_ROLES)[number];
export declare function isGatedRole(role: string): role is GatedRole;
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
export declare function checkRoleAssignmentEligibility(role: string, lifecycleStage: string): RoleAssignmentEligibilityCheck;
export {};
//# sourceMappingURL=role-assignment-eligibility.d.ts.map