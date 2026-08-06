import { ExpenseRepository } from './expense.repository';

describe('ExpenseRepository', () => {
  function buildRepository() {
    const prisma = {
      expense: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const repository = new ExpenseRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.expense.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.expense.create.mockResolvedValue({ id: 'exp-1' });
    const input = {
      branchId: 'branch-1',
      transactionId: 'ft-1',
      requestedByPersonId: 'person-1',
      description: 'Sound system repair',
    };

    const result = await repository.create(input);

    expect(prisma.expense.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'exp-1' });
  });

  it('findById() delegates directly to prisma.expense.findUnique keyed by id', async () => {
    const { repository, prisma } = buildRepository();
    prisma.expense.findUnique.mockResolvedValue({ id: 'exp-1' });

    const result = await repository.findById('exp-1');

    expect(prisma.expense.findUnique).toHaveBeenCalledWith({ where: { id: 'exp-1' } });
    expect(result).toEqual({ id: 'exp-1' });
  });

  it('findByTransactionId() delegates directly to prisma.expense.findUnique keyed by transactionId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.expense.findUnique.mockResolvedValue({ id: 'exp-1' });

    const result = await repository.findByTransactionId('ft-1');

    expect(prisma.expense.findUnique).toHaveBeenCalledWith({ where: { transactionId: 'ft-1' } });
    expect(result).toEqual({ id: 'exp-1' });
  });

  it('update() delegates directly to prisma.expense.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.expense.update.mockResolvedValue({ id: 'exp-1', receiptStorageKey: 'receipts/exp-1.pdf' });

    const result = await repository.update('exp-1', { receiptStorageKey: 'receipts/exp-1.pdf' });

    expect(prisma.expense.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: { receiptStorageKey: 'receipts/exp-1.pdf' },
    });
    expect(result).toEqual({ id: 'exp-1', receiptStorageKey: 'receipts/exp-1.pdf' });
  });
});
