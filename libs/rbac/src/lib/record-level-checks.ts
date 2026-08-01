import type { ActorContext, BranchConfiguration, RecordLevelCheckId, ResourceContext } from './types';

/**
 * A record-level policy function (Blueprint §9.1, §9.4): evaluated only
 * after role + scope have already granted access, deciding whether this
 * *specific record* may still proceed. Returns a reason string either
 * way so `evaluate()` can explain a DENY as precisely as an ALLOW.
 */
export interface RecordLevelCheckResult {
  passed: boolean;
  reason: string;
}

export type RecordLevelCheckFn = (
  actor: ActorContext,
  resource: ResourceContext,
  branchConfig: BranchConfiguration,
) => RecordLevelCheckResult;

/**
 * BR-STW-04 / PRD §17.4: the Person who verifies a Financial Transaction
 * must not be the same Person who recorded it - evaluated per-record,
 * because a static role check cannot see who acted on this specific
 * transaction (Blueprint §9.1's stated reason a pure-RBAC model is
 * insufficient here).
 */
const differentActorThanRecorder: RecordLevelCheckFn = (actor, resource) => {
  if (!resource.recordedByPersonId) {
    return {
      passed: false,
      reason: 'DIFFERENT_ACTOR_THAN_RECORDER: resource has no recordedByPersonId to compare against',
    };
  }
  const passed = actor.personId !== resource.recordedByPersonId;
  return {
    passed,
    reason: passed
      ? 'PRD §17.4 / BR-STW-04: verifying actor differs from the recording actor'
      : 'PRD §17.4 / BR-STW-04: the same Person recorded and is attempting to verify this transaction',
  };
};

/**
 * Resolved PRD §24 OQ-02: whether incomplete Poimen training blocks a
 * Shepherd (Bacenta Leader) Role Assignment is itself a per-Branch/
 * Council configuration flag, not a fixed rule (Blueprint §9.3). When
 * the flag is off, Poimen status is advisory-only and this check always
 * passes; when on, it additionally requires the candidate's enrollment
 * to be COMPLETE.
 */
const poimenGateIfEnabled: RecordLevelCheckFn = (_actor, resource, branchConfig) => {
  if (!branchConfig.poimenGateEnabled) {
    return {
      passed: true,
      reason: 'POIMEN_GATE_IF_ENABLED: gate disabled for this Branch - Poimen status is advisory-only',
    };
  }
  const passed = resource.candidatePoimenStatus === 'COMPLETE';
  return {
    passed,
    reason: passed
      ? "POIMEN_GATE_IF_ENABLED: gate enabled and candidate's Poimen enrollment is COMPLETE"
      : "POIMEN_GATE_IF_ENABLED: gate enabled and candidate's Poimen enrollment is not COMPLETE",
  };
};

/**
 * Registry mapping a `RecordLevelCheckId` (as referenced from
 * `permission-matrix.ts`) to its implementation. Adding a new
 * record-level rule means writing one function and one entry here, per
 * Blueprint §9.4's explicit design goal - not a new guard class.
 */
export const RECORD_LEVEL_CHECKS: Record<RecordLevelCheckId, RecordLevelCheckFn> = {
  DIFFERENT_ACTOR_THAN_RECORDER: differentActorThanRecorder,
  POIMEN_GATE_IF_ENABLED: poimenGateIfEnabled,
};
