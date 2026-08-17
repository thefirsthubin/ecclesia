import { evaluate, evaluateRecordLevelCheck, evaluateRoleAndScope } from './evaluate';
import type { ActorContext, BranchConfiguration, PermissionRule, ResourceContext } from './types';

const GATE_DISABLED: BranchConfiguration = { poimenGateEnabled: false };

const actor: ActorContext = {
  personId: 'actor-1',
  role: 'BACENTA_LEADER',
  branchId: 'branch-1',
  bacentaId: 'bacenta-1',
};

const resourceInScope: ResourceContext = {
  branchId: 'branch-1',
  bacentaId: 'bacenta-1',
};

describe('evaluate() - deny-overrides-allow (Blueprint §9.1, §9.2)', () => {
  it('denies when an explicit DENY rule exists for the (role, action), even if an ALLOW rule also exists', () => {
    // A synthetic matrix, deliberately containing both an ALLOW and a
    // DENY for the same cell - not a real PRD §17.3 combination, but the
    // engine's precedence must hold regardless of whether the real
    // matrix currently happens to exercise it.
    const matrix: PermissionRule[] = [
      { role: 'BACENTA_LEADER', action: 'stewardship.transaction.record', effect: 'ALLOW', scope: 'OWN_GROUP' },
      { role: 'BACENTA_LEADER', action: 'stewardship.transaction.record', effect: 'DENY', reason: 'test override' },
    ];
    const decision = evaluate(actor, 'stewardship.transaction.record', resourceInScope, GATE_DISABLED, matrix);
    expect(decision.effect).toBe('DENY');
    expect(decision.reason).toBe('test override');
  });

  it('denies when no rule at all matches the (role, action)', () => {
    const decision = evaluate(actor, 'platform.audit_log.read', resourceInScope, GATE_DISABLED, []);
    expect(decision.effect).toBe('DENY');
    expect(decision.matchedRule).toBeUndefined();
  });
});

describe('evaluate() - scope resolution (Blueprint §9.2)', () => {
  const matrix: PermissionRule[] = [
    { role: 'BACENTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  ];

  it('allows when the resource is within the actor’s own Bacenta', () => {
    const decision = evaluateRoleAndScope(actor, 'gatherings.attendance.create', resourceInScope, matrix);
    expect(decision.effect).toBe('ALLOW');
  });

  it('denies when the resource belongs to a different Bacenta', () => {
    const decision = evaluateRoleAndScope(
      actor,
      'gatherings.attendance.create',
      { ...resourceInScope, bacentaId: 'a-different-bacenta' },
      matrix,
    );
    expect(decision.effect).toBe('DENY');
  });

  it('OWN_GROUP also matches via a led Basonta, for a Basonta Leader', () => {
    const basontaLeader: ActorContext = {
      personId: 'actor-2',
      role: 'BASONTA_LEADER',
      branchId: 'branch-1',
      basontaId: 'basonta-1',
    };
    const basontaMatrix: PermissionRule[] = [
      { role: 'BASONTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    ];
    const inScope = evaluateRoleAndScope(
      basontaLeader,
      'gatherings.attendance.create',
      { branchId: 'branch-1', basontaId: 'basonta-1' },
      basontaMatrix,
    );
    expect(inScope.effect).toBe('ALLOW');

    const outOfScope = evaluateRoleAndScope(
      basontaLeader,
      'gatherings.attendance.create',
      { branchId: 'branch-1', basontaId: 'a-different-basonta' },
      basontaMatrix,
    );
    expect(outOfScope.effect).toBe('DENY');
  });

  it('CLUSTER scope allows when the resource’s Bacenta is in the actor’s clusterBacentaIds set', () => {
    const assistantPastor: ActorContext = {
      personId: 'ap-1',
      role: 'ASSISTANT_PASTOR',
      branchId: 'branch-1',
      clusterBacentaIds: ['bacenta-1', 'bacenta-2', 'bacenta-3'],
    };
    const clusterMatrix: PermissionRule[] = [
      { role: 'ASSISTANT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'CLUSTER' },
    ];

    const decision = evaluateRoleAndScope(
      assistantPastor,
      'people.person.read',
      { branchId: 'branch-1', bacentaId: 'bacenta-2' },
      clusterMatrix,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  it('CLUSTER scope denies when the resource’s Bacenta is not in the actor’s clusterBacentaIds set', () => {
    const assistantPastor: ActorContext = {
      personId: 'ap-1',
      role: 'ASSISTANT_PASTOR',
      branchId: 'branch-1',
      clusterBacentaIds: ['bacenta-1', 'bacenta-2'],
    };
    const clusterMatrix: PermissionRule[] = [
      { role: 'ASSISTANT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'CLUSTER' },
    ];

    const decision = evaluateRoleAndScope(
      assistantPastor,
      'people.person.read',
      { branchId: 'branch-1', bacentaId: 'a-bacenta-outside-the-cluster' },
      clusterMatrix,
    );
    expect(decision.effect).toBe('DENY');
  });

  it('CLUSTER scope denies when the actor holds no clusterBacentaIds at all (the pre-fix default)', () => {
    const assistantPastorWithNoCluster: ActorContext = {
      personId: 'ap-2',
      role: 'ASSISTANT_PASTOR',
      branchId: 'branch-1',
    };
    const clusterMatrix: PermissionRule[] = [
      { role: 'ASSISTANT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'CLUSTER' },
    ];

    const decision = evaluateRoleAndScope(
      assistantPastorWithNoCluster,
      'people.person.read',
      { branchId: 'branch-1', bacentaId: 'bacenta-1' },
      clusterMatrix,
    );
    expect(decision.effect).toBe('DENY');
  });

  it('CLUSTER scope denies when the resource has no bacentaId at all (nothing to test membership against)', () => {
    const assistantPastor: ActorContext = {
      personId: 'ap-1',
      role: 'ASSISTANT_PASTOR',
      branchId: 'branch-1',
      clusterBacentaIds: ['bacenta-1'],
    };
    const clusterMatrix: PermissionRule[] = [
      { role: 'ASSISTANT_PASTOR', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'CLUSTER' },
    ];

    const decision = evaluateRoleAndScope(
      assistantPastor,
      'insights.branch_dashboard.read',
      { branchId: 'branch-1' },
      clusterMatrix,
    );
    expect(decision.effect).toBe('DENY');
  });

  /**
   * `[Multi-Tenant Foundation, Phase 1]` COUNCIL scope - set membership
   * against `councilBranchIds`, the same shape as CLUSTER's
   * `clusterBacentaIds` tests above, one level up the hierarchy.
   */
  it('COUNCIL scope allows when the resource’s branchId is in the actor’s councilBranchIds set', () => {
    const councilTreasurer: ActorContext = {
      personId: 'ct-1',
      role: 'COUNCIL_TREASURER',
      branchId: 'branch-1',
      councilId: 'council-1',
      councilBranchIds: ['branch-1', 'branch-2', 'branch-3'],
    };
    const councilMatrix: PermissionRule[] = [
      { role: 'COUNCIL_TREASURER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'COUNCIL' },
    ];

    const decision = evaluateRoleAndScope(
      councilTreasurer,
      'stewardship.transaction.read',
      { branchId: 'branch-2' },
      councilMatrix,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  it('COUNCIL scope denies when the resource’s branchId is not in the actor’s councilBranchIds set (a different Council’s Branch)', () => {
    const councilTreasurer: ActorContext = {
      personId: 'ct-1',
      role: 'COUNCIL_TREASURER',
      branchId: 'branch-1',
      councilId: 'council-1',
      councilBranchIds: ['branch-1', 'branch-2'],
    };
    const councilMatrix: PermissionRule[] = [
      { role: 'COUNCIL_TREASURER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'COUNCIL' },
    ];

    const decision = evaluateRoleAndScope(
      councilTreasurer,
      'stewardship.transaction.read',
      { branchId: 'a-branch-in-a-different-council' },
      councilMatrix,
    );
    expect(decision.effect).toBe('DENY');
  });

  it('COUNCIL scope denies when the actor holds no councilBranchIds at all (e.g. a Branch-scoped actor)', () => {
    const branchTreasurer: ActorContext = {
      personId: 'bt-1',
      role: 'TREASURER',
      branchId: 'branch-1',
    };
    const councilMatrix: PermissionRule[] = [
      { role: 'TREASURER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'COUNCIL' },
    ];

    const decision = evaluateRoleAndScope(
      branchTreasurer,
      'stewardship.transaction.read',
      { branchId: 'branch-1' },
      councilMatrix,
    );
    expect(decision.effect).toBe('DENY');
  });

  it('GLOBAL scope matches any resource', () => {
    const councilOverseer: ActorContext = { personId: 'actor-3', role: 'COUNCIL_OVERSEER', branchId: 'branch-1' };
    const globalMatrix: PermissionRule[] = [
      { role: 'COUNCIL_OVERSEER', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'GLOBAL' },
    ];
    const decision = evaluateRoleAndScope(
      councilOverseer,
      'insights.branch_dashboard.read',
      { branchId: 'a-branch-the-actor-has-no-other-relationship-to' },
      globalMatrix,
    );
    expect(decision.effect).toBe('ALLOW');
  });
});

describe('evaluateRecordLevelCheck() (Blueprint §9.2 step 4)', () => {
  const allowWithCheck: PermissionRule = {
    role: 'TREASURER',
    action: 'stewardship.transaction.verify',
    effect: 'ALLOW',
    scope: 'BRANCH',
    recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
  };

  it('passes a DENY decision through unchanged (nothing left to check)', () => {
    const deny = { effect: 'DENY' as const, reason: 'already denied' };
    expect(evaluateRecordLevelCheck(deny, actor, resourceInScope, GATE_DISABLED)).toBe(deny);
  });

  it('passes an ALLOW decision through unchanged when its rule names no record-level check', () => {
    const allowNoCheck = {
      effect: 'ALLOW' as const,
      matchedRule: { role: 'MEMBER', action: 'people.person.read', effect: 'ALLOW' } as PermissionRule,
      reason: 'granted',
    };
    expect(evaluateRecordLevelCheck(allowNoCheck, actor, resourceInScope, GATE_DISABLED)).toBe(allowNoCheck);
  });

  it('downgrades ALLOW to DENY when the named record-level check fails', () => {
    const treasurer: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };
    const sameActorResource: ResourceContext = { branchId: 'branch-1', recordedByPersonId: 'treasurer-1' };
    const decision = evaluateRecordLevelCheck(
      { effect: 'ALLOW', matchedRule: allowWithCheck, reason: 'role/scope granted' },
      treasurer,
      sameActorResource,
      GATE_DISABLED,
    );
    expect(decision.effect).toBe('DENY');
  });
});
