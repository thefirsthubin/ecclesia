"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordLevelPolicyGuard = void 0;
const tslib_1 = require("tslib");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const evaluate_1 = require("../evaluate");
const request_context_1 = require("../request-context");
/**
 * Generic, shared guard evaluating Blueprint §9.2 step 4 (the
 * record-level policy check, if the matched rule names one). Must run
 * *after* `RbacGuard` in the same `@UseGuards(...)` list (Blueprint
 * §9.4's exact ordering) - it consumes the decision `RbacGuard` already
 * attached to the request rather than re-deriving it.
 *
 * A rule with no `recordLevelCheck` simply passes through unchanged, so
 * this guard is safe to include even on endpoints that turn out not to
 * need one - though Blueprint §9.4's example only shows it where a check
 * is actually named.
 */
let RecordLevelPolicyGuard = class RecordLevelPolicyGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ecclesiaContext = request[request_context_1.ECCLESIA_REQUEST_CONTEXT_KEY];
        const priorDecision = request[request_context_1.ECCLESIA_RBAC_DECISION_KEY];
        if (!ecclesiaContext || !priorDecision) {
            throw new common_1.ForbiddenException('RecordLevelPolicyGuard requires RbacGuard to run first on the same route (missing prior decision)');
        }
        const finalDecision = (0, evaluate_1.evaluateRecordLevelCheck)(priorDecision, ecclesiaContext.actor, ecclesiaContext.resource, ecclesiaContext.branchConfig);
        request[request_context_1.ECCLESIA_RBAC_DECISION_KEY] = finalDecision;
        if (finalDecision.effect === 'DENY') {
            throw new common_1.ForbiddenException(finalDecision.reason);
        }
        return true;
    }
};
exports.RecordLevelPolicyGuard = RecordLevelPolicyGuard;
exports.RecordLevelPolicyGuard = RecordLevelPolicyGuard = tslib_1.__decorate([
    (0, common_1.Injectable)()
], RecordLevelPolicyGuard);
//# sourceMappingURL=record-level-policy.guard.js.map