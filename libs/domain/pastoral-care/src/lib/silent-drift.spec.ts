import { evaluateSilentDrift } from './silent-drift';
import type { SilentDriftEvaluationInput } from './silent-drift';

function buildInput(overrides: Partial<SilentDriftEvaluationInput> = {}): SilentDriftEvaluationInput {
  return {
    hasActiveBacentaAssignment: true,
    recentGatheringAttendedCount: 3,
    attendanceThreshold: 3,
    recentBacentaAttendedCount: 3,
    bacentaThreshold: 3,
    ...overrides,
  };
}

describe('evaluateSilentDrift (PRD §15.8, BR-PC-02, FR-PC-05)', () => {
  it('node A: is not evaluated when the Person has no active Bacenta assignment', () => {
    const result = evaluateSilentDrift(buildInput({ hasActiveBacentaAssignment: false }));

    expect(result.flagged).toBe(false);
    expect(result.classification).toBe('NO_ACTIVE_BACENTA');
  });

  it('node B: is not flagged as silent drift when general attendance is below threshold (general disengagement instead)', () => {
    const result = evaluateSilentDrift(buildInput({ recentGatheringAttendedCount: 1, attendanceThreshold: 3 }));

    expect(result.flagged).toBe(false);
    expect(result.classification).toBe('GENERAL_DISENGAGEMENT');
  });

  it('node C: is healthy when general attendance meets threshold and Bacenta attendance also meets threshold', () => {
    const result = evaluateSilentDrift(buildInput());

    expect(result.flagged).toBe(false);
    expect(result.classification).toBe('HEALTHY');
  });

  it('node D: is flagged as silent drift when general attendance meets threshold but Bacenta attendance does not (FR-PC-05 acceptance example)', () => {
    const result = evaluateSilentDrift(
      buildInput({ recentGatheringAttendedCount: 3, attendanceThreshold: 3, recentBacentaAttendedCount: 0, bacentaThreshold: 3 }),
    );

    expect(result.flagged).toBe(true);
    expect(result.classification).toBe('SILENT_DRIFT');
    expect(result.attendanceMissedCount).toBe(0);
    expect(result.bacentaMissedCount).toBe(3);
  });

  it('computes attendanceMissedCount when general attendance exceeds the threshold requirement but Bacenta attendance still fails', () => {
    // Attendance above threshold (4 of last 3) still passes node B; the
    // "missed" count is clamped at zero rather than going negative.
    const result = evaluateSilentDrift(
      buildInput({ recentGatheringAttendedCount: 4, attendanceThreshold: 3, recentBacentaAttendedCount: 1, bacentaThreshold: 3 }),
    );

    expect(result.flagged).toBe(true);
    expect(result.attendanceMissedCount).toBe(0);
    expect(result.bacentaMissedCount).toBe(2);
  });
});
