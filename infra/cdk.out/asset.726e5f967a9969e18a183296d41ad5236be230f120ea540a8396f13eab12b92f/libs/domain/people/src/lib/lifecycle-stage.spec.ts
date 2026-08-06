import {
  checkLifecycleTransition,
  isLifecycleStage,
  LIFECYCLE_STAGES,
  requiresGroupMembershipToTransition,
} from './lifecycle-stage';

describe('lifecycle-stage (PRD §12.5, BR-PPL-03, FR-PPL-03)', () => {
  describe('isLifecycleStage', () => {
    it('accepts every declared stage', () => {
      for (const stage of LIFECYCLE_STAGES) {
        expect(isLifecycleStage(stage)).toBe(true);
      }
    });

    it('rejects an unknown value', () => {
      expect(isLifecycleStage('NOT_A_STAGE')).toBe(false);
    });
  });

  describe('checkLifecycleTransition', () => {
    it.each([
      ['VISITOR', 'FIRST_TIME_GUEST'],
      ['FIRST_TIME_GUEST', 'FOLLOW_UP'],
      ['FOLLOW_UP', 'ASSIGNED_TO_BACENTA'],
      ['FOLLOW_UP', 'LAPSED'],
      ['LAPSED', 'FOLLOW_UP'],
      ['ASSIGNED_TO_BACENTA', 'SIX_WEEKS_PARTICIPATION'],
      ['SIX_WEEKS_PARTICIPATION', 'MEMBER'],
      ['SIX_WEEKS_PARTICIPATION', 'ASSIGNED_TO_BACENTA'],
    ] as const)('allows the modeled transition %s -> %s', (from, to) => {
      expect(checkLifecycleTransition(from, to)).toEqual({ allowed: true, reason: expect.any(String) });
    });

    it('rejects skipping straight from Visitor to Member (FR-PPL-03 acceptance criterion)', () => {
      const result = checkLifecycleTransition('VISITOR', 'MEMBER');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not a modeled transition');
    });

    it('rejects any transition out of the terminal Member stage', () => {
      for (const to of LIFECYCLE_STAGES) {
        if (to === 'MEMBER') continue;
        expect(checkLifecycleTransition('MEMBER', to).allowed).toBe(false);
      }
    });

    it('rejects a same-stage no-op transition', () => {
      const result = checkLifecycleTransition('FOLLOW_UP', 'FOLLOW_UP');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('already the current lifecycle stage');
    });

    it('rejects reverse-direction edges not explicitly modeled (e.g. AssignedToBacenta -> FollowUp)', () => {
      expect(checkLifecycleTransition('ASSIGNED_TO_BACENTA', 'FOLLOW_UP').allowed).toBe(false);
    });
  });

  describe('requiresGroupMembershipToTransition', () => {
    it('is true only for FollowUp -> AssignedToBacenta (PRD §19.1 step 6)', () => {
      expect(requiresGroupMembershipToTransition('FOLLOW_UP', 'ASSIGNED_TO_BACENTA')).toBe(true);
    });

    it('is false for every other transition', () => {
      expect(requiresGroupMembershipToTransition('LAPSED', 'FOLLOW_UP')).toBe(false);
      expect(requiresGroupMembershipToTransition('SIX_WEEKS_PARTICIPATION', 'MEMBER')).toBe(false);
    });
  });
});
