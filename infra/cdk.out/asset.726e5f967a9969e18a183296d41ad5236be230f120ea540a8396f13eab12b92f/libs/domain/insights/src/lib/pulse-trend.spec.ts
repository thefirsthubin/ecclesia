import { evaluatePulseTrend } from './pulse-trend';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('evaluatePulseTrend (FR-INS-03)', () => {
  it('does not flag a trend with fewer than two history points', () => {
    const result = evaluatePulseTrend([{ score: 80, computedAt: NOW }], NOW);
    expect(result.declined).toBe(false);
  });

  it('flags a decline matching §11.2\'s own worked example (15 points over 3 weeks)', () => {
    const history = [
      { score: 75, computedAt: daysAgo(21) },
      { score: 60, computedAt: NOW },
    ];
    const result = evaluatePulseTrend(history, NOW);
    expect(result.declined).toBe(true);
    expect(result.deltaPoints).toBeCloseTo(-15);
  });

  it('does not flag a change within the threshold', () => {
    const history = [
      { score: 75, computedAt: daysAgo(21) },
      { score: 70, computedAt: NOW },
    ];
    const result = evaluatePulseTrend(history, NOW);
    expect(result.declined).toBe(false);
  });

  it('does not flag an improving trend', () => {
    const history = [
      { score: 60, computedAt: daysAgo(21) },
      { score: 80, computedAt: NOW },
    ];
    const result = evaluatePulseTrend(history, NOW);
    expect(result.declined).toBe(false);
    expect(result.deltaPoints).toBeCloseTo(20);
  });

  it('sorts unsorted input defensively before comparing', () => {
    const history = [
      { score: 60, computedAt: NOW },
      { score: 75, computedAt: daysAgo(21) },
    ];
    const result = evaluatePulseTrend(history, NOW);
    expect(result.declined).toBe(true);
  });

  it('only considers score points within the trailing window as the comparison baseline', () => {
    const history = [
      { score: 40, computedAt: daysAgo(90) },
      { score: 75, computedAt: daysAgo(20) },
      { score: 60, computedAt: NOW },
    ];
    const result = evaluatePulseTrend(history, NOW, 21);
    // Baseline should be the 20-days-ago point (75), not the 90-days-ago point (40).
    expect(result.deltaPoints).toBeCloseTo(-15);
  });
});
