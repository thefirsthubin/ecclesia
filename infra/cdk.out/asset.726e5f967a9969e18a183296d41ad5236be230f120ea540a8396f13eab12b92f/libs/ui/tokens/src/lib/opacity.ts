/** Opacity tokens (Design System v1.0 Part 6.9). */
export const opacity = {
  disabled: 0.4,
  overlay: 0.5,
  hover: 0.08,
  pressed: 0.16,
} as const;

export type OpacityToken = keyof typeof opacity;
