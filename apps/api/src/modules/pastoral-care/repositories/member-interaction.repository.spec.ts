import { MemberInteractionRepository } from './member-interaction.repository';

describe('[Milestone B] MemberInteractionRepository', () => {
  function buildRepository() {
    const prisma = {
      memberInteraction: { create: jest.fn(), findMany: jest.fn() },
    };
    const repository = new MemberInteractionRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.memberInteraction.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.memberInteraction.create.mockResolvedValue({ id: 'interaction-1' });
    const occurredAt = new Date('2026-08-18T00:00:00.000Z');

    const result = await repository.create({
      branchId: 'branch-1',
      personId: 'person-1',
      pastorPersonId: 'pastor-1',
      type: 'CALL',
      occurredAt,
    });

    expect(prisma.memberInteraction.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        personId: 'person-1',
        pastorPersonId: 'pastor-1',
        type: 'CALL',
        occurredAt,
        scheduledAt: undefined,
        briefNote: undefined,
      },
    });
    expect(result).toEqual({ id: 'interaction-1' });
  });

  it('listByPerson() filters by personId only - organizational scope', async () => {
    const { repository, prisma } = buildRepository();
    prisma.memberInteraction.findMany.mockResolvedValue([{ id: 'interaction-1' }]);

    const result = await repository.listByPerson('person-1');

    expect(prisma.memberInteraction.findMany).toHaveBeenCalledWith({
      where: { personId: 'person-1' },
      orderBy: { occurredAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'interaction-1' }]);
  });

  it('listScheduledInRange() filters by branchId and a scheduledAt window', async () => {
    const { repository, prisma } = buildRepository();
    prisma.memberInteraction.findMany.mockResolvedValue([]);
    const from = new Date('2026-08-01T00:00:00.000Z');
    const to = new Date('2026-08-31T00:00:00.000Z');

    await repository.listScheduledInRange('branch-1', from, to);

    expect(prisma.memberInteraction.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', scheduledAt: { gte: from, lte: to } },
      orderBy: { scheduledAt: 'asc' },
    });
  });
});
