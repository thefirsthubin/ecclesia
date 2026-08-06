import { planGroupMembershipChange } from './group-membership-rules';
import type { ActiveGroupMembershipRef } from './group-membership-rules';

describe('group-membership-rules (BR-PPL-01/02, FR-PPL-04/05)', () => {
  describe('PASTORAL_CARE (Bacenta) - BR-PPL-01 / FR-PPL-04', () => {
    it('opening a first Bacenta membership closes nothing and requires no reason', () => {
      const plan = planGroupMembershipChange('bacenta-2', 'PASTORAL_CARE', []);
      expect(plan).toEqual({ membershipIdsToClose: [], reasonRequiredForClose: false });
    });

    it('reassignment auto-closes the prior active Bacenta membership and requires a reason', () => {
      const active: ActiveGroupMembershipRef[] = [
        { id: 'membership-1', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
      ];
      const plan = planGroupMembershipChange('bacenta-2', 'PASTORAL_CARE', active);
      expect(plan).toEqual({ membershipIdsToClose: ['membership-1'], reasonRequiredForClose: true });
    });

    it('rejects joining the Bacenta the Person is already actively in', () => {
      const active: ActiveGroupMembershipRef[] = [
        { id: 'membership-1', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
      ];
      expect(() => planGroupMembershipChange('bacenta-1', 'PASTORAL_CARE', active)).toThrow(/already holds/);
    });

    it('defensively closes more than one active Bacenta membership if the data is already inconsistent', () => {
      const active: ActiveGroupMembershipRef[] = [
        { id: 'membership-1', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
        { id: 'membership-2', groupId: 'bacenta-3', groupType: 'PASTORAL_CARE' },
      ];
      const plan = planGroupMembershipChange('bacenta-2', 'PASTORAL_CARE', active);
      expect(plan.membershipIdsToClose.sort()).toEqual(['membership-1', 'membership-2']);
      expect(plan.reasonRequiredForClose).toBe(true);
    });
  });

  describe('MINISTRY (Basonta) - BR-PPL-02 / FR-PPL-05', () => {
    it('joining a Basonta closes nothing, even with other active Basonta memberships', () => {
      const active: ActiveGroupMembershipRef[] = [
        { id: 'membership-1', groupId: 'basonta-1', groupType: 'MINISTRY' },
      ];
      const plan = planGroupMembershipChange('basonta-2', 'MINISTRY', active);
      expect(plan).toEqual({ membershipIdsToClose: [], reasonRequiredForClose: false });
    });

    it('joining a Basonta never closes a concurrent active Bacenta membership', () => {
      const active: ActiveGroupMembershipRef[] = [
        { id: 'membership-1', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' },
      ];
      const plan = planGroupMembershipChange('basonta-1', 'MINISTRY', active);
      expect(plan.membershipIdsToClose).toEqual([]);
    });

    it('rejects joining a Basonta the Person already actively belongs to', () => {
      const active: ActiveGroupMembershipRef[] = [
        { id: 'membership-1', groupId: 'basonta-1', groupType: 'MINISTRY' },
      ];
      expect(() => planGroupMembershipChange('basonta-1', 'MINISTRY', active)).toThrow(/already holds/);
    });
  });
});
