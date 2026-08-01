import { AlertRepository } from './alert.repository';

describe('AlertRepository', () => {
  function buildRepository() {
    const prisma = {
      alert: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    const repository = new AlertRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.alert.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.create.mockResolvedValue({ id: 'alert-1' });
    const input = { branchId: 'branch-1', scopeType: 'GROUP' as const, scopeId: 'group-1', alertType: 'PULSE_DECLINE' };

    const result = await repository.create(input);

    expect(prisma.alert.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'alert-1' });
  });

  it('findById() delegates to prisma.alert.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.findUnique.mockResolvedValue({ id: 'alert-1' });

    const result = await repository.findById('alert-1');

    expect(prisma.alert.findUnique).toHaveBeenCalledWith({ where: { id: 'alert-1' } });
    expect(result).toEqual({ id: 'alert-1' });
  });

  it('hasOpenAlert() returns true when a matching OPEN alert exists', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.findFirst.mockResolvedValue({ id: 'alert-1' });

    const result = await repository.hasOpenAlert('GROUP', 'group-1', 'PULSE_DECLINE');

    expect(prisma.alert.findFirst).toHaveBeenCalledWith({
      where: { scopeType: 'GROUP', scopeId: 'group-1', alertType: 'PULSE_DECLINE', status: 'OPEN' },
    });
    expect(result).toBe(true);
  });

  it('hasOpenAlert() returns false when none exists', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.findFirst.mockResolvedValue(null);

    const result = await repository.hasOpenAlert('BRANCH', 'branch-1', 'PULSE_DECLINE');

    expect(result).toBe(false);
  });

  it('listByScope() orders by triggeredAt descending', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.findMany.mockResolvedValue([]);

    await repository.listByScope('BRANCH', 'branch-1');

    expect(prisma.alert.findMany).toHaveBeenCalledWith({
      where: { scopeType: 'BRANCH', scopeId: 'branch-1' },
      orderBy: { triggeredAt: 'desc' },
    });
  });

  it('resolve() updates status/resolvedByPersonId/resolvedAt', async () => {
    const { repository, prisma } = buildRepository();
    prisma.alert.update.mockResolvedValue({ id: 'alert-1', status: 'ACTED' });
    const resolvedAt = new Date('2026-08-01T00:00:00.000Z');

    const result = await repository.resolve('alert-1', { status: 'ACTED', resolvedByPersonId: 'person-1', resolvedAt });

    expect(prisma.alert.update).toHaveBeenCalledWith({
      where: { id: 'alert-1' },
      data: { status: 'ACTED', resolvedByPersonId: 'person-1', resolvedAt },
    });
    expect(result).toEqual({ id: 'alert-1', status: 'ACTED' });
  });
});
