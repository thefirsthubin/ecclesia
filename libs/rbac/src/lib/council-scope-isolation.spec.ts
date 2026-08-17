import { evaluate } from './evaluate';
import { PERMISSION_MATRIX } from './permission-matrix';
import type { ActorContext, BranchConfiguration } from './types';

/**
 * `[Multi-Tenant Foundation, Phase 1]` The mandatory security regression
 * test this phase's own instructions require: a named, concrete scenario -
 * not just the generic `describe.each` coverage in `permission-matrix.spec.ts`
 * - proving the actual authorization/data boundary a Council Treasurer sits
 * behind, by name, in a form a reviewer can read without cross-referencing
 * anything else.
 *
 * Uses the real `evaluate()` function and the real, production
 * `PERMISSION_MATRIX` - no mocked RBAC internals, no synthetic matrix. This
 * is the strongest form of "real code, not simulated" available in this
 * codebase for an authorization *decision* (a wrong decision here is what
 * would actually cause a cross-Branch/cross-Council data leak - getting
 * this right matters more than getting the SQL right).
 *
 * What this test does NOT prove, and does not claim to: the real Postgres
 * Row-Level Security layer underneath `PrismaService.runInBranchScope`/
 * `runInCouncilScope` (`apps/api/src/platform/database/prisma.service.ts`)
 * is not exercised here - this sandbox has no live Postgres connection to
 * exercise it against (confirmed via `pg_isready` while implementing this
 * phase), the same disclosed limitation every hand-written migration in
 * `db/migrations/README.md` already carries ("needs the same real-Postgres
 * verification pass... before being trusted"). That RLS layer is a second,
 * independent backstop underneath this one (defense in depth, per this
 * phase's own instructions) - not a replacement for it, and not yet proven
 * against a live database by this test or any other in this phase.
 */
describe('Council Treasurer cross-Council data isolation (Phase 1 mandatory security regression test)', () => {
  const GATE_DISABLED: BranchConfiguration = { poimenGateEnabled: false };

  // "River of Life" Council: two Branches.
  const RIVER_OF_LIFE_BRANCH_A = 'branch-river-of-life-headquarters';
  const RIVER_OF_LIFE_BRANCH_B = 'branch-river-of-life-asokwa';
  // A different Council entirely (could belong to the same Tenant or, once
  // Phase 2 exists, a different Tenant - the boundary this test cares about
  // is Council-level, which is what COUNCIL scope actually enforces).
  const OTHER_COUNCIL_BRANCH = 'branch-a-different-council-entirely';

  const riverOfLifeCouncilTreasurer: ActorContext = {
    personId: 'person-river-of-life-council-treasurer',
    role: 'COUNCIL_TREASURER',
    branchId: RIVER_OF_LIFE_BRANCH_A,
    tenantId: 'tenant-river-of-life',
    councilId: 'council-river-of-life',
    councilBranchIds: [RIVER_OF_LIFE_BRANCH_A, RIVER_OF_LIFE_BRANCH_B],
  };

  it('CAN read River of Life Branch A financial transactions', () => {
    const decision = evaluate(
      riverOfLifeCouncilTreasurer,
      'stewardship.transaction.read',
      { branchId: RIVER_OF_LIFE_BRANCH_A },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  it('CAN read River of Life Branch B financial transactions', () => {
    const decision = evaluate(
      riverOfLifeCouncilTreasurer,
      'stewardship.transaction.read',
      { branchId: RIVER_OF_LIFE_BRANCH_B },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('ALLOW');
  });

  it('CANNOT read a different Council’s Branch financial transactions', () => {
    const decision = evaluate(
      riverOfLifeCouncilTreasurer,
      'stewardship.transaction.read',
      { branchId: OTHER_COUNCIL_BRANCH },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('DENY');
    // Not merely "denied" - denied for the right structural reason (the
    // resource falls outside the actor's granted scope), not because no
    // rule matched at all. Distinguishing these two failure modes matters:
    // a role/action typo that accidentally matched no rule would also
    // "pass" a bare effect-is-DENY assertion.
    expect(decision.reason).toMatch(/outside the actor's COUNCIL scope/);
  });

  it('a Branch Treasurer (Branch-scoped, not Council-scoped) cannot read even their own Council’s other Branch', () => {
    // The companion negative case Phase 1's own testing requirements name
    // separately ("Branch scope remains unchanged") - proves COUNCIL scope
    // is additive, not a silent widening of what TREASURER already grants.
    const riverOfLifeBranchATreasurer: ActorContext = {
      personId: 'person-river-of-life-branch-a-treasurer',
      role: 'TREASURER',
      branchId: RIVER_OF_LIFE_BRANCH_A,
    };
    const decision = evaluate(
      riverOfLifeBranchATreasurer,
      'stewardship.transaction.read',
      { branchId: RIVER_OF_LIFE_BRANCH_B },
      GATE_DISABLED,
      PERMISSION_MATRIX,
    );
    expect(decision.effect).toBe('DENY');
  });
});
