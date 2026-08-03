import type { ActorContext } from '@ecclesia/rbac';

import { resolveDefaultGatheringsQuery } from './useGatheringsData';

/**
 * Same shape/reasoning as `People/usePeopleData.spec.ts`'s
 * `resolveDefaultPeopleQuery` coverage - see
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` §3.
 */
function actor(overrides: Partial<ActorContext>): Pick<ActorContext, 'role' | 'bacentaId'> {
  return {
    role: 'ADMIN',
    bacentaId: undefined,
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

  it('does not throw for a role with no gatherings.gathering.read row of its own (e.g. ASSISTANT_PASTOR)', () => {
    expect(resolveDefaultGatheringsQuery(actor({ role: 'ASSISTANT_PASTOR' }))).toEqual({});
  });
});
