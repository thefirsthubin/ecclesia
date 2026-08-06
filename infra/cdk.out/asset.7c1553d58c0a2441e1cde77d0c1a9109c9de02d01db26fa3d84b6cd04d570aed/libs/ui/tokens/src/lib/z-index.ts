/**
 * Z-index tokens (Design System v1.0 Part 6.10) - a closed, small scale.
 * React Native has no CSS stacking-context concept, but a numeric
 * `zIndex` style prop exists and behaves analogously within a given
 * positioned-view subtree, so this scale is shared as-is rather than
 * being web-only.
 */
export const zIndex = {
  base: 0,
  stickyHeader: 10,
  dropdown: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

export type ZIndexToken = keyof typeof zIndex;
