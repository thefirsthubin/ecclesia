import type { ActorContext } from '@ecclesia/rbac';

import { createFollowUpTask, resolveDefaultFollowUpTaskQuery, resolveDefaultSilentDriftQuery } from './usePastoralCareData';

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
