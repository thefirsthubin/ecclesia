/**
 * Z-index tokens (Design System v1.0 Part 6.10) - a closed, small scale.
 * React Native has no CSS stacking-context concept, but a numeric
 * `zIndex` style prop exists and behaves analogously within a given
 * positioned-view subtree, so this scale is shared as-is rather than
 * being web-only.
 */
export declare const zIndex: {
    readonly base: 0;
    readonly stickyHeader: 10;
    readonly dropdown: 20;
    readonly overlay: 30;
    readonly modal: 40;
    readonly toast: 50;
};
export type ZIndexToken = keyof typeof zIndex;
//# sourceMappingURL=z-index.d.ts.map