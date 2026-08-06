import { FollowUpSlaSweepRepository } from './follow-up-sla-sweep.repository';

describe('FollowUpSlaSweepRepository', () => {
  it('listOpenTasksWithDueDate() filters to OPEN tasks with a non-null dueAt in the Branch', async () => {
    const prisma = { followUpTask: { findMany: jest.fn().mockResolvedValue([]) } };
    const repository = new FollowUpSlaSweepRepository(prisma as never);

    await repository.listOpenTasksWithDueDate('branch-1');

    expect(prisma.followUpTask.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1', status: 'OPEN', dueAt: { not: null } },
    });
  });
});
