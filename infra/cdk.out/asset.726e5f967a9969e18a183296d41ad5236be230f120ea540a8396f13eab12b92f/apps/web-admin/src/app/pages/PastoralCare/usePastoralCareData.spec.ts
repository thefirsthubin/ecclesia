import type { ActorContext } from '@ecclesia/rbac';

import { resolveDefaultFollowUpTaskQuery } from './usePastoralCareData';

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
