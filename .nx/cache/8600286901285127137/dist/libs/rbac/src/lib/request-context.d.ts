import type { ActorContext, AuthorizationDecision, BranchConfiguration, ResourceContext } from './types';
/**
 * The shape `RbacGuard` and `RecordLevelPolicyGuard` expect to find
 * already attached to an incoming request. Populating it is explicitly
 * out of scope for this library and this sprint:
 *
 *   - `actor` is derived from a validated JWT (Blueprint Chapter 4 /
 *     Sprint 1.4, Cognito authentication - not yet implemented).
 *   - `resource` and `branchConfig` are derived from whatever record the
 *     endpoint is acting on and its Branch's configuration (Blueprint
 *     §6.2 / `libs/config`, and each domain module as it is built).
 *
 * This interface is the contract those future pieces must satisfy, not
 * an implementation of them - `libs/rbac` only consumes this shape.
 */
export interface EcclesiaRequestContext {
    actor: ActorContext;
    resource: ResourceContext;
    branchConfig: BranchConfiguration;
}
/** Property name the guards read this context from on the HTTP request. */
export declare const ECCLESIA_REQUEST_CONTEXT_KEY: "ecclesiaContext";
/**
 * Property name `RbacGuard` writes its role/scope decision to, so that
 * `RecordLevelPolicyGuard` (running second in the guard chain, per
 * Blueprint §9.4's `@UseGuards(RbacGuard, RecordLevelPolicyGuard)`
 * ordering) can finish evaluating the same matched rule instead of
 * re-deriving it from scratch.
 */
export declare const ECCLESIA_RBAC_DECISION_KEY: "ecclesiaRbacDecision";
export interface RequestWithEcclesiaContext {
    [ECCLESIA_REQUEST_CONTEXT_KEY]?: EcclesiaRequestContext;
    [ECCLESIA_RBAC_DECISION_KEY]?: AuthorizationDecision;
}
//# sourceMappingURL=request-context.d.ts.map