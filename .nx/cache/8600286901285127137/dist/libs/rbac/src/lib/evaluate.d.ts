import type { Action } from './actions';
import type { ActorContext, AuthorizationDecision, BranchConfiguration, PermissionRule, ResourceContext } from './types';
/**
 * Steps 1-3 of Blueprint §9.2's flow: explicit deny, role grant, and
 * scope. Stops *before* any record-level check, which is deliberately a
 * separate function (`evaluateRecordLevelCheck` below) so the two can be
 * run as two independent NestJS guards (`RbacGuard`,
 * `RecordLevelPolicyGuard`, Blueprint §9.4) without either needing to
 * re-derive work the other already did.
 */
export declare function evaluateRoleAndScope(actor: ActorContext, action: Action, resource: ResourceContext, matrix: PermissionRule[]): AuthorizationDecision;
/**
 * Step 4 of Blueprint §9.2's flow, given a rule that `evaluateRoleAndScope`
 * already matched as an ALLOW. If that rule names no `recordLevelCheck`,
 * there is nothing further to evaluate and this simply confirms the
 * existing decision.
 */
export declare function evaluateRecordLevelCheck(decision: AuthorizationDecision, actor: ActorContext, resource: ResourceContext, branchConfig: BranchConfiguration): AuthorizationDecision;
/**
 * The full authorization engine (Blueprint §9.2), composing the two
 * steps above in one call: explicit deny -> role grant -> scope ->
 * record-level check -> ALLOW. This is what the executable specification
 * (`permission-matrix.spec.ts`, Blueprint §9.5) calls directly, and what
 * any service-layer code should call for an imperative check outside the
 * HTTP guard pipeline (`RbacGuard` and `RecordLevelPolicyGuard` are thin
 * adapters around these same two functions for the guard pipeline).
 */
export declare function evaluate(actor: ActorContext, action: Action, resource: ResourceContext, branchConfig: BranchConfiguration, matrix: PermissionRule[]): AuthorizationDecision;
//# sourceMappingURL=evaluate.d.ts.map