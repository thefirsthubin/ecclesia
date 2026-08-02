/**
 * Responsive breakpoints (Design System v1.0 Part 6.11) - Web Admin only
 * by definition (Part 6.11: "Mobile does not use these breakpoints... a
 * single-column layout... with fluid, not breakpoint-based, scaling").
 * Kept in the shared tokens package anyway (not `ui-web`-only) because a
 * tablet-aware React Native layout is a plausible, cheap-to-support future
 * case even though the Design System does not currently require it, and
 * because keeping ALL token categories in one leaf package - even ones a
 * given platform mostly doesn't use - is simpler to reason about than
 * splitting tokens by platform relevance.
 */
export declare const breakpoints: {
    readonly sm: 640;
    readonly md: 1024;
    readonly lg: 1280;
    readonly xl: 1536;
};
export type BreakpointToken = keyof typeof breakpoints;
//# sourceMappingURL=breakpoints.d.ts.map