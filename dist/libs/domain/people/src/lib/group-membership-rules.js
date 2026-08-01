"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.planGroupMembershipChange = planGroupMembershipChange;
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
function planGroupMembershipChange(targetGroupId, targetGroupType, activeMemberships) {
    const alreadyActiveInTargetGroup = activeMemberships.some((m) => m.groupId === targetGroupId);
    if (alreadyActiveInTargetGroup) {
        throw new Error(`Person already holds an active ${targetGroupType} membership in group '${targetGroupId}' - not a valid reassignment or duplicate join`);
    }
    if (targetGroupType === 'MINISTRY') {
        // BR-PPL-02: unconstrained - never closes any existing Basonta
        // membership, regardless of how many the Person already holds.
        return { membershipIdsToClose: [], reasonRequiredForClose: false };
    }
    // targetGroupType === 'PASTORAL_CARE': BR-PPL-01's single-active-Bacenta
    // invariant. There can be at most one active PASTORAL_CARE membership
    // already (the same invariant this function enforces, plus the
    // database's own `one_active_bacenta_per_person` partial unique index
    // as a backstop - Blueprint §7.5) - `.filter(...)` rather than assuming
    // exactly 0 or 1 defensively covers a data-integrity violation upstream
    // without this function crashing on it.
    const existingBacentaMemberships = activeMemberships.filter((m) => m.groupType === 'PASTORAL_CARE');
    return {
        membershipIdsToClose: existingBacentaMemberships.map((m) => m.id),
        reasonRequiredForClose: existingBacentaMemberships.length > 0,
    };
}
//# sourceMappingURL=group-membership-rules.js.map