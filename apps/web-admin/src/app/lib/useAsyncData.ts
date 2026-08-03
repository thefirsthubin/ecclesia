import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ported as-is from `apps/mobile/src/app/screens/ShepherdDashboard/hooks/useAsyncData.ts`
 * — same reasoning, same shape, same "no `react-hooks/exhaustive-deps`
 * disable comment" fix already applied there (that rule isn't registered
 * in this workspace's `eslint.config.cjs` either). Not moved to a shared
 * `libs/ui` package this sprint — see that file's own doc comment on why
 * a shared caching/fetch layer is deliberately not built yet.
 */
export type AsyncDataState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }
  | { status: 'success'; data: T; error?: undefined };

export type AsyncDataResult<T> = AsyncDataState<T> & { refetch: () => void };

export function useAsyncData<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): AsyncDataResult<T> {
  const [state, setState] = useState<AsyncDataState<T>>({ status: 'loading' });
  const [refetchToken, setRefetchToken] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
        }
      });

    return () => controller.abort();
    // No `react-hooks/exhaustive-deps` rule is registered in this
    // workspace's `eslint.config.cjs` (same finding as mobile's identical
    // hook), so there is nothing to suppress here - `fetcher` is
    // intentionally read via `fetcherRef`, not listed as a dependency.
  }, [refetchToken, ...deps]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { ...state, refetch };
}
