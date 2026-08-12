import { AuditLogReadRepository } from './audit-log-read.repository';

describe('AuditLogReadRepository', () => {
  function buildRepository() {
    const prisma = { auditLog: { findMany: jest.fn() } };
    const repository = new AuditLogReadRepository(prisma as never);
    return { repository, prisma };
  }

  it('findForBranch() includes the actor Branch and NULL-branch rows, ordered reverse-chronologically', async () => {
    const { repository, prisma } = buildRepository();
    prisma.auditLog.findMany.mockResolvedValue([]);

    await repository.findForBranch('branch-1');

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { OR: [{ branchId: 'branch-1' }, { branchId: null }] },
      orderBy: { occurredAt: 'desc' },
    });
  });

  it('findForBranch() applies an action-prefix filter when supplied (TREASURER Stewardship-only restriction)', async () => {
    const { repository, prisma } = buildRepository();
    prisma.auditLog.findMany.mockResolvedValue([]);

    await repository.findForBranch('branch-1', 'stewardship.');

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ branchId: 'branch-1' }, { branchId: null }],
        action: { startsWith: 'stewardship.' },
      },
      orderBy: { occurredAt: 'desc' },
    });
  });
});
