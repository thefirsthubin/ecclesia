"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OVERCOMMITMENT_THRESHOLD = void 0;
exports.evaluateOvercommitment = evaluateOvercommitment;
/**
 * FR-MIN-04: "flag a Person as rostered across a configurable-threshold
 * number of concurrent Basontas/Gatherings as a possible overcommitment."
 * Acceptance criterion: "A worker rostered on 4+ overlapping Gathering
 * commitments in one week is flagged to their Basonta Leader(s)."
 *
 * **Modeled proxy, not the literal acceptance criterion.** The
 * acceptance criterion's own wording is about *Gathering*-level overlap
 * within one week - but `db/schema.prisma`'s `ministry` schema has no
 * per-Gathering roster-assignment entity (see `staffing-adequacy.ts`'s
 * own doc comment), so a Person's specific concurrent *Gathering*
 * commitments cannot be computed at all against the existing schema.
 * The closest computable proxy is a Person's count of concurrent active
 * Basonta (`GroupType.MINISTRY`) `GroupMembership` rows - a Person
 * serving in many Basontas at once is a reasonable, disclosed
 * approximation of "overcommitted," but is not the same measurement the
 * acceptance criterion describes. True Gathering-level overlap detection
 * needs a schema addition outside an application-layer milestone's
 * scope - the same "needs a schema change, not an engineering guess"
 * framing the Stewardship milestone used for FR-STW-07's bank-deposit
 * comparison. See `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
 *
 * `DEFAULT_OVERCOMMITMENT_THRESHOLD = 4` is `[PRD-DERIVED]` from the
 * acceptance criterion's own "4+" example - the one concrete number the
 * PRD gives anywhere for this rule, even though it was stated against a
 * different (uncomputable) measurement than the one actually used here.
 */
exports.DEFAULT_OVERCOMMITMENT_THRESHOLD = 4;
function evaluateOvercommitment(concurrentCommitmentCount, threshold = exports.DEFAULT_OVERCOMMITMENT_THRESHOLD) {
    return {
        concurrentCommitmentCount,
        threshold,
        overcommitted: concurrentCommitmentCount >= threshold,
    };
}
//# sourceMappingURL=overcommitment.js.map