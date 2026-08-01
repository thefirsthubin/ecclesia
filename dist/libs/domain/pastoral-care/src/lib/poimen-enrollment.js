"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.POIMEN_STATUSES = void 0;
exports.isPoimenStatus = isPoimenStatus;
exports.checkPoimenStatusTransition = checkPoimenStatusTransition;
exports.POIMEN_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'];
function isPoimenStatus(value) {
    return exports.POIMEN_STATUSES.includes(value);
}
const TRANSITIONS = {
    NOT_STARTED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETE'],
    COMPLETE: [],
};
function checkPoimenStatusTransition(from, to) {
    if (from === to) {
        return { allowed: false, reason: `'${from}' is already the current Poimen status; not a transition` };
    }
    const allowedNext = TRANSITIONS[from];
    if (!allowedNext.includes(to)) {
        return {
            allowed: false,
            reason: `FR-PC-06 [INFERRED forward-only progression]: '${from}' -> '${to}' is not a modeled transition (allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal status'})`,
        };
    }
    return { allowed: true, reason: `FR-PC-06: '${from}' -> '${to}' is a modeled Poimen enrollment transition` };
}
//# sourceMappingURL=poimen-enrollment.js.map