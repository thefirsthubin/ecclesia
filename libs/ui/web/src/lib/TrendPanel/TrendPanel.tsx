import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { SectionHeader } from '../SectionHeader';
import { Skeleton } from '../Skeleton';
import { ErrorState } from '../ErrorState';

export interface TrendPanelProps {
  title: string;
  description?: string;
  status: 'loading' | 'error' | 'success';
  onRetry?: () => void;
  errorTitle?: string;
  /** The success-state content - a `BarChart`, a ranked list, whatever the
   * real data actually supports. `TrendPanel` owns the loading/error
   * frame only, never the visualization choice. */
  children: ReactNode;
  skeletonHeight?: number;
  testId?: string;
}

/**
 * `[Branch Pastor portal, visual redesign]` One consistent loading/error/
 * content frame for every chart-or-ranked-list module across Dashboard
 * and Insights - four independently hand-rolled versions of this same
 * `status === 'loading' ? <Skeleton/> : status === 'error' ? <ErrorState/> : <chart/>`
 * branch existed before this pass. Does not own a `Card` - callers keep
 * placing their own `Card` around it, matching every other section
 * primitive in this system.
 */
export function TrendPanel({ title, description, status, onRetry, errorTitle, children, skeletonHeight = 160, testId }: TrendPanelProps) {
  const theme = useTheme();
  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <SectionHeader title={title} description={description} />
      {status === 'loading' && <Skeleton height={skeletonHeight} />}
      {status === 'error' && <ErrorState title={errorTitle ?? "Couldn't load this"} onRetry={onRetry} />}
      {status === 'success' && children}
    </div>
  );
}
