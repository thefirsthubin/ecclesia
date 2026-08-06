import { DEFAULT_OVERCOMMITMENT_THRESHOLD, evaluateOvercommitment } from './overcommitment';

describe('evaluateOvercommitment (FR-MIN-04)', () => {
  it('does not flag a Person below the threshold', () => {
    const result = evaluateOvercommitment(3);
    expect(result.overcommitted).toBe(false);
  });

  it('flags a Person at the default threshold ("4+" per the acceptance criterion)', () => {
    const result = evaluateOvercommitment(4);
    expect(result.overcommitted).toBe(true);
    expect(result.threshold).toBe(DEFAULT_OVERCOMMITMENT_THRESHOLD);
  });

  it('flags a Person above the threshold', () => {
    expect(evaluateOvercommitment(6).overcommitted).toBe(true);
  });

  it('honors a Branch-configured custom threshold (FR-MIN-04: "configurable-threshold")', () => {
    expect(evaluateOvercommitment(2, 2).overcommitted).toBe(true);
    expect(evaluateOvercommitment(1, 2).overcommitted).toBe(false);
  });
});
