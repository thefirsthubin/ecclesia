import type { Action } from './actions';
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
export const ECCLESIA_REQUEST_CONTEXT_KEY = 'ecclesiaContext' as const;

/**
 * Property name `RbacGuard` writes its role/scope decision to, so that
 * `RecordLevelPolicyGuard` (running second in the guard chain, per
 * Blueprint §9.4's `@UseGuards(RbacGuard, RecordLevelPolicyGuard)`
 * ordering) can finish evaluating the same matched rule instead of
 * re-deriving it from scratch.
 */
export const ECCLESIA_RBAC_DECISION_KEY = 'ecclesiaRbacDecision' as const;

/**
 * `[Audit Log milestone]` Property name `RbacGuard` writes the
 * `@RequirePermission`-declared action string to, alongside its decision.
 * Needed because `AuthorizationDecision.matchedRule` is only present when
 * at least one matrix row exists for this (role, action) pair at all - the
 * most common denial shape (a role with zero rows for the action) leaves
 * `matchedRule` `undefined`, and only the *reason string*, not a
 * structured field, names the action in that case
 * (`evaluateRoleAndScope`'s own "No Role Assignment grants '{action}' to
 * role '{role}'" text). Blueprint §9.6 requires every DENY to be logged
 * "with the attempted action" - `apps/api`'s exception filter (the single
 * place every `RbacGuard`-thrown 403 already passes through) needs this
 * to write a complete `platform.audit_log` row without parsing a
 * human-readable message string.
 */
export const ECCLESIA_RBAC_ACTION_KEY = 'ecclesiaRbacAction' as const;

export interface RequestWithEcclesiaContext {
  [ECCLESIA_REQUEST_CONTEXT_KEY]?: EcclesiaRequestContext;
  [ECCLESIA_RBAC_DECISION_KEY]?: AuthorizationDecision;
  [ECCLESIA_RBAC_ACTION_KEY]?: Action;
}
