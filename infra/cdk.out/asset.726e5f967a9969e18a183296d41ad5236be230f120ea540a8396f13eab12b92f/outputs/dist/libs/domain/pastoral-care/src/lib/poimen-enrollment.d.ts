/**
 * FR-PC-06: "track Poimen training enrollment and completion status per
 * Person." `db/schema.prisma`'s `PoimenStatus` enum (`NOT_STARTED`,
 * `IN_PROGRESS`, `COMPLETE`) models this as a linear progression - the
 * PRD names no regression path (no requirement or user story describes
 * completed training being revoked or in-progress training being reset),
 * so [INFERRED] this module treats the progression as forward-only,
 * mirroring `libs/domain/people/lifecycle-stage.ts`'s same
 * "not-shown-means-disallowed" discipline for its own state machine.
 * Whether Poimen completion *gates* the Shepherd Role Assignment is a
 * separate, already-resolved concern (PRD §24 OQ-02) implemented as
 * `libs/rbac`'s `POIMEN_GATE_IF_ENABLED` record-level check - this module
 * only validates the enrollment status transition itself, not its
 * downstream authorization effect.
 */
export declare const POIMEN_STATUSES: readonly ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];
export type PoimenStatus = (typeof POIMEN_STATUSES)[number];
export declare function isPoimenStatus(value: string): value is PoimenStatus;
export interface PoimenStatusTransitionCheck {
    allowed: boolean;
    reason: string;
}
export declare function checkPoimenStatusTransition(from: PoimenStatus, to: PoimenStatus): PoimenStatusTransitionCheck;
//# sourceMappingURL=poimen-enrollment.d.ts.map