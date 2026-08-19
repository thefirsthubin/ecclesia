import { OutreachContactRepository } from './outreach-contact.repository';

describe('[Milestone B] OutreachContactRepository', () => {
  function buildRepository() {
    const prisma = {
      outreachContact: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    const repository = new OutreachContactRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.outreachContact.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreachContact.create.mockResolvedValue({ id: 'contact-1' });

    const result = await repository.create({ outreachId: 'outreach-1', branchId: 'branch-1', firstName: 'Kofi' });

    expect(prisma.outreachContact.create).toHaveBeenCalledWith({
      data: {
        outreachId: 'outreach-1',
        branchId: 'branch-1',
        firstName: 'Kofi',
        lastName: undefined,
        phone: undefined,
        howReached: undefined,
        outcome: undefined,
      },
    });
    expect(result).toEqual({ id: 'contact-1' });
  });

  it('findById() delegates directly to prisma.outreachContact.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreachContact.findUnique.mockResolvedValue({ id: 'contact-1' });

    const result = await repository.findById('contact-1');

    expect(prisma.outreachContact.findUnique).toHaveBeenCalledWith({ where: { id: 'contact-1' } });
    expect(result).toEqual({ id: 'contact-1' });
  });

  it('listByOutreach() filters by outreachId, oldest first', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreachContact.findMany.mockResolvedValue([{ id: 'contact-1' }]);

    const result = await repository.listByOutreach('outreach-1');

    expect(prisma.outreachContact.findMany).toHaveBeenCalledWith({
      where: { outreachId: 'outreach-1' },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual([{ id: 'contact-1' }]);
  });

  it('setPersonId() updates only personId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreachContact.update.mockResolvedValue({ id: 'contact-1', personId: 'person-1' });

    const result = await repository.setPersonId('contact-1', 'person-1');

    expect(prisma.outreachContact.update).toHaveBeenCalledWith({ where: { id: 'contact-1' }, data: { personId: 'person-1' } });
    expect(result).toEqual({ id: 'contact-1', personId: 'person-1' });
  });

  it('updateOutcome() updates only outcome', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreachContact.update.mockResolvedValue({ id: 'contact-1', outcome: 'ATTENDED' });

    const result = await repository.updateOutcome('contact-1', 'ATTENDED');

    expect(prisma.outreachContact.update).toHaveBeenCalledWith({ where: { id: 'contact-1' }, data: { outcome: 'ATTENDED' } });
    expect(result).toEqual({ id: 'contact-1', outcome: 'ATTENDED' });
  });

  describe('[Milestone C.1.2] listForConversion', () => {
    it('filters by branchId alone when groupIds/from/to are all omitted', async () => {
      const { repository, prisma } = buildRepository();
      prisma.outreachContact.findMany.mockResolvedValue([]);

      await repository.listForConversion('branch-1');

      expect(prisma.outreachContact.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        select: { id: true, personId: true, createdAt: true },
      });
    });

    it('narrows via the outreach relation when groupIds is given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.outreachContact.findMany.mockResolvedValue([]);

      await repository.listForConversion('branch-1', ['bacenta-1', 'bacenta-2']);

      expect(prisma.outreachContact.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', outreach: { groupId: { in: ['bacenta-1', 'bacenta-2'] } } },
        select: { id: true, personId: true, createdAt: true },
      });
    });

    it('adds an outreach.occurredAt range filter when from/to are given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.outreachContact.findMany.mockResolvedValue([]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      await repository.listForConversion('branch-1', undefined, from, to);

      expect(prisma.outreachContact.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', outreach: { occurredAt: { gte: from, lte: to } } },
        select: { id: true, personId: true, createdAt: true },
      });
    });

    it('short-circuits to [] without querying prisma when groupIds is an empty array', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.listForConversion('branch-1', []);

      expect(result).toEqual([]);
      expect(prisma.outreachContact.findMany).not.toHaveBeenCalled();
    });
  });
});
