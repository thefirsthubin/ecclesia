import type { ActorContext } from '@ecclesia/rbac';

import { createPerson, fetchPersonById, resolveDefaultPeopleQuery } from './usePeopleData';

/**
 * `resolveDefaultPeopleQuery` is the one piece of real business logic in
 * this hooks file - it maps a role to the `GET /people` scope query per
 * PRD §16.1 (`PEOPLE_PAGE_DESIGN_NOTES.md` §3). The rest of
 * `usePeopleData.ts` is thin `useAsyncData`/`apiGet` wiring already
 * covered indirectly by `PeopleListPage.spec.tsx`/`PersonDetailPage.spec.tsx`.
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

describe('resolveDefaultPeopleQuery', () => {
  it('scopes a Bacenta Leader to their own Bacenta (OWN_GROUP)', () => {
    expect(resolveDefaultPeopleQuery(actor({ role: 'BACENTA_LEADER', bacentaId: 'bacenta-1' }))).toEqual({ groupId: 'bacenta-1' });
  });

  it('scopes a Basonta Leader to their own Basonta (OWN_GROUP)', () => {
    expect(resolveDefaultPeopleQuery(actor({ role: 'BASONTA_LEADER', basontaId: 'basonta-1' }))).toEqual({ groupId: 'basonta-1' });
  });

  it('scopes an Assistant Pastor to the first Bacenta in their cluster ([Design Decision])', () => {
    expect(
      resolveDefaultPeopleQuery(actor({ role: 'ASSISTANT_PASTOR', clusterBacentaIds: ['bacenta-1', 'bacenta-2', 'bacenta-3'] })),
    ).toEqual({ groupId: 'bacenta-1' });
  });

  it('leaves an Assistant Pastor with no clusterBacentaIds unscoped rather than throwing', () => {
    expect(resolveDefaultPeopleQuery(actor({ role: 'ASSISTANT_PASTOR' }))).toEqual({});
  });

  it('leaves a Bacenta Leader with no bacentaId unscoped rather than throwing', () => {
    expect(resolveDefaultPeopleQuery(actor({ role: 'BACENTA_LEADER' }))).toEqual({});
  });

  it.each(['RESIDENT_PASTOR', 'ACTING_RESIDENT_PASTOR', 'ADMIN', 'TREASURER'] as const)(
    'scopes %s to the whole Branch (no groupId)',
    (role) => {
      expect(resolveDefaultPeopleQuery(actor({ role }))).toEqual({});
    },
  );

  it('does not throw for a role with no directory-scoping story of its own (e.g. WORKER)', () => {
    expect(resolveDefaultPeopleQuery(actor({ role: 'WORKER' }))).toEqual({});
  });
});

afterEach(() => jest.clearAllMocks());

describe('createPerson', () => {
  it('POSTs to /people with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p1', firstName: 'Ama' }) });
    global.fetch = fetchMock;

    await createPerson('token', { firstName: 'Ama', lastName: 'Owusu', overrideDuplicateCheck: false });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ firstName: 'Ama', lastName: 'Owusu', overrideDuplicateCheck: false });
  });

  it('rejects with an ApiError carrying the FR-PPL-02 candidates body on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        message: 'FR-PPL-02: likely duplicate Person record(s) found.',
        candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE', reason: 'same name and phone' }],
      }),
    });

    const error = (await createPerson('token', { firstName: 'Ama', lastName: 'Owusu', overrideDuplicateCheck: false }).catch(
      (e) => e,
    )) as { status: number; body: unknown };

    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({ candidates: [{ candidateId: 'c1' }] });
  });
});

describe('fetchPersonById', () => {
  it('GETs /people/:id', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p1', firstName: 'Ama' }) });
    global.fetch = fetchMock;

    const result = await fetchPersonById('token', 'p1');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/people/p1');
    expect(result).toEqual({ id: 'p1', firstName: 'Ama' });
  });
});
