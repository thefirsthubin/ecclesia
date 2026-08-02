"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDuplicateCandidates = findDuplicateCandidates;
/**
 * FR-PPL-02: "detect likely duplicate Person records (matching name +
 * phone number, or name + Bacenta + approximate age) and require explicit
 * merge or reject action by an authorized role before two records can
 * coexist silently." Pure matching logic only - `apps/api`'s
 * `PersonService` is responsible for fetching a plausible candidate set
 * from Postgres (this function does not query anything) and for the
 * "require explicit merge or reject action" half (Open Question below).
 *
 * **Provisional threshold, same discipline as PRD §15.8's silent-drift
 * N=3/M=3 placeholder.** FR-PPL-02's rule text says "approximate age"
 * without a number. There is no leadership-calibration session for this
 * threshold documented anywhere in either source document (unlike
 * silent-drift, which PRD FR-PC-05 explicitly says ships with a
 * provisional N=3/M=3 "pending one live calibration session"). `AGE_TOLERANCE_YEARS`
 * below is therefore an engineering placeholder, not a cited value -
 * flagged in `PEOPLE_DESIGN_NOTES.md` as needing the same kind of
 * calibration FR-PC-05 already got.
 */
const AGE_TOLERANCE_YEARS = 2;
function normalizeName(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
function ageInYears(dateOfBirth, asOf) {
    let age = asOf.getFullYear() - dateOfBirth.getFullYear();
    const hadBirthdayThisYear = asOf.getMonth() > dateOfBirth.getMonth() ||
        (asOf.getMonth() === dateOfBirth.getMonth() && asOf.getDate() >= dateOfBirth.getDate());
    if (!hadBirthdayThisYear)
        age -= 1;
    return age;
}
/**
 * `candidates` should already be a narrowed, plausible set (e.g. the
 * caller's repository query filters by `lastName` or Branch before
 * calling this) - this function does the FR-PPL-02 matching decision,
 * not candidate retrieval, keeping it framework/database-agnostic per
 * this library's boundary rules.
 */
function findDuplicateCandidates(newPerson, candidates, now = new Date()) {
    const newNameKey = `${normalizeName(newPerson.firstName)} ${normalizeName(newPerson.lastName)}`;
    const matches = [];
    for (const candidate of candidates) {
        const candidateNameKey = `${normalizeName(candidate.firstName)} ${normalizeName(candidate.lastName)}`;
        if (candidateNameKey !== newNameKey)
            continue;
        if (newPerson.phone && candidate.phone && newPerson.phone === candidate.phone) {
            matches.push({
                candidateId: candidate.id,
                matchedOn: 'NAME_AND_PHONE',
                reason: 'FR-PPL-02: matching name and phone number',
            });
            continue;
        }
        if (newPerson.activeBacentaGroupId &&
            candidate.activeBacentaGroupId &&
            newPerson.activeBacentaGroupId === candidate.activeBacentaGroupId &&
            newPerson.dateOfBirth &&
            candidate.dateOfBirth) {
            const ageDiff = Math.abs(ageInYears(newPerson.dateOfBirth, now) - ageInYears(candidate.dateOfBirth, now));
            if (ageDiff <= AGE_TOLERANCE_YEARS) {
                matches.push({
                    candidateId: candidate.id,
                    matchedOn: 'NAME_AND_BACENTA_AND_APPROXIMATE_AGE',
                    reason: `FR-PPL-02: matching name, same Bacenta, approximate age (within ${AGE_TOLERANCE_YEARS} years - provisional threshold, see PEOPLE_DESIGN_NOTES.md)`,
                });
            }
        }
    }
    return matches;
}
//# sourceMappingURL=duplicate-detection.js.map