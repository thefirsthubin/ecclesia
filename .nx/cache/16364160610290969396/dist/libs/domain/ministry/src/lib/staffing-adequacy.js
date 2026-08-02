"use strict";
/**
 * FR-MIN-03: "compute and display staffing adequacy (rostered workers vs.
 * staffing target) per Basonta per upcoming Gathering." Acceptance
 * criterion: "A Basonta Leader sees a ratio (e.g., '5 of 8 rostered')
 * updating as workers are added to the roster."
 *
 * **"Rostered" = active Basonta `GroupMembership`, not a per-Gathering
 * roster assignment.** `db/schema.prisma`'s `ministry` schema models only
 * `StaffingTarget` (a target count against one Group+Gathering pair) - no
 * separate "who is assigned to serve at this specific Gathering" entity
 * exists. The acceptance criterion's own wording ("updating as workers
 * are added to the roster") confirms this reading: adding a worker to the
 * roster means opening a `GroupMembership` (People's existing
 * `GroupMembershipService`), not a Ministry-owned per-Gathering
 * assignment action. `computeStaffingAdequacy()` is therefore a pure
 * function of two counts the caller already has - a target and a current
 * roster size - not a query itself.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStaffingAdequacy = computeStaffingAdequacy;
function computeStaffingAdequacy(targetCount, rosteredCount) {
    const ratio = targetCount <= 0 ? 1 : rosteredCount / targetCount;
    return {
        targetCount,
        rosteredCount,
        ratio: Math.round(ratio * 100) / 100,
        isAdequate: rosteredCount >= targetCount,
    };
}
//# sourceMappingURL=staffing-adequacy.js.map