import { renderHook, waitFor } from '@testing-library/react';
import type { ActorContext } from '@ecclesia/rbac';

import {
  createCounsellingSession,
  createFollowUpTask,
  createMemberInteraction,
  createPastoralNote,
  createPrayerNote,
  resolveDefaultFollowUpTaskQuery,
  resolveDefaultSilentDriftQuery,
  useCounsellingSessions,
  useMemberInteractions,
  usePastoralCalendar,
  usePastoralNotes,
  usePrayerNotes,
  updateCounsellingSessionStatus,
  updatePrayerNoteStatus,
} from './usePastoralCareData';

/**
 * Same shape/reasoning as `People/usePeopleData.spec.ts`'s
 * `resolveDefaultPeopleQuery` coverage - see
 * `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §3.
 */
function actor(overrides: Partial<ActorContext>): Pick<ActorContext, 'role' | 'bacentaId' | 'clusterBacentaIds'> {
  return {
    role: 'ADMIN',
    bacentaId: undefined,
    clusterBacentaIds: undefined,
    ...overrides,
  };
}

describe('resolveDefaultFollowUpTaskQuery', () => {
  it('scopes a Bacenta Leader to their own Bacenta (OWN_GROUP)', () => {
    expect(resolveDefaultFollowUpTaskQuery(actor({ role: 'BACENTA_LEADER', bacentaId: 'bacenta-1' }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('scopes an Assistant Pastor to the first Bacenta in their cluster ([Design Decision])', () => {
    expect(
      resolveDefaultFollowUpTaskQuery(actor({ role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] })),
    ).toEqual({ groupId: 'bacenta-1' });
  });

  it('leaves an Assistant Pastor with no clusterBacentaIds unscoped rather than throwing', () => {
    expect(resolveDefaultFollowUpTaskQuery(actor({ role: 'ASSISTANT_PASTOR' }))).toEqual({});
  });

  it('leaves a Bacenta Leader with no bacentaId unscoped rather than throwing', () => {
    expect(resolveDefaultFollowUpTaskQuery(actor({ role: 'BACENTA_LEADER' }))).toEqual({});
  });

  it.each(['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'ADMIN'] as const)('scopes %s to the whole Branch (no groupId)', (role) => {
    expect(resolveDefaultFollowUpTaskQuery(actor({ role }))).toEqual({});
  });

  it('does not throw for a role with no Follow-up-task scoping story of its own (e.g. BASONTA_LEADER)', () => {
    expect(resolveDefaultFollowUpTaskQuery(actor({ role: 'BASONTA_LEADER' }))).toEqual({});
  });
});

/** `[Follow-up Task Creation milestone]` */
describe('createFollowUpTask', () => {
  it('POSTs to /people/:personId/follow-up-tasks with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'ft-1' }) });
    global.fetch = fetchMock;

    await createFollowUpTask('token', 'subject-1', { assignedToPersonId: 'assignee-1', trigger: 'MANUAL' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/subject-1/follow-up-tasks');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ assignedToPersonId: 'assignee-1', trigger: 'MANUAL' });
  });

  it('rejects with an ApiError carrying the server-provided authorization/denial reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'pastoral_care.followup_task.create' to role 'ADMIN'" }),
    });

    const error = (await createFollowUpTask('token', 'subject-1', { assignedToPersonId: 'assignee-1', trigger: 'MANUAL' }).catch(
      (e) => e,
    )) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('pastoral_care.followup_task.create') });
  });
});

/** `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]` */
describe('[Milestone D] usePastoralNotes', () => {
  afterEach(() => jest.clearAllMocks());

  it('GETs /people/:personId/pastoral-notes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'note-1', content: 'Checked in after service' }] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePastoralNotes('token', 'person-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/people/person-1/pastoral-notes');
    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data).toEqual([{ id: 'note-1', content: 'Checked in after service' }]);
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() => usePastoralNotes(undefined, 'person-1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('[Milestone D] createPastoralNote', () => {
  it('POSTs to /people/:personId/pastoral-notes with the given content', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'note-1' }) });
    global.fetch = fetchMock;

    await createPastoralNote('token', 'person-1', { content: 'Checked in after service' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/person-1/pastoral-notes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ content: 'Checked in after service' });
  });

  it('rejects with an ApiError carrying the server-provided authorization/denial reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'pastoral_care.notes.create' to role 'ADMIN'" }),
    });

    const error = (await createPastoralNote('token', 'person-1', { content: 'x' }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('pastoral_care.notes.create') });
  });
});

/** `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` */
describe('[Milestone D] usePrayerNotes', () => {
  afterEach(() => jest.clearAllMocks());

  it('GETs /people/:personId/prayer-notes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'pn-1', content: 'Praying for healing', authorPersonId: 'pastor-1' }] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePrayerNotes('token', 'person-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/people/person-1/prayer-notes');
    if (result.current.status !== 'success') throw new Error('expected success');
    expect(result.current.data).toEqual([{ id: 'pn-1', content: 'Praying for healing', authorPersonId: 'pastor-1' }]);
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() => usePrayerNotes(undefined, 'person-1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('[Milestone D] createPrayerNote', () => {
  it('POSTs to /people/:personId/prayer-notes with the given content', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'pn-1' }) });
    global.fetch = fetchMock;

    await createPrayerNote('token', 'person-1', { content: 'Praying for healing' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/person-1/prayer-notes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ content: 'Praying for healing' });
  });
});

describe('[Milestone D] updatePrayerNoteStatus', () => {
  it('PATCHes the flat /prayer-notes/:id/status route with the given status', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'pn-1', status: 'RESOLVED' }) });
    global.fetch = fetchMock;

    await updatePrayerNoteStatus('token', 'pn-1', { status: 'RESOLVED' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/prayer-notes/pn-1/status');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'RESOLVED' });
  });
});

describe('[Milestone D] useCounsellingSessions', () => {
  afterEach(() => jest.clearAllMocks());

  it('GETs /people/:personId/counselling-sessions', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'cs-1', status: 'SCHEDULED' }] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useCounsellingSessions('token', 'person-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/people/person-1/counselling-sessions');
  });
});

describe('[Milestone D] createCounsellingSession', () => {
  it('POSTs to /people/:personId/counselling-sessions with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'cs-1' }) });
    global.fetch = fetchMock;

    await createCounsellingSession('token', 'person-1', { scheduledAt: '2026-09-01T10:00:00.000Z', briefNote: 'Pre-marital counselling' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/person-1/counselling-sessions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ scheduledAt: '2026-09-01T10:00:00.000Z', briefNote: 'Pre-marital counselling' });
  });
});

describe('[Milestone D] updateCounsellingSessionStatus', () => {
  it('PATCHes the flat /counselling-sessions/:id/status route with the given status', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'cs-1', status: 'COMPLETED' }) });
    global.fetch = fetchMock;

    await updateCounsellingSessionStatus('token', 'cs-1', { status: 'COMPLETED' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/counselling-sessions/cs-1/status');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'COMPLETED' });
  });
});

describe('[Milestone D] useMemberInteractions', () => {
  afterEach(() => jest.clearAllMocks());

  it('GETs /people/:personId/interactions', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'mi-1', type: 'VISIT' }] });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useMemberInteractions('token', 'person-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/people/person-1/interactions');
  });
});

describe('[Milestone D] createMemberInteraction', () => {
  it('POSTs to /people/:personId/interactions with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'mi-1' }) });
    global.fetch = fetchMock;

    await createMemberInteraction('token', 'person-1', { type: 'VISIT', occurredAt: '2026-08-18T10:00:00.000Z', briefNote: 'Home visit' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/person-1/interactions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ type: 'VISIT', occurredAt: '2026-08-18T10:00:00.000Z', briefNote: 'Home visit' });
  });
});

/**
 * `[Silent-Drift Detection Branch-wide milestone]` Same shape/reasoning
 * as `resolveDefaultFollowUpTaskQuery`'s own coverage above -
 * `pastoral_care.silent_drift_flag.read`'s scope rows name the identical
 * roles/scopes (traced against `permission-matrix.ts`).
 */
describe('resolveDefaultSilentDriftQuery', () => {
  it('scopes a Bacenta Leader to their own Bacenta (OWN_GROUP)', () => {
    expect(resolveDefaultSilentDriftQuery(actor({ role: 'BACENTA_LEADER', bacentaId: 'bacenta-1' }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('scopes an Assistant Pastor to the first Bacenta in their cluster', () => {
    expect(
      resolveDefaultSilentDriftQuery(actor({ role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] })),
    ).toEqual({ groupId: 'bacenta-1' });
  });

  it('leaves an Assistant Pastor with no clusterBacentaIds unscoped rather than throwing', () => {
    expect(resolveDefaultSilentDriftQuery(actor({ role: 'ASSISTANT_PASTOR' }))).toEqual({});
  });

  it('leaves a Bacenta Leader with no bacentaId unscoped rather than throwing', () => {
    expect(resolveDefaultSilentDriftQuery(actor({ role: 'BACENTA_LEADER' }))).toEqual({});
  });

  it.each(['RESIDENT_PASTOR', 'ADMIN'] as const)('scopes %s to the whole Branch (no groupId)', (role) => {
    expect(resolveDefaultSilentDriftQuery(actor({ role }))).toEqual({});
  });

  it('does not throw for a role with no Silent-Drift scoping story of its own (e.g. BASONTA_LEADER)', () => {
    expect(resolveDefaultSilentDriftQuery(actor({ role: 'BASONTA_LEADER' }))).toEqual({});
  });
});

/** `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` */
describe('[Milestone D] usePastoralCalendar', () => {
  afterEach(() => jest.clearAllMocks());

  it('GETs /pastoral-care/calendar with the given from/to window', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z', followUpTasks: [], counsellingSessions: [], interactions: [] }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePastoralCalendar('token', '2026-08-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/pastoral-care/calendar');
    expect(url).toContain('from=2026-08-01T00%3A00%3A00.000Z');
    expect(url).toContain('to=2026-09-01T00%3A00%3A00.000Z');
  });

  it('rejects rather than fetching when there is no access token', async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() => usePastoralCalendar(undefined, '2026-08-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
