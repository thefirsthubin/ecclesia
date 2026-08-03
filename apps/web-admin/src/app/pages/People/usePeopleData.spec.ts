import type { ActorContext } from '@ecclesia/rbac';

import { resolveDefaultPeopleQuery } from './usePeopleData';

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
