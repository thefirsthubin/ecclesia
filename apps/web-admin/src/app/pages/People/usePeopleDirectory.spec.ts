import type { GroupResponseDto, PersonResponseDto, PotentialResponseDto } from '@ecclesia/contracts';

import { deriveDirectoryData } from './usePeopleDirectory';

function person(overrides: Partial<PersonResponseDto> = {}): PersonResponseDto {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'MEMBER',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function group(overrides: Partial<GroupResponseDto> = {}): GroupResponseDto {
  return {
    id: 'bacenta-1',
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

function potential(overrides: Partial<PotentialResponseDto> = {}): PotentialResponseDto {
  return {
    id: 'potential-1',
    branchId: 'branch-1',
    groupId: null,
    personId: null,
    firstName: 'Kofi',
    lastName: null,
    phone: null,
    source: 'OUTREACH',
    status: 'NEW',
    notes: null,
    assignedToPersonId: null,
    createdByPersonId: 'leader-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('[Milestone D] deriveDirectoryData', () => {
  it('zips each Bacenta group with its positional roster and reports its real member count', () => {
    const bacentas = [group({ id: 'bacenta-1', name: 'Grace' }), group({ id: 'bacenta-2', name: 'Faith' })];
    const rosters = [[person({ id: 'p1' }), person({ id: 'p2' })], [person({ id: 'p3' })]];

    const result = deriveDirectoryData([], bacentas, rosters, []);

    expect(result.bacentas).toEqual([
      { group: bacentas[0], members: rosters[0] },
      { group: bacentas[1], members: rosters[1] },
    ]);
  });

  it('buckets FIRST_TIME_GUEST and VISITOR people separately from every other lifecycle stage', () => {
    const allPeople = [
      person({ id: 'p1', lifecycleStage: 'FIRST_TIME_GUEST' }),
      person({ id: 'p2', lifecycleStage: 'VISITOR' }),
      person({ id: 'p3', lifecycleStage: 'MEMBER' }),
      person({ id: 'p4', lifecycleStage: 'FOLLOW_UP' }),
    ];

    const result = deriveDirectoryData(allPeople, [], [], []);

    expect(result.firstTimeGuests.map((p) => p.id)).toEqual(['p1']);
    expect(result.visitors.map((p) => p.id)).toEqual(['p2']);
  });

  it('derives peopleWithoutBacenta as the Branch roster minus the union of every Bacenta roster', () => {
    const allPeople = [person({ id: 'p1' }), person({ id: 'p2' }), person({ id: 'p3' })];
    const bacentas = [group({ id: 'bacenta-1' }), group({ id: 'bacenta-2' })];
    const rosters = [[person({ id: 'p1' })], [person({ id: 'p2' })]];

    const result = deriveDirectoryData(allPeople, bacentas, rosters, []);

    expect(result.peopleWithoutBacenta.map((p) => p.id)).toEqual(['p3']);
  });

  it('reports no one as without a Bacenta when every Branch member appears in some roster', () => {
    const allPeople = [person({ id: 'p1' }), person({ id: 'p2' })];
    const bacentas = [group({ id: 'bacenta-1' })];
    const rosters = [[person({ id: 'p1' }), person({ id: 'p2' })]];

    const result = deriveDirectoryData(allPeople, bacentas, rosters, []);

    expect(result.peopleWithoutBacenta).toEqual([]);
  });

  it('passes potentials through unmodified', () => {
    const potentials = [potential({ id: 'potential-1' }), potential({ id: 'potential-2' })];

    const result = deriveDirectoryData([], [], [], potentials);

    expect(result.potentials).toBe(potentials);
  });

  it('handles a Branch with no Bacentas at all without throwing', () => {
    const allPeople = [person({ id: 'p1' })];

    const result = deriveDirectoryData(allPeople, [], [], []);

    expect(result.bacentas).toEqual([]);
    expect(result.peopleWithoutBacenta.map((p) => p.id)).toEqual(['p1']);
  });
});
