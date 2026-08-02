"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECCLESIA_RBAC_DECISION_KEY = exports.ECCLESIA_REQUEST_CONTEXT_KEY = void 0;
/** Property name the guards read this context from on the HTTP request. */
exports.ECCLESIA_REQUEST_CONTEXT_KEY = 'ecclesiaContext';
/**
 * Property name `RbacGuard` writes its role/scope decision to, so that
 * `RecordLevelPolicyGuard` (running second in the guard chain, per
 * Blueprint §9.4's `@UseGuards(RbacGuard, RecordLevelPolicyGuard)`
 * ordering) can finish evaluating the same matched rule instead of
 * re-deriving it from scratch.
 */
exports.ECCLESIA_RBAC_DECISION_KEY = 'ecclesiaRbacDecision';
//# sourceMappingURL=request-context.js.map