import { checkPoimenStatusTransition, isPoimenStatus, POIMEN_STATUSES } from './poimen-enrollment';

describe('poimen-enrollment (FR-PC-06)', () => {
  describe('isPoimenStatus', () => {
    it('accepts every declared status', () => {
      for (const status of POIMEN_STATUSES) {
        expect(isPoimenStatus(status)).toBe(true);
      }
    });

    it('rejects an unknown value', () => {
      expect(isPoimenStatus('NOT_A_STATUS')).toBe(false);
    });
  });

  describe('checkPoimenStatusTransition', () => {
    it('allows NOT_STARTED -> IN_PROGRESS', () => {
      expect(checkPoimenStatusTransition('NOT_STARTED', 'IN_PROGRESS')).toEqual({
        allowed: true,
        reason: expect.any(String),
      });
    });

    it('allows IN_PROGRESS -> COMPLETE', () => {
      expect(checkPoimenStatusTransition('IN_PROGRESS', 'COMPLETE')).toEqual({
        allowed: true,
        reason: expect.any(String),
      });
    });

    it('rejects skipping straight from NOT_STARTED to COMPLETE', () => {
      const result = checkPoimenStatusTransition('NOT_STARTED', 'COMPLETE');
      expect(result.allowed).toBe(false);
    });

    it('rejects any transition out of the terminal COMPLETE status', () => {
      expect(checkPoimenStatusTransition('COMPLETE', 'IN_PROGRESS').allowed).toBe(false);
      expect(checkPoimenStatusTransition('COMPLETE', 'NOT_STARTED').allowed).toBe(false);
    });

    it('rejects a same-status no-op transition', () => {
      const result = checkPoimenStatusTransition('IN_PROGRESS', 'IN_PROGRESS');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('already the current Poimen status');
    });

    it('rejects the reverse-direction edge IN_PROGRESS -> NOT_STARTED', () => {
      expect(checkPoimenStatusTransition('IN_PROGRESS', 'NOT_STARTED').allowed).toBe(false);
    });
  });
});
