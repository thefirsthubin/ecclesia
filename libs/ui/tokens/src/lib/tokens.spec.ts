import { getContrastRatio, getRelativeLuminance, WCAG_AA_NORMAL_TEXT_MIN_RATIO } from './contrast';
import { neutral, brand, status, lightPalette, darkPalette, getChurchPulseBand, CHURCH_PULSE_BANDS, type StatusKey } from './color';

describe('contrast.ts', () => {
  it('computes relative luminance of pure white as 1 and pure black as 0', () => {
    expect(getRelativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(getRelativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('computes a contrast ratio of 21:1 between pure black and pure white', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('is order-independent', () => {
    expect(getContrastRatio('#1B7A6E', '#FFFFFF')).toBeCloseTo(getContrastRatio('#FFFFFF', '#1B7A6E'), 5);
  });
});

describe('color tokens - WCAG AA contrast (Design System §1.5, NFR-USA-02)', () => {
  it('text.primary on surface.default clears 4.5:1 (light mode)', () => {
    expect(getContrastRatio(lightPalette.text.primary, lightPalette.surface.default)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_MIN_RATIO,
    );
  });

  it('text.secondary on surface.default clears 4.5:1 (light mode)', () => {
    expect(getContrastRatio(lightPalette.text.secondary, lightPalette.surface.default)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_MIN_RATIO,
    );
  });

  it('text.primary on surface.default clears 4.5:1 (dark mode)', () => {
    expect(getContrastRatio(darkPalette.text.primary, darkPalette.surface.default)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_MIN_RATIO,
    );
  });

  it('text.secondary on surface.default clears 4.5:1 (dark mode)', () => {
    expect(getContrastRatio(darkPalette.text.secondary, darkPalette.surface.default)).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_MIN_RATIO,
    );
  });

  it('white text on brand.light.default (the primary button fill) clears 4.5:1', () => {
    expect(getContrastRatio(neutral[0], brand.light.default)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN_RATIO);
  });

  const statusKeys: StatusKey[] = ['success', 'warning', 'danger', 'info', 'neutral'];

  it.each(statusKeys)('white text on status.%s.strong (solid fills) clears 4.5:1', (key) => {
    expect(getContrastRatio(neutral[0], status[key].strong)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN_RATIO);
  });

  it.each(statusKeys)('status.%s light-mode foreground on its own background clears 4.5:1', (key) => {
    const { foreground, background } = status[key].light;
    expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN_RATIO);
  });

  it.each(statusKeys)('status.%s dark-mode foreground on its own background clears 4.5:1', (key) => {
    const { foreground, background } = status[key].dark;
    expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_MIN_RATIO);
  });
});

describe('getChurchPulseBand (FR-INS-01, PRD §13; band boundaries: Design decision extending v1.0 Part 10.1)', () => {
  it('resolves a score of 85 to "thriving"', () => {
    expect(getChurchPulseBand(85).key).toBe('thriving');
  });

  it('resolves a score of 70 to "healthy"', () => {
    expect(getChurchPulseBand(70).key).toBe('healthy');
  });

  it('resolves a score of 50 to "attention"', () => {
    expect(getChurchPulseBand(50).key).toBe('attention');
  });

  it('resolves a score of 10 to "atRisk"', () => {
    expect(getChurchPulseBand(10).key).toBe('atRisk');
  });

  it('clamps out-of-range scores instead of throwing', () => {
    expect(getChurchPulseBand(-5).key).toBe('atRisk');
    expect(getChurchPulseBand(150).key).toBe('thriving');
  });

  it('bands are exhaustive and non-overlapping across [0, 100]', () => {
    for (let score = 0; score <= 100; score += 1) {
      expect(() => getChurchPulseBand(score)).not.toThrow();
    }
    const sorted = [...CHURCH_PULSE_BANDS].sort((a, b) => a.min - b.min);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
    }
  });
});
