import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAsyncData } from './useAsyncData';

describe('useAsyncData', () => {
  it('starts in the loading state and transitions to success once the fetcher resolves', async () => {
    const fetcher = jest.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useAsyncData(fetcher, []));

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toBe('hello');
  });

  it('transitions to the error state when the fetcher rejects', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAsyncData(fetcher, []));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('boom');
  });

  it('re-runs the fetcher when refetch() is called', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const { result } = renderHook(() => useAsyncData(fetcher, []));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toBe('first');

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('re-runs the fetcher when a dependency changes', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce('for-1').mockResolvedValueOnce('for-2');
    const { result, rerender } = renderHook(({ id }: { id: string }) => useAsyncData(fetcher, [id]), {
      initialProps: { id: '1' },
    });

    await waitFor(() => expect(result.current.data).toBe('for-1'));

    rerender({ id: '2' });

    await waitFor(() => expect(result.current.data).toBe('for-2'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
