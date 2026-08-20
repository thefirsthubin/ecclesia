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
const BACENTA_ID = 'bacenta-1';
const ACTOR_PERSON_ID = 'person-actor';
const OTHER_PERSON_ID = 'person-someone-else';

const GATE_DISABLED: BranchConfiguration = { poimenGateEnabled: false };

/** An actor whose scope identifiers line up with IN_SCOPE_RESOURCE below.
 * `clusterBacentaIds` includes `BACENTA_ID` so the same in-scope resource
 * fixture below satisfies both OWN_GROUP and CLUSTER scope checks.
 * `[Multi-Tenant Foundation, Phase 1]` `councilBranchIds` includes
 * `BRANCH_ID` the same way, so this same fixture also satisfies COUNCIL
 * scope for any current/future role holding a COUNCIL-scoped grant. */
function buildActor(rule: PermissionRule): ActorContext {
  return {
    personId: ACTOR_PERSON_ID,
    role: rule.role,
    branchId: BRANCH_ID,
    clusterBacentaIds: [BACENTA_ID],
    bacentaId: BACENTA_ID,
    councilBranchIds: [BRANCH_ID],
  };
}

/** A resource inside every scope the actor above could plausibly hold. */
function buildInScopeResource(rule: PermissionRule): ResourceContext {
  const base: ResourceContext = {
    branchId: BRANCH_ID,
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
      return { branchId: BRANCH_ID, bacentaId: 'a-different-bacenta' };
    case 'CLUSTER':
      return { branchId: BRANCH_ID, bacentaId: 'a-bacenta-outside-the-cluster' };
    case 'BRANCH':
      return { branchId: 'a-different-branch' };
    case 'COUNCIL':
      // [Multi-Tenant Foundation, Phase 1] Outside the actor's
      // councilBranchIds set entirely - e.g. a different Council's Branch.
      return { branchId: 'a-branch-in-a-different-council' };
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

  /**
   * `[Multi-Tenant Foundation, Phase 1]` Pinned COUNCIL_TREASURER to
   * exactly one row this phase (`stewardship.transaction.read`).
   * `[Post-Milestone D — Portal Experiences follow-up]` A second row,
   * `platform.branch.read`, was added deliberately (Branch-name
   * resolution for the Council views this role already reaches) - this
   * test now pins exactly those two, not more.
   */
  it('COUNCIL_TREASURER holds exactly two rows: stewardship.transaction.read and platform.branch.read, both at COUNCIL scope', () => {
    const rows = PERMISSION_MATRIX.filter((rule) => rule.role === 'COUNCIL_TREASURER');
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual(expect.objectContaining({ action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'COUNCIL' }));
    expect(rows).toContainEqual(expect.objectContaining({ action: 'platform.branch.read', effect: 'ALLOW', scope: 'COUNCIL' }));
  });

  it('SYSTEM_ADMINISTRATOR holds exactly one row this phase: platform.tenant.read at GLOBAL scope, and no people/stewardship/pastoral_care rows at all', () => {
    const rows = PERMISSION_MATRIX.filter((rule) => rule.role === 'SYSTEM_ADMINISTRATOR');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'platform.tenant.read',
      effect: 'ALLOW',
      scope: 'GLOBAL',
    });
    expect(rows.some((rule) => rule.action.startsWith('people.'))).toBe(false);
    expect(rows.some((rule) => rule.action.startsWith('stewardship.'))).toBe(false);
    expect(rows.some((rule) => rule.action.startsWith('pastoral_care.'))).toBe(false);
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

/**
 * `[Bug fix, Branch Pastor Gatherings Access]` Focused, human-readable
 * coverage on top of the generic executable spec above (which already
 * exercises this exact row via its `describe.each`) - the audit finding
 * this fixes was specifically "ASSISTANT_PASTOR (labelled 'Branch Pastor'
 * in Web Admin) can see the Gatherings nav item but the API 403s," so
 * this block asserts that scenario by name rather than relying solely on
 * the generic loop to make the intent legible.
 */
describe('Branch Pastor (ASSISTANT_PASTOR) Gatherings read access', () => {
  const CLUSTER_BACENTA_ID = 'cluster-bacenta-1';
  const OTHER_BRANCH_BACENTA_ID = 'other-branch-bacenta';

  const actor: ActorContext = {
    personId: 'assistant-pastor-1',
    role: 'ASSISTANT_PASTOR',
    branchId: BRANCH_ID,
    clusterBacentaIds: [CLUSTER_BACENTA_ID],
  };

  it('is ALLOWED to read a Gathering owned by a Bacenta in their own cluster', () => {
    const decision = evaluate(
      actor,
      'gatherings.gathering.read',
      { branchId: BRANCH_ID, bacentaId: CLUSTER_BACENTA_ID },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  /**
   * `[Widened CLUSTER -> BRANCH, Branch Pastor Dashboard sprint]` This
   * used to be DENIED under CLUSTER scope - now ALLOWED, since the grant
   * is BRANCH scope (matching RESIDENT_PASTOR/ADMIN/USHER). A real,
   * intentional widening: a Branch Pastor can now read any Gathering in
   * their own Branch, not only their own cluster's.
   */
  it('is ALLOWED for a Gathering owned by a Bacenta outside their cluster, as long as it is in the same Branch', () => {
    const decision = evaluate(
      actor,
      'gatherings.gathering.read',
      { branchId: BRANCH_ID, bacentaId: 'a-bacenta-not-in-my-cluster' },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  it('is DENIED for a Gathering in a different Branch entirely', () => {
    const decision = evaluate(
      actor,
      'gatherings.gathering.read',
      { branchId: 'a-different-branch', bacentaId: OTHER_BRANCH_BACENTA_ID },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('DENY');
  });

  /**
   * `[Widened CLUSTER -> BRANCH, Branch Pastor Dashboard sprint]` This
   * used to be DENIED - CLUSTER scope's evaluator is structurally unable
   * to match a resource with no `bacentaId` (see `evaluate.ts`'s own
   * doc comment), which is exactly the shape of a Branch-wide Gathering
   * like Sunday Service. BRANCH scope has no such restriction -
   * `resource.branchId === actor.branchId` alone is sufficient - so this
   * is now ALLOWED, closing the "Branch Pastor can never find the
   * Sunday Service Gathering" gap the Branch Pastor Dashboard needs.
   */
  it('is ALLOWED for an unfiltered/Branch-wide resource (no single owning Bacenta, e.g. Sunday Service) now that the grant is BRANCH scope', () => {
    const decision = evaluate(actor, 'gatherings.gathering.read', { branchId: BRANCH_ID }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('ALLOW');
  });

  it('the permission matrix contains exactly the intended grant: ALLOW, BRANCH scope, no record-level check', () => {
    const rows = PERMISSION_MATRIX.filter((rule) => rule.role === 'ASSISTANT_PASTOR' && rule.action === 'gatherings.gathering.read');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ effect: 'ALLOW', scope: 'BRANCH' });
    expect(rows[0].recordLevelCheck).toBeUndefined();
  });

  it('other roles on gatherings.gathering.read are unchanged by this fix', () => {
    // `[Multi-Tenant Foundation, Phase 1]` RESIDENT_PASTOR's row is no
    // longer BRANCH - widened to COUNCIL by the Resident Pastor
    // Council-visibility policy (permission-matrix.ts's own top-of-file
    // comment) - a separate, later, intentional change, not a regression
    // of the Branch Pastor Dashboard sprint fix this test otherwise
    // guards. `toMatchObject`, not the original `toEqual`, since the row
    // now also carries a `reason` field this test doesn't need to pin.
    const residentPastor = PERMISSION_MATRIX.filter((rule) => rule.role === 'RESIDENT_PASTOR' && rule.action === 'gatherings.gathering.read');
    expect(residentPastor).toHaveLength(1);
    expect(residentPastor[0]).toMatchObject({ effect: 'ALLOW', scope: 'COUNCIL' });

    const bacentaLeader = PERMISSION_MATRIX.filter((rule) => rule.role === 'BACENTA_LEADER' && rule.action === 'gatherings.gathering.read');
    expect(bacentaLeader).toHaveLength(1);
    expect(bacentaLeader[0]).toMatchObject({ effect: 'ALLOW', scope: 'OWN_GROUP' });

    // BASONTA_LEADER already held its own OWN_GROUP read grant before this
    // fix (Mobile Personas sprint) - untouched here, still exactly one row.
    const basontaLeader = PERMISSION_MATRIX.filter((rule) => rule.role === 'BASONTA_LEADER' && rule.action === 'gatherings.gathering.read');
    expect(basontaLeader).toHaveLength(1);
    expect(basontaLeader[0]).toMatchObject({ effect: 'ALLOW', scope: 'OWN_GROUP' });

    const admin = PERMISSION_MATRIX.filter((rule) => rule.role === 'ADMIN' && rule.action === 'gatherings.gathering.read');
    expect(admin).toHaveLength(1);
    expect(admin[0]).toMatchObject({ effect: 'ALLOW', scope: 'BRANCH' });
  });
});

/**
 * `[Bug fix, Branch Pastor Dashboard sprint]` Focused, human-readable
 * coverage alongside the generic executable spec above - the gap this
 * fixes was "a Branch Pastor could record attendance (`.create`, CLUSTER
 * scope) but had no `.read` grant at any scope, so attendance could
 * never be read back" - the one attendance-recording role (of
 * BACENTA_LEADER/BASONTA_LEADER/ADMIN/USHER/ASSISTANT_PASTOR) missing
 * this pairing.
 */
describe('Branch Pastor (ASSISTANT_PASTOR) Attendance read access', () => {
  const CLUSTER_BACENTA_ID = 'cluster-bacenta-1';

  const actor: ActorContext = {
    personId: 'assistant-pastor-1',
    role: 'ASSISTANT_PASTOR',
    branchId: BRANCH_ID,
    clusterBacentaIds: [CLUSTER_BACENTA_ID],
  };

  it('is ALLOWED to read attendance for a Gathering owned by a Bacenta in their own cluster', () => {
    const decision = evaluate(
      actor,
      'gatherings.attendance.read',
      { branchId: BRANCH_ID, bacentaId: CLUSTER_BACENTA_ID },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  /**
   * `[Widened CLUSTER -> BRANCH, same sprint]` This used to be DENIED -
   * now ALLOWED, for the same structural reason `gatherings.gathering.read`
   * was widened above: the Branch-wide Sunday Service Gathering has no
   * `bacentaId`, which CLUSTER scope can never match. A real,
   * intentional widening - a Branch Pastor can now read attendance
   * (individual-level PRESENT/ABSENT/EXCUSED records) for any Gathering
   * in their Branch, not only their own cluster's.
   */
  it('is ALLOWED to read attendance for a Gathering owned by a Bacenta outside their cluster, as long as it is in the same Branch', () => {
    const decision = evaluate(
      actor,
      'gatherings.attendance.read',
      { branchId: BRANCH_ID, bacentaId: 'a-bacenta-not-in-my-cluster' },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  it('is ALLOWED to read attendance for the Branch-wide Sunday Service Gathering (no bacentaId) now that the grant is BRANCH scope', () => {
    const decision = evaluate(actor, 'gatherings.attendance.read', { branchId: BRANCH_ID }, GATE_DISABLED, PERMISSION_MATRIX);
    expect(decision.effect).toBe('ALLOW');
  });

  it('the permission matrix contains exactly the intended grant: ALLOW, BRANCH scope, no record-level check', () => {
    const rows = PERMISSION_MATRIX.filter((rule) => rule.role === 'ASSISTANT_PASTOR' && rule.action === 'gatherings.attendance.read');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ effect: 'ALLOW', scope: 'BRANCH' });
    expect(rows[0].recordLevelCheck).toBeUndefined();
  });

  it('the paired .create grant is unchanged by this fix - still CLUSTER scope', () => {
    const rows = PERMISSION_MATRIX.filter((rule) => rule.role === 'ASSISTANT_PASTOR' && rule.action === 'gatherings.attendance.create');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ effect: 'ALLOW', scope: 'CLUSTER' });
  });
});
