import { renderHook, waitFor } from '@testing-library/react';
import type { ActorContext } from '@ecclesia/rbac';

import {
  createOutreach,
  createOutreachContact,
  promoteOutreachContact,
  resolveDefaultOutreachQuery,
  updateOutreachContactOutcome,
  useOutreachContacts,
  useOutreachList,
  useOutreachListForGroups,
} from './useOutreachData';

function actor(overrides: Partial<ActorContext>): Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'> {
  return { role: 'ADMIN', bacentaId: undefined, basontaId: undefined, clusterBacentaIds: undefined, ...overrides };
}

describe('[Milestone D] resolveDefaultOutreachQuery', () => {
  it('scopes a Bacenta Leader to their own Bacenta (OWN_GROUP)', () => {
    expect(resolveDefaultOutreachQuery(actor({ role: 'BACENTA_LEADER', bacentaId: 'bacenta-1' }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('scopes a Basonta Leader to their own Basonta (OWN_GROUP)', () => {
    expect(resolveDefaultOutreachQuery(actor({ role: 'BASONTA_LEADER', basontaId: 'basonta-1' }))).toEqual({ groupId: 'basonta-1' });
  });

  it('scopes an Assistant Pastor to the first Bacenta in their cluster', () => {
    expect(resolveDefaultOutreachQuery(actor({ role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('leaves a Bacenta Leader with no bacentaId unscoped rather than throwing', () => {
    expect(resolveDefaultOutreachQuery(actor({ role: 'BACENTA_LEADER' }))).toEqual({});
  });

  it('scopes RESIDENT_PASTOR (COUNCIL read-only) to no groupId - Branch-wide from this Branch', () => {
    expect(resolveDefaultOutreachQuery(actor({ role: 'RESIDENT_PASTOR' }))).toEqual({});
  });
});

afterEach(() => jest.clearAllMocks());

describe('[Milestone D] useOutreachList', () => {
  it('GETs /outreach with groupId/from/to as query params when given', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useOutreachList('token', { groupId: 'bacenta-1', from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' }));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
    expect(url).toContain('from=');
    expect(url).toContain('to=');
  });

  it('GETs /outreach with no query string when the query is empty', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useOutreachList('token', {}));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith('/outreach')).toBe(true);
  });
});

describe('[Milestone D] useOutreachListForGroups', () => {
  it('fetches once per group and dedupes by id', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('groupId=bacenta-1')) return Promise.resolve({ ok: true, json: async () => [{ id: 'o-1' }, { id: 'o-2' }] });
      if (url.includes('groupId=bacenta-2')) return Promise.resolve({ ok: true, json: async () => [{ id: 'o-2' }, { id: 'o-3' }] });
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useOutreachListForGroups('token', ['bacenta-1', 'bacenta-2']));
    await waitFor(() => expect(result.current.status).toBe('success'));

    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data.map((o) => o.id).sort()).toEqual(['o-1', 'o-2', 'o-3']);
  });

  it('returns an empty array without fetching when there are no groups', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const { result } = renderHook(() => useOutreachListForGroups('token', []));
    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('[Milestone D] useOutreachContacts', () => {
  it('GETs /outreach/:outreachId/contacts', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'contact-1' }] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useOutreachContacts('token', 'outreach-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/outreach/outreach-1/contacts');
  });

  it('rejects rather than fetching when there is no outreach selected', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const { result } = renderHook(() => useOutreachContacts('token', null));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('[Milestone D] createOutreach', () => {
  it('POSTs to /outreach with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'o-1' }) });
    global.fetch = fetchMock;

    await createOutreach('token', { groupId: 'bacenta-1', occurredAt: '2026-01-01T00:00:00.000Z', leaderPersonId: 'leader-1' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/outreach');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ groupId: 'bacenta-1', occurredAt: '2026-01-01T00:00:00.000Z', leaderPersonId: 'leader-1' });
  });
});

describe('[Milestone D] createOutreachContact', () => {
  it('POSTs to /outreach/:outreachId/contacts with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'contact-1' }) });
    global.fetch = fetchMock;

    await createOutreachContact('token', 'outreach-1', { firstName: 'Kofi' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/outreach/outreach-1/contacts');
    expect(init.method).toBe('POST');
  });
});

describe('[Milestone D] updateOutreachContactOutcome', () => {
  it('PATCHes /outreach/contacts/:id/outcome', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'contact-1' }) });
    global.fetch = fetchMock;

    await updateOutreachContactOutcome('token', 'contact-1', { outcome: 'ATTENDED' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/outreach/contacts/contact-1/outcome');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ outcome: 'ATTENDED' });
  });
});

describe('[Milestone D] promoteOutreachContact', () => {
  it('POSTs to /outreach/contacts/:id/promote', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'contact-1', personId: 'person-1' }) });
    global.fetch = fetchMock;

    await promoteOutreachContact('token', 'contact-1', { lastName: 'Mensah', overrideDuplicateCheck: false });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/outreach/contacts/contact-1/promote');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ lastName: 'Mensah', overrideDuplicateCheck: false });
  });
});
