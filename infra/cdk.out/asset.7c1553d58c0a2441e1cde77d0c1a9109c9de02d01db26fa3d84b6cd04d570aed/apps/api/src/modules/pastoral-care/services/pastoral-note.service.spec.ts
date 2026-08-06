import type { ActorContext } from '@ecclesia/rbac';

import { PastoralNoteService } from './pastoral-note.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

describe('PastoralNoteService', () => {
  const actor: ActorContext = { personId: 'shepherd-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildService() {
    const pastoralNoteRepository = { create: jest.fn(), findByPersonId: jest.fn() };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' }),
    };
    const service = new PastoralNoteService(pastoralNoteRepository as never, personScopeService as never);
    return { service, pastoralNoteRepository, personScopeService };
  }

  it('create() resolves branchId from the subject Person and records the acting Person as author', async () => {
    const { service, pastoralNoteRepository, personScopeService } = buildService();
    pastoralNoteRepository.create.mockResolvedValue({
      id: 'note-1',
      branchId: 'branch-1',
      personId: 'person-1',
      authorPersonId: 'shepherd-1',
      content: 'Reached out today.',
      createdAt: NOW,
    });

    const result = await service.create(actor, 'person-1', { content: 'Reached out today.' });

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    expect(pastoralNoteRepository.create).toHaveBeenCalledWith({
      branchId: 'branch-1',
      personId: 'person-1',
      authorPersonId: 'shepherd-1',
      content: 'Reached out today.',
    });
    expect(result.authorPersonId).toBe('shepherd-1');
  });

  it('listByPerson() maps every note to its response DTO', async () => {
    const { service, pastoralNoteRepository } = buildService();
    pastoralNoteRepository.findByPersonId.mockResolvedValue([
      { id: 'note-1', branchId: 'branch-1', personId: 'person-1', authorPersonId: 'shepherd-1', content: 'A', createdAt: NOW },
      { id: 'note-2', branchId: 'branch-1', personId: 'person-1', authorPersonId: 'shepherd-1', content: 'B', createdAt: NOW },
    ]);

    const result = await service.listByPerson('person-1');

    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('A');
  });
});
