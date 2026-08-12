import type { ActorContext } from '@ecclesia/rbac';

import { createGathering, nextGatheringStatusOptions, resolveDefaultGatheringsQuery, updateGathering } from './useGatheringsData';

/**
 * Same shape/reasoning as `People/usePeopleData.spec.ts`'s
 * `resolveDefaultPeopleQuery` coverage - see
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` §3.
 */
function actor(overrides: Partial<ActorContext>): Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'> {
  return {
    role: 'ADMIN',
    bacentaId: undefined,
    basontaId: undefined,
    clusterBacentaIds: undefined,
    ...overrides,
  };
}

describe('resolveDefaultGatheringsQuery', () => {
  it('scopes a Bacenta Leader to their own Bacenta (OWN_GROUP)', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'BACENTA_LEADER', bacentaId: 'bacenta-1' }))).toEqual({
      ownerGroupId: 'bacenta-1',
    });
  });

  it('leaves a Bacenta Leader with no bacentaId unscoped rather than throwing', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'BACENTA_LEADER' }))).toEqual({});
  });

  it.each(['RESIDENT_PASTOR', 'ADMIN'] as const)('scopes %s to the whole Branch (no ownerGroupId)', (role) => {
    expect(resolveDefaultGatheringsQuery(actor({ role }))).toEqual({});
  });

  /** `[Bug fix, Branch Pastor Gatherings Access]` mirrors
   * `resolveDefaultPeopleQuery`'s own ASSISTANT_PASTOR coverage. */
  it('scopes an Assistant Pastor to the first Bacenta in their cluster (CLUSTER)', () => {
    expect(
      resolveDefaultGatheringsQuery(actor({ role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] })),
    ).toEqual({ ownerGroupId: 'bacenta-1' });
  });

  it('leaves an Assistant Pastor with no clusterBacentaIds unscoped rather than throwing', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'ASSISTANT_PASTOR' }))).toEqual({});
  });

  /** `[Bug fix, Basonta Leader Gatherings Access]` mirrors the
   * BACENTA_LEADER/ASSISTANT_PASTOR coverage above. */
  it('scopes a Basonta Leader to their own Basonta (OWN_GROUP)', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'BASONTA_LEADER', basontaId: 'basonta-1' }))).toEqual({
      ownerGroupId: 'basonta-1',
    });
  });

  it('leaves a Basonta Leader with no basontaId unscoped rather than throwing', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'BASONTA_LEADER' }))).toEqual({});
  });

  it('does not throw for a role with no gatherings.gathering.read row of its own (e.g. TREASURER)', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'TREASURER' }))).toEqual({});
  });
});

/** `[Gathering Create/Update milestone]` */
describe('createGathering', () => {
  it('POSTs to /gatherings with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'g-1' }) });
    global.fetch = fetchMock;

    await createGathering('token', { type: 'SUNDAY_SERVICE', scheduledStart: '2026-01-04T09:00:00.000Z' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/gatherings');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ type: 'SUNDAY_SERVICE', scheduledStart: '2026-01-04T09:00:00.000Z' });
  });

  it('rejects with an ApiError carrying the server-provided authorization/denial reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'gatherings.gathering.create' to role 'RESIDENT_PASTOR'" }),
    });

    const error = (await createGathering('token', { type: 'SUNDAY_SERVICE', scheduledStart: '2026-01-04T09:00:00.000Z' }).catch(
      (e) => e,
    )) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('gatherings.gathering.create') });
  });
});

describe('updateGathering', () => {
  it('PATCHes to /gatherings/:id with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'g-1' }) });
    global.fetch = fetchMock;

    await updateGathering('token', 'g-1', { venue: 'Main Auditorium', scheduledEnd: null });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/gatherings/g-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ venue: 'Main Auditorium', scheduledEnd: null });
  });

  it('rejects with an ApiError carrying the server-provided conflict reason on an invalid status transition', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Cannot transition Gathering from COMPLETED to SCHEDULED' }),
    });

    const error = (await updateGathering('token', 'g-1', { status: 'SCHEDULED' }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({ message: expect.stringContaining('Cannot transition') });
  });
});

/**
 * `[Gathering Create/Update milestone]` `nextGatheringStatusOptions`
 * filters `@ecclesia/domain-gatherings`'s own real state machine - these
 * tests exist to prove the *filtering* (current status excluded, terminal
 * statuses offer nothing), not to re-test the state machine itself, which
 * `gathering-status.spec.ts` already covers.
 */
describe('nextGatheringStatusOptions', () => {
  it('offers both terminal statuses for SCHEDULED', () => {
    expect(nextGatheringStatusOptions('SCHEDULED').sort()).toEqual(['CANCELLED', 'COMPLETED']);
  });

  it('offers nothing for the terminal CANCELLED status', () => {
    expect(nextGatheringStatusOptions('CANCELLED')).toEqual([]);
  });

  it('offers nothing for the terminal COMPLETED status', () => {
    expect(nextGatheringStatusOptions('COMPLETED')).toEqual([]);
  });
});
