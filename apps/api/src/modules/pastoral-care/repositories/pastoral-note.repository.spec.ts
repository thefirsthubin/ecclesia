import { PastoralNoteRepository } from './pastoral-note.repository';

describe('PastoralNoteRepository', () => {
  function buildRepository() {
    const prisma = {
      pastoralNote: { create: jest.fn(), findMany: jest.fn() },
    };
    const repository = new PastoralNoteRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() delegates directly to prisma.pastoralNote.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pastoralNote.create.mockResolvedValue({ id: 'note-1' });
    const input = { branchId: 'branch-1', personId: 'person-1', authorPersonId: 'shepherd-1', content: 'Reached out today.' };

    const result = await repository.create(input);

    expect(prisma.pastoralNote.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'note-1' });
  });

  it('findByPersonId() orders by most recent first', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pastoralNote.findMany.mockResolvedValue([{ id: 'note-1' }]);

    const result = await repository.findByPersonId('person-1');

    expect(prisma.pastoralNote.findMany).toHaveBeenCalledWith({
      where: { personId: 'person-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'note-1' }]);
  });
});
