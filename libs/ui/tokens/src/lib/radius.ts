/**
 * Corner-radius tokens (Design System v1.0 Part 5.7, Part 6.8).
 * `md`/`lg` tightened from 8/12 to 6/8 (`[UX Design Implementation]`,
 * Final UX Design Specification §5) - a tighter corner reads as more
 * precise and restrained than the wider range most "modern SaaS"
 * products default to, at zero migration cost since every consumer
 * reads `theme.radius.md`/`.lg` by name, never a literal pixel value.
 */
export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
