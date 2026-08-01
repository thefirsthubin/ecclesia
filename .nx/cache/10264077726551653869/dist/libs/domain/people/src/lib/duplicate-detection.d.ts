export interface DuplicateCandidateRecord {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    dateOfBirth?: Date | null;
    /** The candidate's currently active Bacenta (PASTORAL_CARE) group id, if any. */
    activeBacentaGroupId?: string | null;
}
export interface NewPersonForDuplicateCheck {
    firstName: string;
    lastName: string;
    phone?: string | null;
    dateOfBirth?: Date | null;
    /** Only set if a Bacenta is being assigned at creation time. */
    activeBacentaGroupId?: string | null;
}
export interface DuplicateMatch {
    candidateId: string;
    matchedOn: 'NAME_AND_PHONE' | 'NAME_AND_BACENTA_AND_APPROXIMATE_AGE';
    reason: string;
}
/**
 * `candidates` should already be a narrowed, plausible set (e.g. the
 * caller's repository query filters by `lastName` or Branch before
 * calling this) - this function does the FR-PPL-02 matching decision,
 * not candidate retrieval, keeping it framework/database-agnostic per
 * this library's boundary rules.
 */
export declare function findDuplicateCandidates(newPerson: NewPersonForDuplicateCheck, candidates: DuplicateCandidateRecord[], now?: Date): DuplicateMatch[];
//# sourceMappingURL=duplicate-detection.d.ts.map