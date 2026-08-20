import { renderHook, waitFor } from '@testing-library/react';
import type { ActorContext } from '@ecclesia/rbac';

import { createPotential, resolveDefaultPotentialsQuery, updatePotential, usePotentialsList, usePotentialsListForGroups } from './usePotentialsData';

function actor(overrides: Partial<ActorContext>): Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'> {
  return { role: 'ADMIN', bacentaId: undefined, basontaId: undefined, clusterBacentaIds: undefined, ...overrides };
}

describe('[Post-Milestone D] resolveDefaultPotentialsQuery', () => {
  it('scopes a Bacenta Leader to their own Bacenta (OWN_GROUP)', () => {
    expect(resolveDefaultPotentialsQuery(actor({ role: 'BACENTA_LEADER', bacentaId: 'bacenta-1' }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('scopes a Basonta Leader to their own Basonta (OWN_GROUP)', () => {
    expect(resolveDefaultPotentialsQuery(actor({ role: 'BASONTA_LEADER', basontaId: 'basonta-1' }))).toEqual({ groupId: 'basonta-1' });
  });

  it('scopes an Assistant Pastor to the first Bacenta in their cluster', () => {
    expect(resolveDefaultPotentialsQuery(actor({ role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('leaves a Bacenta Leader with no bacentaId unscoped rather than throwing', () => {
    expect(resolveDefaultPotentialsQuery(actor({ role: 'BACENTA_LEADER' }))).toEqual({});
  });

  it('leaves an Assistant Pastor with no clusterBacentaIds unscoped rather than throwing', () => {
    expect(resolveDefaultPotentialsQuery(actor({ role: 'ASSISTANT_PASTOR' }))).toEqual({});
  });

  it('does not throw for a role with no Potentials scoping story of its own (e.g. ADMIN)', () => {
    expect(resolveDefaultPotentialsQuery(actor({ role: 'ADMIN' }))).toEqual({});
  });
});

afterEach(() => jest.clearAllMocks());

describe('[Post-Milestone D] usePotentialsList', () => {
  it('GETs /potentials with groupId as a query param when given', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePotentialsList('token', { groupId: 'bacenta-1' }));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/potentials');
    expect(url).toContain('groupId=bacenta-1');
  });

  it('GETs /potentials with no query string when the query is empty', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePotentialsList('token', {}));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('?');
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => usePotentialsList(undefined, {}));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('[Post-Milestone D] usePotentialsListForGroups', () => {
  it('merges results across every group, deduplicated by id', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('groupId=bacenta-1')) return Promise.resolve({ ok: true, json: async () => [{ id: 'p-1' }, { id: 'p-2' }] });
      if (url.includes('groupId=bacenta-2')) return Promise.resolve({ ok: true, json: async () => [{ id: 'p-2' }, { id: 'p-3' }] });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePotentialsListForGroups('token', ['bacenta-1', 'bacenta-2']));
    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data.map((p) => p.id).sort()).toEqual(['p-1', 'p-2', 'p-3']);
  });

  it('returns an empty array without fetching when there are no groupIds', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePotentialsListForGroups('token', []));
    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('[Post-Milestone D] createPotential', () => {
  it('POSTs to /potentials with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p-1' }) });
    global.fetch = fetchMock;

    await createPotential('token', { firstName: 'Ama', source: 'WALK_IN' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/potentials');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ firstName: 'Ama', source: 'WALK_IN' });
  });
});

describe('[Post-Milestone D] updatePotential', () => {
  it('PATCHes /potentials/:id with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p-1', status: 'IN_PROGRESS' }) });
    global.fetch = fetchMock;

    await updatePotential('token', 'p-1', { status: 'IN_PROGRESS' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/potentials/p-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'IN_PROGRESS' });
  });
});
