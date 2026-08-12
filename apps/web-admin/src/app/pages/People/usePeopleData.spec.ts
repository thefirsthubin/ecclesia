import type { ActorContext } from '@ecclesia/rbac';

import {
  assignGroupMembership,
  createPerson,
  fetchPersonById,
  GROUP_SCOPED_ROLES,
  grantRoleAssignment,
  nextLifecycleStageOptions,
  resolveDefaultPeopleQuery,
  revokeRoleAssignment,
  searchGroupsForAssignment,
  transitionLifecycleStage,
} from './usePeopleData';

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

/**
 * `[Lifecycle Stage Transition milestone]` `nextLifecycleStageOptions`
 * filters `@ecclesia/domain-people`'s own state machine - these tests
 * exist to prove the *filtering* (terminal stage, the excluded
 * GROUP_MEMBERSHIP transition) rather than re-testing the state machine
 * itself, which `lifecycle-stage.spec.ts` already covers.
 */
describe('nextLifecycleStageOptions', () => {
  it('offers only the modeled next stage(s) for a mid-journey stage', () => {
    expect(nextLifecycleStageOptions('LAPSED')).toEqual(['FOLLOW_UP']);
    expect(nextLifecycleStageOptions('SIX_WEEKS_PARTICIPATION').sort()).toEqual(['ASSIGNED_TO_BACENTA', 'MEMBER']);
  });

  it('excludes FOLLOW_UP -> ASSIGNED_TO_BACENTA - that transition requires the Group Membership endpoint instead', () => {
    expect(nextLifecycleStageOptions('FOLLOW_UP')).toEqual(['LAPSED']);
  });

  it('offers nothing for the terminal MEMBER stage', () => {
    expect(nextLifecycleStageOptions('MEMBER')).toEqual([]);
  });
});

describe('transitionLifecycleStage', () => {
  it('POSTs to /people/:id/lifecycle-transitions with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p1', lifecycleStage: 'FOLLOW_UP' }) });
    global.fetch = fetchMock;

    await transitionLifecycleStage('token', 'p1', { toStage: 'FOLLOW_UP', reason: 'Reached by phone' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/p1/lifecycle-transitions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ toStage: 'FOLLOW_UP', reason: 'Reached by phone' });
  });

  it('rejects with an ApiError carrying the server-provided conflict reason on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "PRD §12.5 / BR-PPL-03: 'MEMBER' -> 'FOLLOW_UP' is not a modeled transition (allowed: none - terminal stage)" }),
    });

    const error = (await transitionLifecycleStage('token', 'p1', { toStage: 'FOLLOW_UP' }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({ message: expect.stringContaining('not a modeled transition') });
  });
});

/**
 * `[Group Membership Assignment milestone]` `searchGroupsForAssignment`
 * fetches once (`GET /groups` has no `search` param, unlike `GET
 * /people`) and filters/maps client-side - these tests prove that
 * filtering and mapping, not `GET /groups`' own RBAC/scope behavior
 * (covered by `group.controller.spec.ts`/`group-resource-context.guard.spec.ts`).
 */
describe('searchGroupsForAssignment', () => {
  function group(overrides: Record<string, unknown> = {}) {
    return {
      id: 'group-1',
      branchId: 'branch-1',
      type: 'PASTORAL_CARE',
      name: 'Grace Bacenta',
      meetingSchedule: null,
      meetingLocation: null,
      category: null,
      lifecycleStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it('GETs /groups (no search param) and maps every result when the query is empty', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [group(), group({ id: 'group-2', name: 'Faith Basonta', type: 'MINISTRY' })],
    });
    global.fetch = fetchMock;

    const result = await searchGroupsForAssignment('token', '');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/groups');
    expect(url).not.toContain('search=');
    expect(result).toEqual([
      { id: 'group-1', label: 'Grace Bacenta', description: 'Bacenta · ACTIVE' },
      { id: 'group-2', label: 'Faith Basonta', description: 'Basonta · ACTIVE' },
    ]);
  });

  it('filters the fetched list by name, case-insensitively', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [group({ name: 'Grace Bacenta' }), group({ id: 'group-2', name: 'Faith Basonta', type: 'MINISTRY' })],
    });

    const result = await searchGroupsForAssignment('token', 'grace');

    expect(result).toEqual([{ id: 'group-1', label: 'Grace Bacenta', description: 'Bacenta · ACTIVE' }]);
  });

  it('propagates a 403 (e.g. a CLUSTER/OWN_GROUP-scoped actor GET /groups structurally cannot satisfy) rather than swallowing it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'people.group.read' to role 'ASSISTANT_PASTOR'" }),
    });

    const error = (await searchGroupsForAssignment('token', '').catch((e) => e)) as { status: number };
    expect(error.status).toBe(403);
  });
});

describe('assignGroupMembership', () => {
  it('POSTs to /people/:id/group-memberships with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'membership-1', personId: 'p1', groupId: 'group-1', groupType: 'PASTORAL_CARE', startedAt: new Date().toISOString(), endedAt: null, reason: null }),
    });
    global.fetch = fetchMock;

    await assignGroupMembership('token', 'p1', { groupId: 'group-1', reason: 'Moved house' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/p1/group-memberships');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ groupId: 'group-1', reason: 'Moved house' });
  });

  it('rejects with an ApiError carrying the server-provided reason-required message on a 400', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'A reason is required when this assignment closes an existing active Bacenta membership (PRD §16.1 reassignment surface)',
      }),
    });

    const error = (await assignGroupMembership('token', 'p1', { groupId: 'group-2' }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(400);
    expect(error.body).toMatchObject({ message: expect.stringContaining('A reason is required') });
  });

  it('rejects with an ApiError carrying the server-provided duplicate/invalid-reassignment reason on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "Person already holds an active PASTORAL_CARE membership in group 'group-1' - not a valid reassignment or duplicate join" }),
    });

    const error = (await assignGroupMembership('token', 'p1', { groupId: 'group-1' }).catch((e) => e)) as { status: number };

    expect(error.status).toBe(409);
  });
});

describe('GROUP_SCOPED_ROLES', () => {
  it('names exactly the two Group-scoped roles - Bacenta Leader and Basonta Leader', () => {
    expect(GROUP_SCOPED_ROLES).toEqual(['BACENTA_LEADER', 'BASONTA_LEADER']);
  });

  it('does not include roles that take no groupId (e.g. WORKER, RESIDENT_PASTOR)', () => {
    expect(GROUP_SCOPED_ROLES).not.toContain('WORKER');
    expect(GROUP_SCOPED_ROLES).not.toContain('RESIDENT_PASTOR');
  });
});

describe('grantRoleAssignment', () => {
  it('POSTs to /people/:id/role-assignments with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'ra-1', personId: 'p1', role: 'WORKER', branchId: 'branch-1', groupId: null, scopeGroupIds: [], effectiveFrom: new Date().toISOString(), effectiveTo: null }),
    });
    global.fetch = fetchMock;

    await grantRoleAssignment('token', 'p1', { role: 'WORKER', scopeGroupIds: [] });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/p1/role-assignments');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ role: 'WORKER', scopeGroupIds: [] });
  });

  it('sends groupId when granting a Group-scoped role', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    await grantRoleAssignment('token', 'p1', { role: 'BACENTA_LEADER', groupId: 'bacenta-1', scopeGroupIds: [] });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ role: 'BACENTA_LEADER', groupId: 'bacenta-1', scopeGroupIds: [] });
  });

  it('rejects with an ApiError carrying the real RBAC denial reason on a 403 (e.g. ADMIN has no grant authority)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'people.role_assignment.grant' to role 'ADMIN'" }),
    });

    const error = (await grantRoleAssignment('token', 'p1', { role: 'WORKER', scopeGroupIds: [] }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('ADMIN') });
  });

  it('rejects with an ApiError carrying the BR-PPL-04 eligibility conflict reason on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "BR-PPL-04/FR-PPL-06: 'WORKER' requires the Person's lifecycle_stage to be MEMBER (currently 'FOLLOW_UP')" }),
    });

    const error = (await grantRoleAssignment('token', 'p1', { role: 'WORKER', scopeGroupIds: [] }).catch((e) => e)) as { status: number };

    expect(error.status).toBe(409);
  });
});

/** `[Role Assignment Revoke milestone]` */
describe('revokeRoleAssignment', () => {
  it('POSTs to /people/:personId/role-assignments/:assignmentId/revoke with no body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'ra-1', personId: 'p1', role: 'WORKER', branchId: 'branch-1', groupId: null, scopeGroupIds: [], effectiveFrom: new Date().toISOString(), effectiveTo: new Date().toISOString() }),
    });
    global.fetch = fetchMock;

    await revokeRoleAssignment('token', 'p1', 'ra-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/people/p1/role-assignments/ra-1/revoke');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({});
  });

  it('rejects with an ApiError carrying the real RBAC denial reason on a 403', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'people.role_assignment.update' to role 'ADMIN'" }),
    });

    const error = (await revokeRoleAssignment('token', 'p1', 'ra-1').catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('people.role_assignment.update') });
  });

  it('rejects with an ApiError carrying the already-inactive conflict reason on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "Role Assignment 'ra-1' is not currently active" }),
    });

    const error = (await revokeRoleAssignment('token', 'p1', 'ra-1').catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({ message: expect.stringContaining('not currently active') });
  });

  it('rejects with an ApiError carrying a 404 when the assignment does not belong to the Person', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "No Role Assignment found with id 'ra-1' for Person 'p1'" }),
    });

    const error = (await revokeRoleAssignment('token', 'p1', 'ra-1').catch((e) => e)) as { status: number };

    expect(error.status).toBe(404);
  });
});
