/**
 * Bacenta (`PASTORAL_CARE`) / Basonta (`MINISTRY`) membership cardinality
 * invariants - PRD §12.6's comparison table, BR-PPL-01, BR-PPL-02,
 * FR-PPL-04, FR-PPL-05. Pure decision logic only: given the Person's
 * *currently active* memberships (as loaded by the caller) and the type
 * of Group being joined, decide which existing membership(s), if any,
 * must be closed. Persisting that decision (closing rows, inserting the
 * new one, in one transaction) is `apps/api`'s
 * `GroupMembershipService`'s job - this function has no database access,
 * per this library's framework-agnostic boundary (Blueprint §6.2/§6.4).
 */
export type GroupType = 'PASTORAL_CARE' | 'MINISTRY';
export interface ActiveGroupMembershipRef {
    id: string;
    groupId: string;
    groupType: GroupType;
}
export interface GroupMembershipChangePlan {
    /** Active memberships that must be closed before/with opening the new one. */
    membershipIdsToClose: string[];
    /**
     * PRD §16.1's Bacenta/Basonta reassignment surface: "Requires a reason
     * code... captured alongside the reassignment for audit clarity."
     * `db/schema.prisma`'s own `reason` field doc comment: "[BLUEPRINT-EXACT]
     * Required when a membership is closed." A brand-new membership with
     * nothing to close (first-ever Bacenta assignment, or an additional
     * concurrent Basonta) is not a "reassignment" and carries no such
     * requirement.
     */
    reasonRequiredForClose: boolean;
}
/**
 * BR-PPL-01 / FR-PPL-04: "exactly one active GROUP_MEMBERSHIP of type
 * PASTORAL_CARE per Person at any time, automatically closing the prior
 * membership when a new one is opened." Already joined to the *same*
 * Bacenta is rejected outright (not a reassignment, not a no-op the
 * caller should be able to trigger silently).
 *
 * BR-PPL-02 / FR-PPL-05: "zero or more concurrent active GROUP_MEMBERSHIP
 * records of type MINISTRY per Person" - joining another Basonta never
 * closes any existing one, and joining a Basonta the Person already
 * actively belongs to is rejected as a duplicate, not silently accepted
 * or silently closed-and-reopened.
 */
export declare function planGroupMembershipChange(targetGroupId: string, targetGroupType: GroupType, activeMemberships: ActiveGroupMembershipRef[]): GroupMembershipChangePlan;
//# sourceMappingURL=group-membership-rules.d.ts.map