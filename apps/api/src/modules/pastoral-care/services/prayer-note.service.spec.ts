import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { PrayerNoteService } from './prayer-note.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');

function buildNote(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'note-1',
    branchId: 'branch-1',
    personId: 'person-1',
    authorPersonId: 'pastor-1',
    content: 'Praying for healing',
    followUpDate: null,
    status: 'OPEN',
    createdAt: NOW,
    ...overrides,
  };
}

describe('[Milestone B] PrayerNoteService', () => {
  const residentPastor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const assistantPastor: ActorContext = { personId: 'pastor-2', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildService() {
    const prayerNoteRepository = {
      create: jest.fn(),
      findByPersonAndAuthor: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
    };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }),
    };
    const service = new PrayerNoteService(prayerNoteRepository as never, personScopeService as never);
    return { service, prayerNoteRepository, personScopeService };
  }

  describe('create', () => {
    it('sets authorPersonId to the acting Person - never client-supplied', async () => {
      const { service, prayerNoteRepository } = buildService();
      prayerNoteRepository.create.mockResolvedValue(buildNote());

      await service.create(residentPastor, 'person-1', { content: 'Praying for healing' } as never);

      expect(prayerNoteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ authorPersonId: 'pastor-1', personId: 'person-1', content: 'Praying for healing' }),
      );
    });

    it('resolves branchId from the subject Person via PersonScopeService', async () => {
      const { service, prayerNoteRepository, personScopeService } = buildService();
      prayerNoteRepository.create.mockResolvedValue(buildNote());

      await service.create(residentPastor, 'person-1', { content: 'note' } as never);

      expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', residentPastor);
    });
  });

  describe('listByPerson - author-only visibility (the approved product decision)', () => {
    it('queries by the acting actor\'s own personId as author, not just the subject Person', async () => {
      const { service, prayerNoteRepository } = buildService();
      prayerNoteRepository.findByPersonAndAuthor.mockResolvedValue([buildNote()]);

      await service.listByPerson(residentPastor, 'person-1');

      expect(prayerNoteRepository.findByPersonAndAuthor).toHaveBeenCalledWith('person-1', 'pastor-1');
    });

    it('Resident Pastor and Assistant Pastor querying the same subject Person get different author-filtered queries', async () => {
      const { service, prayerNoteRepository } = buildService();
      prayerNoteRepository.findByPersonAndAuthor.mockResolvedValue([]);

      await service.listByPerson(residentPastor, 'person-1');
      await service.listByPerson(assistantPastor, 'person-1');

      expect(prayerNoteRepository.findByPersonAndAuthor).toHaveBeenNthCalledWith(1, 'person-1', 'pastor-1');
      expect(prayerNoteRepository.findByPersonAndAuthor).toHaveBeenNthCalledWith(2, 'person-1', 'pastor-2');
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      const { service, prayerNoteRepository } = buildService();
      prayerNoteRepository.findById.mockResolvedValue(null);

      await expect(service.updateStatus(residentPastor, 'missing', { status: 'RESOLVED' } as never)).rejects.toThrow(NotFoundException);
    });

    it('rejects a non-author trying to update someone else\'s note - even a fellow pastor', async () => {
      const { service, prayerNoteRepository } = buildService();
      prayerNoteRepository.findById.mockResolvedValue(buildNote({ authorPersonId: 'pastor-1' }));

      await expect(service.updateStatus(assistantPastor, 'note-1', { status: 'RESOLVED' } as never)).rejects.toThrow(ForbiddenException);
    });

    it('allows the authoring pastor to update their own note', async () => {
      const { service, prayerNoteRepository } = buildService();
      prayerNoteRepository.findById.mockResolvedValue(buildNote({ authorPersonId: 'pastor-1' }));
      prayerNoteRepository.updateStatus.mockResolvedValue(buildNote({ status: 'RESOLVED' }));

      const result = await service.updateStatus(residentPastor, 'note-1', { status: 'RESOLVED' } as never);

      expect(prayerNoteRepository.updateStatus).toHaveBeenCalledWith('note-1', 'RESOLVED');
      expect(result.status).toBe('RESOLVED');
    });
  });
});
