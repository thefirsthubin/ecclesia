import { checkRoleAssignmentEligibility, isGatedRole } from './role-assignment-eligibility';
import type { GatedRole } from './role-assignment-eligibility';

describe('role-assignment-eligibility (BR-PPL-04 / FR-PPL-06)', () => {
  const gatedRoles: GatedRole[] = [
    'WORKER',
    'BACENTA_LEADER',
    'BASONTA_LEADER',
    'ASSISTANT_PASTOR',
    'RESIDENT_PASTOR',
    'TREASURER',
    'ACTING_RESIDENT_PASTOR',
  ];

  it.each(gatedRoles)('rejects granting %s to a non-Member', (role) => {
    const result = checkRoleAssignmentEligibility(role, 'SIX_WEEKS_PARTICIPATION');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('MEMBER');
  });

  it.each(gatedRoles)('allows granting %s to a Member', (role) => {
    expect(checkRoleAssignmentEligibility(role, 'MEMBER').eligible).toBe(true);
  });

  it('does not gate roles absent from BR-PPL-04/FR-PPL-06 (e.g. ADMIN)', () => {
    const result = checkRoleAssignmentEligibility('ADMIN', 'VISITOR');
    expect(result.eligible).toBe(true);
    expect(result.reason).toContain('not one of the lifecycle-stage-gated roles');
  });

  it('isGatedRole distinguishes gated from ungated roles', () => {
    expect(isGatedRole('BACENTA_LEADER')).toBe(true);
    expect(isGatedRole('MEMBER')).toBe(false);
    expect(isGatedRole('COUNCIL_OVERSEER')).toBe(false);
  });
});
