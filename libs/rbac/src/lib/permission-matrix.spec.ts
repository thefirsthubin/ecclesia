import { evaluate } from './evaluate';
import { PERMISSION_MATRIX } from './permission-matrix';
import type { ActorContext, BranchConfiguration, PermissionRule, ResourceContext, Scope } from './types';

/**
 * The executable permission specification (Blueprint §9.5): "a generated
 * test suite iterates every (role, action, scope) combination in the PRD
 * table and asserts the API's actual authorization decision matches it
 * exactly, including the explicit-deny cells." This file is that suite.
 *
 * It does not hand-write expected results per role/action - it walks
 * `PERMISSION_MATRIX` itself and, for every rule, builds the minimal
 * actor/resource pair that rule's own `scope` and `recordLevelCheck`
 * describe as satisfying, then asserts `evaluate()` agrees. This means
 * the test suite's coverage grows automatically as PRD §17.3 grows the
 * matrix - exactly the "cannot silently drift apart" property Blueprint
 * §9.5 describes.
 */

const BRANCH_ID = 'branch-1';
const CLUSTER_ID = 'cluster-1';
const BACENTA_ID = 'bacenta-1';
const ACTOR_PERSON_ID = 'person-actor';
const OTHER_PERSON_ID = 'person-someone-else';

const GATE_DISABLED: BranchConfiguration = { poimenGateEnabled: false };

/** An actor whose scope identifiers line up with IN_SCOPE_RESOURCE below. */
function buildActor(rule: PermissionRule): ActorContext {
  return {
    personId: ACTOR_PERSON_ID,
    role: rule.role,
    branchId: BRANCH_ID,
    clusterId: CLUSTER_ID,
    bacentaId: BACENTA_ID,
  };
}

/** A resource inside every scope the actor above could plausibly hold. */
function buildInScopeResource(rule: PermissionRule): ResourceContext {
  const base: ResourceContext = {
    branchId: BRANCH_ID,
    clusterId: CLUSTER_ID,
    bacentaId: BACENTA_ID,
    ownerId: ACTOR_PERSON_ID,
  };
  if (rule.recordLevelCheck === 'DIFFERENT_ACTOR_THAN_RECORDER') {
    // A passing case for this check: someone else recorded it.
    base.recordedByPersonId = OTHER_PERSON_ID;
  }
  if (rule.recordLevelCheck === 'POIMEN_GATE_IF_ENABLED') {
    base.candidatePersonId = 'candidate-1';
    base.candidatePoimenStatus = 'COMPLETE';
  }
  return base;
}

function buildOutOfScopeResource(scope: Scope): ResourceContext {
  switch (scope) {
    case 'SELF':
      return { branchId: BRANCH_ID, ownerId: OTHER_PERSON_ID };
    case 'OWN_GROUP':
      return { branchId: BRANCH_ID, clusterId: CLUSTER_ID, bacentaId: 'a-different-bacenta' };
    case 'CLUSTER':
      return { branchId: BRANCH_ID, clusterId: 'a-different-cluster' };
    case 'BRANCH':
      return { branchId: 'a-different-branch' };
    case 'GLOBAL':
      return { branchId: BRANCH_ID }; // GLOBAL has no "outside" - nothing to assert here
  }
}

describe('PERMISSION_MATRIX as an executable specification (Blueprint §9.5)', () => {
  it('is not empty and covers every role that has any PRD §17.3 grant', () => {
    expect(PERMISSION_MATRIX.length).toBeGreaterThan(0);
    const rolesInMatrix = new Set(PERMISSION_MATRIX.map((rule) => rule.role));
    expect(rolesInMatrix).toContain('RESIDENT_PASTOR');
    expect(rolesInMatrix).toContain('TREASURER');
    expect(rolesInMatrix).toContain('ACTING_RESIDENT_PASTOR');
  });

  describe.each(PERMISSION_MATRIX)('$role / $action -> $effect', (rule: PermissionRule) => {
    if (rule.effect === 'DENY') {
      it('is denied regardless of resource scope (explicit deny overrides any grant)', () => {
        const decision = evaluate(
          buildActor(rule),
          rule.action,
          buildInScopeResource(rule),
          GATE_DISABLED,
          PERMISSION_MATRIX,
        );
        expect(decision.effect).toBe('DENY');
      });
    } else {
      it('is allowed when the resource is within the granted scope', () => {
        const decision = evaluate(
          buildActor(rule),
          rule.action,
          buildInScopeResource(rule),
          GATE_DISABLED,
          PERMISSION_MATRIX,
        );
        expect(decision.effect).toBe('ALLOW');
        expect(decision.matchedRule).toBe(rule);
      });

      if (rule.scope && rule.scope !== 'GLOBAL') {
        it('is denied when the resource falls outside the granted scope', () => {
          const decision = evaluate(
            buildActor(rule),
            rule.action,
            buildOutOfScopeResource(rule.scope as Scope),
            GATE_DISABLED,
            PERMISSION_MATRIX,
          );
          expect(decision.effect).toBe('DENY');
        });
      }
    }
  });

  it('denies an action no rule grants to a given role at all (unassigned, not merely undocumented)', () => {
    // MEMBER has no rule for platform.audit_log.read anywhere in the matrix.
    const actor: ActorContext = { personId: ACTOR_PERSON_ID, role: 'MEMBER', branchId: BRANCH_ID };
    const decision = evaluate(
      actor,
      'platform.audit_log.read',
      { branchId: BRANCH_ID },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('DENY');
    expect(decision.matchedRule).toBeUndefined();
  });
});
