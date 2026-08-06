import { computeStaffingAdequacy } from './staffing-adequacy';

describe('computeStaffingAdequacy (FR-MIN-03)', () => {
  it('reports adequate when rostered meets or exceeds target', () => {
    const result = computeStaffingAdequacy(8, 8);
    expect(result.isAdequate).toBe(true);
    expect(result.ratio).toBe(1);
  });

  it('reports the "5 of 8 rostered" acceptance-criterion example as inadequate', () => {
    const result = computeStaffingAdequacy(8, 5);
    expect(result.isAdequate).toBe(false);
    expect(result.ratio).toBe(0.63);
  });

  it('reports adequate and clamps nothing when rostered exceeds target', () => {
    const result = computeStaffingAdequacy(4, 6);
    expect(result.isAdequate).toBe(true);
    expect(result.ratio).toBe(1.5);
  });

  it('treats a zero target as vacuously adequate (ratio 1, never divides by zero)', () => {
    const result = computeStaffingAdequacy(0, 0);
    expect(result.isAdequate).toBe(true);
    expect(result.ratio).toBe(1);
  });

  it('treats a negative/invalid target defensively the same as zero', () => {
    const result = computeStaffingAdequacy(-1, 0);
    expect(result.ratio).toBe(1);
  });
});
