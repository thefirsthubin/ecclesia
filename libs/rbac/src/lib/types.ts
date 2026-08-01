import type { Action } from './actions';
import type { Role } from './roles';

/**
 * Blueprint §9.1 (ADR-005): the permission engine must distinguish
 * *unassigned* from *explicitly denied* as first-class concepts - PRD
 * §17.3's own "Reading note" insists on this distinction, since a role
 * can be senior enough to seem like it should have access while still
 * being explicitly barred (Resident Pastor barred from recording
 * transactions, BR-STW-01). `Effect` therefore has exactly two values;
 * "no matching rule" is a third, separate outcome handled by
 * `evaluate()`, not folded into this type.
 */
export type Effect = 'ALLOW' | 'DENY';

/**
 * Scope narrows a role-level grant to a set of resources, per Blueprint
 * §9.1's hybrid RBAC+ABAC model. Ordered here roughly by breadth for
 * readability only - scope comparison is by resource-membership, not by
 * this ordering.
 */
export type Scope = 'SELF' | 'OWN_GROUP' | 'CLUSTER' | 'BRANCH' | 'GLOBAL';

/**
 * Record-level policy checks (Blueprint §9.1, §9.4): the subset of PRD
 * §17.3/§17.4 rules that cannot be expressed as role + scope alone
 * because they depend on facts about the specific record being acted on.
 * Adding a new one means writing one function (`record-level-checks.ts`)
 * and referencing its id here and in the matrix - not writing a new
 * guard class (Blueprint §9.4's explicit design goal).
 */
export type RecordLevelCheckId =
  /** BR-STW-04 / PRD §17.4: verifier must differ from the recorder. */
  | 'DIFFERENT_ACTOR_THAN_RECORDER'
  /** Resolved PRD §24 OQ-02: Poimen completion gates a Shepherd grant
   *  only when the target Branch has turned the gate on (Blueprint §9.3). */
  | 'POIMEN_GATE_IF_ENABLED';

/**
 * One row of the executable permission matrix (Blueprint §9.3). Mirrors
 * PRD §17.3 cell-for-cell: `role` + `action` identify the cell, `effect`
 * is ALLOW or DENY, `scope` narrows an ALLOW to which resources it
 * covers, `recordLevelCheck` names an additional check that must also
 * pass, and `reason` cites the PRD section or business rule ID so the
 * "why" is discoverable in the code itself (Blueprint §9.3, closing
 * paragraph).
 */
export interface PermissionRule {
  role: Role;
  action: Action;
  effect: Effect;
  /** Required when effect is 'ALLOW' except for GLOBAL-scope grants;
   *  omitted for DENY rules, which apply regardless of scope. */
  scope?: Scope;
  recordLevelCheck?: RecordLevelCheckId;
  reason?: string;
}

/**
 * The authenticated actor attempting an action, and the scope of their
 * Role Assignment (PRD §12.2). Authentication itself (Sprint 1.4,
 * Blueprint Chapter 4) is what will eventually populate this shape from
 * a validated JWT; this library only consumes it.
 */
export interface ActorContext {
  personId: string;
  role: Role;
  branchId: string;
  clusterId?: string;
  bacentaId?: string;
  basontaId?: string;
}

/**
 * The resource an action targets, expressed as the scope identifiers
 * needed to evaluate a Scope check, plus whatever record-level facts a
 * `RecordLevelCheckId` needs (e.g. `recordedByPersonId` for
 * `DIFFERENT_ACTOR_THAN_RECORDER`).
 */
export interface ResourceContext {
  branchId: string;
  clusterId?: string;
  bacentaId?: string;
  basontaId?: string;
  /** For SELF-scope actions: the person the resource belongs to/is about. */
  ownerId?: string;
  /** For DIFFERENT_ACTOR_THAN_RECORDER: who performed the prior step. */
  recordedByPersonId?: string;
  /** For POIMEN_GATE_IF_ENABLED: the candidate being granted a role. */
  candidatePersonId?: string;
  /** For POIMEN_GATE_IF_ENABLED: the candidate's Poimen enrollment status. */
  candidatePoimenStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
}

/**
 * A Branch's relevant configuration flags (`platform.configurations`,
 * Blueprint §9.3). Only the fields this library's record-level checks
 * need are modeled here; the full configuration schema is owned
 * elsewhere (Blueprint §6.2, `libs/config`).
 */
export interface BranchConfiguration {
  poimenGateEnabled: boolean;
}

export interface AuthorizationDecision {
  effect: Effect;
  matchedRule?: PermissionRule;
  reason: string;
}
