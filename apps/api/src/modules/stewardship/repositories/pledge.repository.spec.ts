import { PledgeRepository } from './pledge.repository';

describe('PledgeRepository', () => {
  function buildRepository() {
    const prisma = {
      pledge: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const repository = new PledgeRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.pledge.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pledge.create.mockResolvedValue({ id: 'pledge-1' });
    const input = {
      branchId: 'branch-1',
      projectId: 'proj-1',
      personId: 'member-1',
      pledgedAmountMinor: 50000n,
      currency: 'GHS',
      reminderOptIn: true,
    };

    const result = await repository.create(input);

    expect(prisma.pledge.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'pledge-1' });
  });

  it('findById() delegates directly to prisma.pledge.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pledge.findUnique.mockResolvedValue({ id: 'pledge-1' });

    const result = await repository.findById('pledge-1');

    expect(prisma.pledge.findUnique).toHaveBeenCalledWith({ where: { id: 'pledge-1' } });
    expect(result).toEqual({ id: 'pledge-1' });
  });

  it('fulfill() updates fulfilledTransactionId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pledge.update.mockResolvedValue({ id: 'pledge-1', fulfilledTransactionId: 'ft-1' });

    const result = await repository.fulfill('pledge-1', 'ft-1');

    expect(prisma.pledge.update).toHaveBeenCalledWith({ where: { id: 'pledge-1' }, data: { fulfilledTransactionId: 'ft-1' } });
    expect(result).toEqual({ id: 'pledge-1', fulfilledTransactionId: 'ft-1' });
  });
});
