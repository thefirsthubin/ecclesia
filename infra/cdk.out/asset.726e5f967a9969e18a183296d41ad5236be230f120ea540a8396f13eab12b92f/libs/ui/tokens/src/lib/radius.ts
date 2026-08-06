/** Corner-radius tokens (Design System v1.0 Part 5.7, Part 6.8). */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
