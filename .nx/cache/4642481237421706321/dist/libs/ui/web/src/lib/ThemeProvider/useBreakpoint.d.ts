import type { BreakpointToken } from '@ecclesia/ui-core';
/**
 * Resolves the current viewport to the largest breakpoint it satisfies
 * (Design System v1.0 Part 6.11 / Part 4's "Responsive utilities"). Web
 * Admin only in practice - Part 6.11 is explicit that Mobile does not use
 * these breakpoints - but the hook itself lives here in `ui-web`, not
 * gated behind a platform check, since only `apps/web-admin` will ever
 * import from `ui-web` in the first place (module-boundary enforced).
 */
export declare function useBreakpoint(): BreakpointToken;
/**
 * Resolves a per-breakpoint value map to whichever entry matches the
 * current breakpoint, falling back to the next-smallest defined entry
 * (a "mobile-first" resolution order) - the `useResponsiveValue` utility
 * Part 4 calls for.
 */
export declare function useResponsiveValue<T>(values: Partial<Record<BreakpointToken, T>>): T | undefined;
//# sourceMappingURL=useBreakpoint.d.ts.map