import { WorkerAvailabilityRepository } from './worker-availability.repository';

describe('WorkerAvailabilityRepository', () => {
  function buildRepository() {
    const prisma = {
      workerAvailability: { create: jest.fn(), findMany: jest.fn() },
    };
    const repository = new WorkerAvailabilityRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.workerAvailability.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.workerAvailability.create.mockResolvedValue({ id: 'availability-1' });
    const input = {
      branchId: 'branch-1',
      personId: 'person-1',
      unavailableFrom: new Date('2026-09-01'),
      unavailableTo: new Date('2026-09-14'),
      reason: 'travel',
    };

    const result = await repository.create(input);

    expect(prisma.workerAvailability.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'availability-1' });
  });

  it('listByPerson() orders by unavailableFrom descending', async () => {
    const { repository, prisma } = buildRepository();
    prisma.workerAvailability.findMany.mockResolvedValue([]);

    await repository.listByPerson('person-1');

    expect(prisma.workerAvailability.findMany).toHaveBeenCalledWith({
      where: { personId: 'person-1' },
      orderBy: { unavailableFrom: 'desc' },
    });
  });
});
