/**
 * Spacing tokens (Design System v1.0 Part 5.4, Part 6.3) - an 8pt-rhythm
 * scale, closed vocabulary (no arbitrary pixel value is used anywhere a
 * `space.*` token applies, per Part 6.12's token-only governance rule).
 * Plain numbers (px on both platforms - RN's `StyleSheet` numbers are
 * density-independent pixels already, matching web's px unit closely
 * enough for one shared scale).
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingStep = keyof typeof spacing;
