import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncDataState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }
  | { status: 'success'; data: T; error?: undefined };

/**
 * A type alias (not an `interface extends`) so the `&` distributes over
 * `AsyncDataState<T>`'s three-way union - each of the `loading`/`error`/
 * `success` variants gets its own `refetch`, and the discriminant
 * (`status`) stays narrowable by callers exactly as `AsyncDataState<T>`
 * alone would be. An `interface` cannot extend a union type at all
 * (`TS2312`), which is why this is a `type`.
 */
export type AsyncDataResult<T> = AsyncDataState<T> & { refetch: () => void };

/**
 * Per-card data-fetching hook (STEP 7: every card fetches, loads, and
 * fails independently — one card's error must never blank the rest of
 * the screen). Deliberately not built on a shared caching library — see
 * `api-client.ts`'s own doc comment on why one doesn't exist here yet.
 *
 * `refetch` also backs pull-to-refresh: `ShepherdDashboardScreen` calls
 * every card's `refetch` together on pull, but each card still renders
 * its own independent loading/error state while doing so.
 */
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
    // No `react-hooks/exhaustive-deps` rule is registered anywhere in
    // this workspace's `eslint.config.cjs` (confirmed - no
    // `eslint-plugin-react-hooks` reference exists), so there is nothing
    // to suppress here; a disable comment for an unregistered rule is
    // itself a lint error ("Definition for rule ... was not found"), the
    // same class of bug `ui-web`'s `Spinner`/`Skeleton` had for
    // `react/no-unknown-property` in the UI Foundation sprint. `deps` is
    // the caller-supplied dependency list (e.g. `[groupId]`); `fetcher`
    // itself is intentionally read via `fetcherRef`, not listed here, so
    // a new `fetcher` identity on every render (every hook in
    // `useShepherdDashboardData.ts` passes an inline arrow function) does
    // not re-trigger this effect - only `deps` changing, or `refetch()`
    // bumping `refetchToken`, should.
  }, [refetchToken, ...deps]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { ...state, refetch };
}
