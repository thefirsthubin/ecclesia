import { useEffect, useState, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';

export interface PageContainerProps {
  children: ReactNode;
  /** Content max-width in px - the page's own considered content density
   * (a simple settings form vs. a dense multi-column workspace), not a
   * uniform site-wide number. Defaults to a sensible general-purpose
   * workspace width. Always centered, always capped - never full-bleed,
   * regardless of what a page passes. */
  maxWidth?: number;
  testId?: string;
}

/**
 * `[Whole Ecclesia layout rebalance]` The one shared page-content
 * container - every route-level page wraps its content in this instead of
 * an ad hoc `maxWidth` div with no centering, which is what left content
 * anchored to the left edge with the remaining viewport as dead space on
 * every screen in the app (confirmed by inspection - no page anywhere set
 * `margin: auto`, and `AppShell`'s own `<main>` carried no centering of
 * its own either). Two responsibilities, both intentionally owned here
 * rather than by `<main>` or by each page individually, so there is
 * exactly one place this logic lives:
 *
 * 1. **Centering** - `margin: 0 auto` against the page's own `maxWidth`.
 * 2. **Responsive horizontal padding** - `<main>`'s own padding is a flat,
 *    non-responsive value; this component's own internal `md`/`sm`
 *    breakpoint detection (same self-contained `matchMedia` pattern
 *    `TopNav` already established) narrows the gutter on small screens
 *    rather than wasting proportionally more of a phone's width on
 *    padding, and widens it on desktop for genuine breathing room.
 *
 * Deliberately does not force one uniform width on every page - a simple
 * settings form (`ConfigurationPage`) and a dense multi-column dashboard
 * genuinely warrant different `maxWidth` values, and collapsing that
 * distinction would trade one problem (dead space) for another (a
 * cramped dashboard or an absurdly wide form). What every page gets
 * uniformly is centering, the padding scale, and a hard sense restraint
 * on how wide "wide" is allowed to be - no page in this app passes a
 * `maxWidth` above 1440, so content never reads as "ridiculously wide"
 * even on an ultra-wide monitor.
 */
export function PageContainer({ children, maxWidth = 1120, testId }: PageContainerProps) {
  const theme = useTheme();
  const [isCompact, setIsCompact] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${theme.breakpoints.md - 1}px)`);
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme.breakpoints.md]);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${theme.breakpoints.sm - 1}px)`);
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme.breakpoints.sm]);

  const horizontalPadding = isNarrow ? theme.spacing[4] : isCompact ? theme.spacing[5] : theme.spacing[8];

  return (
    <div
      data-testid={testId}
      style={{
        width: '100%',
        maxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
        boxSizing: 'border-box',
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[8],
      }}
    >
      {children}
    </div>
  );
}
