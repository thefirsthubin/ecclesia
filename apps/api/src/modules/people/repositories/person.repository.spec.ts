import { PersonRepository } from './person.repository';

describe('PersonRepository', () => {
  function buildRepository() {
    const prisma = {
      person: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      groupMembership: { findMany: jest.fn() },
    };
    const repository = new PersonRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() delegates directly to prisma.person.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.person.create.mockResolvedValue({ id: 'person-1' });
    const input = { branchId: 'branch-1', firstName: 'Ama', lastName: 'Owusu' };

    const result = await repository.create(input);

    expect(prisma.person.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'person-1' });
  });

  it('findDuplicateCandidateSet maps the active Bacenta membership into activeBacentaGroupId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.person.findMany.mockResolvedValue([
      { id: 'p1', firstName: 'Ama', lastName: 'Owusu', phone: '123', dateOfBirth: null, groupMemberships: [{ groupId: 'bacenta-1' }] },
      { id: 'p2', firstName: 'Ama', lastName: 'Owusu', phone: null, dateOfBirth: null, groupMemberships: [] },
    ]);

    const result = await repository.findDuplicateCandidateSet('branch-1', 'Owusu');

    expect(prisma.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { branchId: 'branch-1', lastName: { equals: 'Owusu', mode: 'insensitive' } } }),
    );
    expect(result).toEqual([
      { id: 'p1', firstName: 'Ama', lastName: 'Owusu', phone: '123', dateOfBirth: null, activeBacentaGroupId: 'bacenta-1' },
      { id: 'p2', firstName: 'Ama', lastName: 'Owusu', phone: null, dateOfBirth: null, activeBacentaGroupId: null },
    ]);
  });

  it('findActiveGroupMemberships maps prisma rows to ActiveGroupMembershipRef', async () => {
    const { repository, prisma } = buildRepository();
    prisma.groupMembership.findMany.mockResolvedValue([
      { id: 'm1', groupId: 'g1', groupType: 'PASTORAL_CARE' },
    ]);

    const result = await repository.findActiveGroupMemberships('person-1');

    expect(prisma.groupMembership.findMany).toHaveBeenCalledWith({
      where: { personId: 'person-1', endedAt: null },
      select: { id: true, groupId: true, groupType: true },
    });
    expect(result).toEqual([{ id: 'm1', groupId: 'g1', groupType: 'PASTORAL_CARE' }]);
  });
});
