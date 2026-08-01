import { checkGatheringStatusTransition, GATHERING_STATUSES, isConfiguredGatheringType, isGatheringStatus } from './gathering-status';

describe('gathering-status', () => {
  describe('isGatheringStatus', () => {
    it('accepts every declared status', () => {
      for (const status of GATHERING_STATUSES) {
        expect(isGatheringStatus(status)).toBe(true);
      }
    });

    it('rejects an unknown value', () => {
      expect(isGatheringStatus('POSTPONED')).toBe(false);
    });
  });

  describe('checkGatheringStatusTransition', () => {
    it('allows SCHEDULED -> CANCELLED', () => {
      expect(checkGatheringStatusTransition('SCHEDULED', 'CANCELLED').allowed).toBe(true);
    });

    it('allows SCHEDULED -> COMPLETED', () => {
      expect(checkGatheringStatusTransition('SCHEDULED', 'COMPLETED').allowed).toBe(true);
    });

    it('rejects any transition out of a terminal status', () => {
      expect(checkGatheringStatusTransition('CANCELLED', 'SCHEDULED').allowed).toBe(false);
      expect(checkGatheringStatusTransition('COMPLETED', 'SCHEDULED').allowed).toBe(false);
    });

    it('rejects a same-status no-op transition', () => {
      const result = checkGatheringStatusTransition('SCHEDULED', 'SCHEDULED');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('already the current status');
    });
  });

  describe('isConfiguredGatheringType', () => {
    it('accepts a type present in the Branch-configured list', () => {
      expect(isConfiguredGatheringType('SUNDAY_FIRST_SERVICE', ['SUNDAY_FIRST_SERVICE', 'BACENTA_MEETING'])).toBe(true);
    });

    it('rejects a type not present in the Branch-configured list', () => {
      expect(isConfiguredGatheringType('YOUTH_CAMP', ['SUNDAY_FIRST_SERVICE'])).toBe(false);
    });
  });
});
