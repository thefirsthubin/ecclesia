import { PrayerNoteRepository } from './prayer-note.repository';

describe('[Milestone B] PrayerNoteRepository', () => {
  function buildRepository() {
    const prisma = {
      prayerNote: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    };
    const repository = new PrayerNoteRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.prayerNote.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.prayerNote.create.mockResolvedValue({ id: 'note-1' });

    const result = await repository.create({
      branchId: 'branch-1',
      personId: 'person-1',
      authorPersonId: 'pastor-1',
      content: 'Praying for healing',
    });

    expect(prisma.prayerNote.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        personId: 'person-1',
        authorPersonId: 'pastor-1',
        content: 'Praying for healing',
        followUpDate: undefined,
      },
    });
    expect(result).toEqual({ id: 'note-1' });
  });

  describe('findByPersonAndAuthor - the author-only enforcement point', () => {
    it('filters by both personId AND authorPersonId, newest first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.prayerNote.findMany.mockResolvedValue([{ id: 'note-1' }]);

      const result = await repository.findByPersonAndAuthor('person-1', 'pastor-1');

      expect(prisma.prayerNote.findMany).toHaveBeenCalledWith({
        where: { personId: 'person-1', authorPersonId: 'pastor-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'note-1' }]);
    });

    it('a different author querying the same personId gets a structurally different query, not just a filtered result', async () => {
      const { repository, prisma } = buildRepository();
      prisma.prayerNote.findMany.mockResolvedValue([]);

      await repository.findByPersonAndAuthor('person-1', 'pastor-2');

      expect(prisma.prayerNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { personId: 'person-1', authorPersonId: 'pastor-2' } }),
      );
    });
  });

  it('updateStatus() delegates directly to prisma.prayerNote.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.prayerNote.update.mockResolvedValue({ id: 'note-1', status: 'RESOLVED' });

    const result = await repository.updateStatus('note-1', 'RESOLVED');

    expect(prisma.prayerNote.update).toHaveBeenCalledWith({ where: { id: 'note-1' }, data: { status: 'RESOLVED' } });
    expect(result).toEqual({ id: 'note-1', status: 'RESOLVED' });
  });

  it('findById() delegates directly to prisma.prayerNote.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.prayerNote.findUnique.mockResolvedValue({ id: 'note-1' });

    const result = await repository.findById('note-1');

    expect(prisma.prayerNote.findUnique).toHaveBeenCalledWith({ where: { id: 'note-1' } });
    expect(result).toEqual({ id: 'note-1' });
  });
});
