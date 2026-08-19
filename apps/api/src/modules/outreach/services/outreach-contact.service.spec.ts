import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { OutreachContactService } from './outreach-contact.service';

const NOW = new Date('2026-08-15T09:00:00.000Z');

function buildContact(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'contact-1',
    outreachId: 'outreach-1',
    branchId: 'branch-1',
    personId: null,
    firstName: 'Kofi',
    lastName: null,
    phone: '0555000111',
    howReached: 'door-to-door',
    outcome: null,
    createdAt: NOW,
    ...overrides,
  };
}

describe('[Milestone B] OutreachContactService', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildService() {
    const outreachContactRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listByOutreach: jest.fn(),
      setPersonId: jest.fn(),
      updateOutcome: jest.fn(),
      listForConversion: jest.fn(),
    };
    const outreachRepository = {
      findById: jest.fn(),
    };
    const personService = {
      create: jest.fn(),
    };
    const service = new OutreachContactService(outreachContactRepository as never, outreachRepository as never, personService as never);
    return { service, outreachContactRepository, outreachRepository, personService };
  }

  describe('addContact', () => {
    it('throws NotFoundException when the parent Outreach does not exist', async () => {
      const { service, outreachRepository } = buildService();
      outreachRepository.findById.mockResolvedValue(null);

      await expect(service.addContact('missing', { firstName: 'Kofi' } as never)).rejects.toThrow(NotFoundException);
    });

    it('resolves branchId from the parent Outreach', async () => {
      const { service, outreachContactRepository, outreachRepository } = buildService();
      outreachRepository.findById.mockResolvedValue({ id: 'outreach-1', branchId: 'branch-1' });
      outreachContactRepository.create.mockResolvedValue(buildContact());

      await service.addContact('outreach-1', { firstName: 'Kofi', phone: '0555000111' } as never);

      expect(outreachContactRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ outreachId: 'outreach-1', branchId: 'branch-1', firstName: 'Kofi', phone: '0555000111' }),
      );
    });
  });

  describe('listForOutreach', () => {
    it('maps repository rows to response DTOs', async () => {
      const { service, outreachContactRepository } = buildService();
      outreachContactRepository.listByOutreach.mockResolvedValue([buildContact()]);

      const result = await service.listForOutreach('outreach-1');

      expect(outreachContactRepository.listByOutreach).toHaveBeenCalledWith('outreach-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateOutcome', () => {
    it('throws NotFoundException when the contact does not exist', async () => {
      const { service, outreachContactRepository } = buildService();
      outreachContactRepository.findById.mockResolvedValue(null);

      await expect(service.updateOutcome('missing', { outcome: 'ATTENDED' } as never)).rejects.toThrow(NotFoundException);
    });

    it('delegates to the repository', async () => {
      const { service, outreachContactRepository } = buildService();
      outreachContactRepository.findById.mockResolvedValue(buildContact());
      outreachContactRepository.updateOutcome.mockResolvedValue(buildContact({ outcome: 'ATTENDED' }));

      const result = await service.updateOutcome('contact-1', { outcome: 'ATTENDED' } as never);

      expect(outreachContactRepository.updateOutcome).toHaveBeenCalledWith('contact-1', 'ATTENDED');
      expect(result.outcome).toBe('ATTENDED');
    });
  });

  describe('promote', () => {
    it('throws NotFoundException when the contact does not exist', async () => {
      const { service, outreachContactRepository } = buildService();
      outreachContactRepository.findById.mockResolvedValue(null);

      await expect(service.promote(actor, 'missing', {} as never)).rejects.toThrow(NotFoundException);
    });

    it('rejects re-promoting an already-promoted contact', async () => {
      const { service, outreachContactRepository } = buildService();
      outreachContactRepository.findById.mockResolvedValue(buildContact({ personId: 'person-existing' }));

      await expect(service.promote(actor, 'contact-1', {} as never)).rejects.toThrow(ConflictException);
    });

    it('requires a lastName when neither the contact nor the request supplies one', async () => {
      const { service, outreachContactRepository } = buildService();
      outreachContactRepository.findById.mockResolvedValue(buildContact({ lastName: null }));

      await expect(service.promote(actor, 'contact-1', {} as never)).rejects.toThrow(BadRequestException);
    });

    it('uses the contact\'s own lastName when the request supplies none', async () => {
      const { service, outreachContactRepository, personService } = buildService();
      outreachContactRepository.findById.mockResolvedValue(buildContact({ lastName: 'Mensah' }));
      personService.create.mockResolvedValue({ id: 'person-new' });
      outreachContactRepository.setPersonId.mockResolvedValue(buildContact({ lastName: 'Mensah', personId: 'person-new' }));

      const result = await service.promote(actor, 'contact-1', {} as never);

      expect(personService.create).toHaveBeenCalledWith(
        actor,
        expect.objectContaining({ firstName: 'Kofi', lastName: 'Mensah', phone: '0555000111', overrideDuplicateCheck: false }),
      );
      expect(outreachContactRepository.setPersonId).toHaveBeenCalledWith('contact-1', 'person-new');
      expect(result.personId).toBe('person-new');
    });

    it('prefers an explicit request lastName over the contact\'s own', async () => {
      const { service, outreachContactRepository, personService } = buildService();
      outreachContactRepository.findById.mockResolvedValue(buildContact({ lastName: 'Mensah' }));
      personService.create.mockResolvedValue({ id: 'person-new' });
      outreachContactRepository.setPersonId.mockResolvedValue(buildContact({ personId: 'person-new' }));

      await service.promote(actor, 'contact-1', { lastName: 'Owusu', overrideDuplicateCheck: true } as never);

      expect(personService.create).toHaveBeenCalledWith(
        actor,
        expect.objectContaining({ lastName: 'Owusu', overrideDuplicateCheck: true }),
      );
    });
  });

  describe('[Milestone C.1.2] listForConversion', () => {
    it('delegates directly to the repository', async () => {
      const { service, outreachContactRepository } = buildService();
      const rows = [{ id: 'contact-1', personId: null, createdAt: NOW }];
      outreachContactRepository.listForConversion.mockResolvedValue(rows);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await service.listForConversion('branch-1', ['bacenta-1'], from, to);

      expect(outreachContactRepository.listForConversion).toHaveBeenCalledWith('branch-1', ['bacenta-1'], from, to);
      expect(result).toBe(rows);
    });
  });
});
