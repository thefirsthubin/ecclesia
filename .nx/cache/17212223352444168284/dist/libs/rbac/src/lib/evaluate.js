"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRoleAndScope = evaluateRoleAndScope;
exports.evaluateRecordLevelCheck = evaluateRecordLevelCheck;
exports.evaluate = evaluate;
const record_level_checks_1 = require("./record-level-checks");
/**
 * Does `resource` fall within the scope granted by `scope`, for this
 * `actor`? Blueprint §9.2, step "Resource falls within that Role
 * Assignment's scope - own Bacenta/cluster/Branch?".
 *
 * OWN_GROUP matches either a led Bacenta or a led Basonta: a single
 * `Scope` value covers both because PRD §17.2 gives Bacenta Leader and
 * Basonta Leader the same *shape* of authority (their own single group),
 * just over different group types - modeling them as two scope values
 * would duplicate every OWN_GROUP rule in the matrix for no semantic gain.
 */
function resourceInScope(scope, actor, resource) {
    switch (scope) {
        case 'GLOBAL':
            return true;
        case 'SELF':
            return resource.ownerId !== undefined && resource.ownerId === actor.personId;
        case 'OWN_GROUP':
            return ((actor.bacentaId !== undefined && resource.bacentaId === actor.bacentaId) ||
                (actor.basontaId !== undefined && resource.basontaId === actor.basontaId));
        case 'CLUSTER':
            // Set membership, not equality - see ActorContext.clusterBacentaIds's
            // doc comment (types.ts). A resource with no bacentaId (no single
            // owning Bacenta) can never match CLUSTER scope.
            return (actor.clusterBacentaIds !== undefined &&
                resource.bacentaId !== undefined &&
                actor.clusterBacentaIds.includes(resource.bacentaId));
        case 'BRANCH':
            return resource.branchId === actor.branchId;
    }
}
/**
 * Steps 1-3 of Blueprint §9.2's flow: explicit deny, role grant, and
 * scope. Stops *before* any record-level check, which is deliberately a
 * separate function (`evaluateRecordLevelCheck` below) so the two can be
 * run as two independent NestJS guards (`RbacGuard`,
 * `RecordLevelPolicyGuard`, Blueprint §9.4) without either needing to
 * re-derive work the other already did.
 */
function evaluateRoleAndScope(actor, action, resource, matrix) {
    const rulesForCell = matrix.filter((rule) => rule.role === actor.role && rule.action === action);
    const explicitDeny = rulesForCell.find((rule) => rule.effect === 'DENY');
    if (explicitDeny) {
        return {
            effect: 'DENY',
            matchedRule: explicitDeny,
            reason: explicitDeny.reason ?? 'Explicit deny rule matched',
        };
    }
    const allowRule = rulesForCell.find((rule) => rule.effect === 'ALLOW');
    if (!allowRule) {
        return {
            effect: 'DENY',
            reason: `No Role Assignment grants '${action}' to role '${actor.role}'`,
        };
    }
    if (allowRule.scope && !resourceInScope(allowRule.scope, actor, resource)) {
        return {
            effect: 'DENY',
            matchedRule: allowRule,
            reason: `Resource is outside the actor's ${allowRule.scope} scope for '${action}'`,
        };
    }
    return {
        effect: 'ALLOW',
        matchedRule: allowRule,
        reason: allowRule.reason ?? `Role '${actor.role}' is granted '${action}' at scope '${allowRule.scope}'`,
    };
}
/**
 * Step 4 of Blueprint §9.2's flow, given a rule that `evaluateRoleAndScope`
 * already matched as an ALLOW. If that rule names no `recordLevelCheck`,
 * there is nothing further to evaluate and this simply confirms the
 * existing decision.
 */
function evaluateRecordLevelCheck(decision, actor, resource, branchConfig) {
    if (decision.effect === 'DENY' || !decision.matchedRule?.recordLevelCheck) {
        return decision;
    }
    const check = record_level_checks_1.RECORD_LEVEL_CHECKS[decision.matchedRule.recordLevelCheck];
    const result = check(actor, resource, branchConfig);
    return {
        effect: result.passed ? 'ALLOW' : 'DENY',
        matchedRule: decision.matchedRule,
        reason: result.reason,
    };
}
/**
 * The full authorization engine (Blueprint §9.2), composing the two
 * steps above in one call: explicit deny -> role grant -> scope ->
 * record-level check -> ALLOW. This is what the executable specification
 * (`permission-matrix.spec.ts`, Blueprint §9.5) calls directly, and what
 * any service-layer code should call for an imperative check outside the
 * HTTP guard pipeline (`RbacGuard` and `RecordLevelPolicyGuard` are thin
 * adapters around these same two functions for the guard pipeline).
 */
function evaluate(actor, action, resource, branchConfig, matrix) {
    const roleAndScope = evaluateRoleAndScope(actor, action, resource, matrix);
    return evaluateRecordLevelCheck(roleAndScope, actor, resource, branchConfig);
}
//# sourceMappingURL=evaluate.js.map