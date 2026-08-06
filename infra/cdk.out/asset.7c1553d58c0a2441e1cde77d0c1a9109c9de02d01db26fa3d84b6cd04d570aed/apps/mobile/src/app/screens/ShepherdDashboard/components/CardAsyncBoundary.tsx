import { View } from 'react-native';
import { Card, ErrorState, Skeleton, useTheme } from '@ecclesia/ui-native';

import type { AsyncDataState } from '../hooks/useAsyncData';

export interface CardAsyncBoundaryProps<T> {
  state: AsyncDataState<T>;
  onRetry: () => void;
  errorTitle: string;
  children: (data: T) => React.ReactNode;
  /** Number of skeleton lines to show while loading — lets each card's
   * skeleton roughly match its real content's height (STEP 7), rather
   * than one generic-sized placeholder everywhere. */
  skeletonLines?: number;
}

/**
 * Shared per-card loading/error/success split (STEP 7) — every card in
 * this screen wraps its content in this instead of re-implementing the
 * same three-way branch. Not a new `libs/ui/native` base component (that
 * would violate "do not recreate components") — this is screen-local
 * composition of `Card`/`Skeleton`/`ErrorState`, which already exist.
 * Empty states are handled by each card individually (via `EmptyState`),
 * since "empty" is a valid `success` result with zero items, not a
 * distinct `AsyncDataState` branch.
 */
export function CardAsyncBoundary<T>({ state, onRetry, errorTitle, children, skeletonLines = 3 }: CardAsyncBoundaryProps<T>) {
  const theme = useTheme();

  if (state.status === 'loading') {
    return (
      <Card padding={4}>
        <View style={{ gap: theme.spacing[2] }}>
          {Array.from({ length: skeletonLines }).map((_, index) => (
            <Skeleton key={index} height={16} width={index === skeletonLines - 1 ? '60%' : '100%'} />
          ))}
        </View>
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Card padding={4}>
        <ErrorState title={errorTitle} description={state.error.message} onRetry={onRetry} />
      </Card>
    );
  }

  return <Card padding={4}>{children(state.data)}</Card>;
}
