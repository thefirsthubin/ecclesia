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
});
