"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = void 0;
exports.isRole = isRole;
/**
 * Role catalog (PRD §17.2). One entry per row of that table, plus
 * `ACTING_RESIDENT_PASTOR` (Blueprint §8.6): the succession runbook
 * models interim authority as an ordinary, time-bound Role Assignment
 * holding this role, not a new entity type - so it must exist here, in
 * the same catalog, rather than as special-cased logic elsewhere.
 *
 * `VISITOR` and `COUNCIL_OVERSEER` are included for completeness with
 * PRD §17.2 even though neither has any ALLOW rows in the §17.3 matrix
 * today (Visitor is typically unauthenticated; Council Overseer is a
 * Horizon 3 role) - omitting them here would make the catalog silently
 * incomplete relative to its cited source.
 */
exports.ROLES = [
    'RESIDENT_PASTOR',
    'ACTING_RESIDENT_PASTOR',
    'ASSISTANT_PASTOR',
    'BACENTA_LEADER',
    'BASONTA_LEADER',
    'TREASURER',
    'WORKER',
    'MEMBER',
    'VISITOR',
    'ADMIN',
    'COUNCIL_OVERSEER',
];
function isRole(value) {
    return exports.ROLES.includes(value);
}
//# sourceMappingURL=roles.js.map