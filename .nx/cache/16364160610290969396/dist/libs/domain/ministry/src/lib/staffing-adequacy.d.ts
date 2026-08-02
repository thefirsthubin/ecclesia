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
export interface StaffingAdequacy {
    targetCount: number;
    rosteredCount: number;
    /** `rosteredCount / targetCount`, or `1` when `targetCount` is 0 (a
     * target of zero is vacuously satisfied - never divide by zero). */
    ratio: number;
    isAdequate: boolean;
}
export declare function computeStaffingAdequacy(targetCount: number, rosteredCount: number): StaffingAdequacy;
//# sourceMappingURL=staffing-adequacy.d.ts.map