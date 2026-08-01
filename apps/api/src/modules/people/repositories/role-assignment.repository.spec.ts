import { RoleAssignmentRepository } from './role-assignment.repository';

describe('RoleAssignmentRepository', () => {
  function buildRepository() {
    const prisma = {
      roleAssignment: { create: jest.fn() },
      user: { findUnique: jest.fn() },
      poimenEnrollment: { findUnique: jest.fn() },
    };
    const repository = new RoleAssignmentRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.roleAssignment.create, omitting effectiveFrom when unset', async () => {
    const { repository, prisma } = buildRepository();
    prisma.roleAssignment.create.mockResolvedValue({ id: 'ra-1' });

    await repository.create({ personId: 'p1', role: 'WORKER', branchId: 'branch-1', scopeGroupIds: [] });

    expect(prisma.roleAssignment.create).toHaveBeenCalledWith({
      data: {
        personId: 'p1',
        role: 'WORKER',
        branchId: 'branch-1',
        groupId: undefined,
        scopeGroupIds: [],
        grantedByUserId: undefined,
      },
    });
  });

  it('findUserIdByPersonId returns undefined when no User row is linked', async () => {
    const { repository, prisma } = buildRepository();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(repository.findUserIdByPersonId('p1')).resolves.toBeUndefined();
  });

  it('findPoimenStatus returns the status when an enrollment exists', async () => {
    const { repository, prisma } = buildRepository();
    prisma.poimenEnrollment.findUnique.mockResolvedValue({ status: 'COMPLETE' });

    await expect(repository.findPoimenStatus('p1')).resolves.toBe('COMPLETE');
  });
});
