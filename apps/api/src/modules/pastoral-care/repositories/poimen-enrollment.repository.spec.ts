import { PoimenEnrollmentRepository } from './poimen-enrollment.repository';

describe('PoimenEnrollmentRepository', () => {
  function buildRepository() {
    const prisma = {
      poimenEnrollment: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    const repository = new PoimenEnrollmentRepository(prisma as never);
    return { repository, prisma };
  }

  it('findByPersonId() delegates directly to prisma.poimenEnrollment.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.poimenEnrollment.findUnique.mockResolvedValue({ id: 'pe-1' });

    const result = await repository.findByPersonId('person-1');

    expect(prisma.poimenEnrollment.findUnique).toHaveBeenCalledWith({ where: { personId: 'person-1' } });
    expect(result).toEqual({ id: 'pe-1' });
  });

  it('create() starts a new enrollment at NOT_STARTED', async () => {
    const { repository, prisma } = buildRepository();
    prisma.poimenEnrollment.create.mockResolvedValue({ id: 'pe-1', status: 'NOT_STARTED' });

    const result = await repository.create('branch-1', 'person-1');

    expect(prisma.poimenEnrollment.create).toHaveBeenCalledWith({
      data: { branchId: 'branch-1', personId: 'person-1', status: 'NOT_STARTED' },
    });
    expect(result).toEqual({ id: 'pe-1', status: 'NOT_STARTED' });
  });

  it('update() delegates directly to prisma.poimenEnrollment.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.poimenEnrollment.update.mockResolvedValue({ id: 'pe-1', status: 'IN_PROGRESS' });
    const input = { status: 'IN_PROGRESS' as const };

    const result = await repository.update('person-1', input);

    expect(prisma.poimenEnrollment.update).toHaveBeenCalledWith({ where: { personId: 'person-1' }, data: input });
    expect(result).toEqual({ id: 'pe-1', status: 'IN_PROGRESS' });
  });
});
