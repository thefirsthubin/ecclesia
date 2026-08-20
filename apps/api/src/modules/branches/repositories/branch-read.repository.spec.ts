import { BranchReadRepository } from './branch-read.repository';

describe('BranchReadRepository', () => {
  function buildRepository() {
    const prisma = { branch: { findUniqueOrThrow: jest.fn() } };
    const repository = new BranchReadRepository(prisma as never);
    return { repository, prisma };
  }

  it('findById() looks up exactly one Branch by id, selecting only id/name', async () => {
    const { repository, prisma } = buildRepository();
    prisma.branch.findUniqueOrThrow.mockResolvedValue({ id: 'branch-1', name: 'Headquarters' });

    const result = await repository.findById('branch-1');

    expect(prisma.branch.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'branch-1' },
      select: { id: true, name: true },
    });
    expect(result).toEqual({ id: 'branch-1', name: 'Headquarters' });
  });
});
