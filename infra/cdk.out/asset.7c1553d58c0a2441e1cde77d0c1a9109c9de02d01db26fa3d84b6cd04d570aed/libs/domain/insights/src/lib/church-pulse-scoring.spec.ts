import {
  computeCategoryScore,
  computeChurchPulseScore,
  DEFAULT_CHURCH_PULSE_WEIGHTS,
  isChurchPulseSignalType,
} from './church-pulse-scoring';

describe('isChurchPulseSignalType', () => {
  it('recognizes every modeled signal type and rejects unknown strings', () => {
    expect(isChurchPulseSignalType('ATTENDANCE')).toBe(true);
    expect(isChurchPulseSignalType('VISITOR_CONVERSION')).toBe(true);
    expect(isChurchPulseSignalType('SOMETHING_ELSE')).toBe(false);
  });
});

describe('computeCategoryScore', () => {
  it('returns 0 for no signals', () => {
    expect(computeCategoryScore(0)).toBe(0);
  });

  it('scales linearly up to the provisional full-score threshold (10 signals)', () => {
    expect(computeCategoryScore(5)).toBe(50);
  });

  it('clamps at 100 beyond the threshold', () => {
    expect(computeCategoryScore(50)).toBe(100);
  });
});

describe('computeChurchPulseScore (BR-INS-01)', () => {
  it('returns 0 when every category has no signals', () => {
    const result = computeChurchPulseScore({});
    expect(result).toBe(0);
  });

  it('returns 100 when every category is fully saturated', () => {
    const fullCounts = { ATTENDANCE: 10, GROUP_MEMBERSHIP: 10, FINANCIAL_GIVING: 10, FOLLOW_UP_OUTCOME: 10, ROLE_ASSIGNMENT: 10, VISITOR_CONVERSION: 10 };
    expect(computeChurchPulseScore(fullCounts)).toBe(100);
  });

  it('is not reducible to a single signal category (BR-INS-01) - one saturated category alone caps well below 100', () => {
    const result = computeChurchPulseScore({ ATTENDANCE: 100 }, DEFAULT_CHURCH_PULSE_WEIGHTS);
    // Equal-sixths weighting: one fully-saturated category contributes at most 1/6th of the total.
    expect(result).toBeCloseTo(100 / 6, 1);
  });

  it('treats a missing category as a count of 0, pulling the average down rather than shrinking the denominator', () => {
    const withFive = computeChurchPulseScore({ ATTENDANCE: 10, GROUP_MEMBERSHIP: 10 });
    const withSix = computeChurchPulseScore({ ATTENDANCE: 10, GROUP_MEMBERSHIP: 10, FINANCIAL_GIVING: 10 });
    expect(withSix).toBeGreaterThan(withFive);
  });

  it('returns 0 when the supplied weights are all zero (defensive against a totally-unconfigured Branch)', () => {
    const zeroWeights = { ATTENDANCE: 0, GROUP_MEMBERSHIP: 0, FINANCIAL_GIVING: 0, FOLLOW_UP_OUTCOME: 0, ROLE_ASSIGNMENT: 0, VISITOR_CONVERSION: 0 };
    expect(computeChurchPulseScore({ ATTENDANCE: 10 }, zeroWeights)).toBe(0);
  });
});
