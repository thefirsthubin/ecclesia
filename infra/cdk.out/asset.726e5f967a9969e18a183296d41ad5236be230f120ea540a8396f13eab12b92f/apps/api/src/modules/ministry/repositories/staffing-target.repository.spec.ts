import { StaffingTargetRepository } from './staffing-target.repository';

describe('StaffingTargetRepository', () => {
  function buildRepository() {
    const prisma = {
      staffingTarget: { upsert: jest.fn(), findUnique: jest.fn() },
    };
    const repository = new StaffingTargetRepository(prisma as never);
    return { repository, prisma };
  }

  it('upsert() keys on the (gatheringId, groupId) compound unique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.staffingTarget.upsert.mockResolvedValue({ id: 'target-1' });
    const input = {
      branchId: 'branch-1',
      gatheringId: 'gathering-1',
      groupId: 'basonta-1',
      targetCount: 8,
      createdByPersonId: 'leader-1',
    };

    const result = await repository.upsert(input);

    expect(prisma.staffingTarget.upsert).toHaveBeenCalledWith({
      where: { gatheringId_groupId: { gatheringId: 'gathering-1', groupId: 'basonta-1' } },
      create: input,
      update: { targetCount: 8 },
    });
    expect(result).toEqual({ id: 'target-1' });
  });

  it('findById() delegates directly to prisma.staffingTarget.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.staffingTarget.findUnique.mockResolvedValue({ id: 'target-1' });

    const result = await repository.findById('target-1');

    expect(prisma.staffingTarget.findUnique).toHaveBeenCalledWith({ where: { id: 'target-1' } });
    expect(result).toEqual({ id: 'target-1' });
  });
});
