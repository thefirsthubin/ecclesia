import { useEffect, useState } from 'react';
import { useTheme } from '@ecclesia/ui-web';

export interface DashboardBreakpoint {
  /** Below `md` (1024px, Design System v1.0 Part 6.11) - matches `AppShell`'s own sidebar-collapse threshold. KPI/growth grids drop to 2 columns here. */
  isCompact: boolean;
  /** Below `sm` (640px) - grids drop to a single column here. */
  isNarrow: boolean;
}

/**
 * Local to `DashboardPage/` rather than promoted to `@ecclesia/ui-web` -
 * this redesign is scoped to one page, and `AppShell.tsx` already has its
 * own near-identical inline `matchMedia` effect for the same reason
 * (sidebar collapse). Extracting a shared hook both could use is a
 * reasonable future refactor, not done here to keep this sprint's blast
 * radius to `DashboardPage/` alone (brief: "maintain existing architecture
 * ... where possible").
 */
export function useDashboardBreakpoint(): DashboardBreakpoint {
  const theme = useTheme();
  const [state, setState] = useState<DashboardBreakpoint>({ isCompact: false, isNarrow: false });

  useEffect(() => {
    const mdQuery = window.matchMedia(`(max-width: ${theme.breakpoints.md - 1}px)`);
    const smQuery = window.matchMedia(`(max-width: ${theme.breakpoints.sm - 1}px)`);

    const update = () => setState({ isCompact: mdQuery.matches, isNarrow: smQuery.matches });
    update();

    mdQuery.addEventListener('change', update);
    smQuery.addEventListener('change', update);
    return () => {
      mdQuery.removeEventListener('change', update);
      smQuery.removeEventListener('change', update);
    };
  }, [theme.breakpoints.md, theme.breakpoints.sm]);

  return state;
}
