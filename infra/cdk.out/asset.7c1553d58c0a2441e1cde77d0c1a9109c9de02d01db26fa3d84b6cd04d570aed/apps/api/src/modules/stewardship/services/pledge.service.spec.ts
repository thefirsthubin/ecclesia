import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { PledgeService } from './pledge.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildProject(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: 'proj-1', branchId: 'branch-1', name: 'Building Fund', status: 'ACTIVE', ...overrides };
}

function buildPledge(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pledge-1',
    branchId: 'branch-1',
    projectId: 'proj-1',
    personId: 'member-1',
    pledgedAmountMinor: 50000n,
    currency: 'GHS',
    pledgedAt: NOW,
    reminderOptIn: false,
    reminderSentAt: null,
    fulfilledTransactionId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildTransaction(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: 'ft-1', type: 'DONATION', ...overrides };
}

describe('PledgeService', () => {
  const member: ActorContext = { personId: 'member-1', role: 'MEMBER', branchId: 'branch-1' };

  function buildService() {
    const pledgeRepository = { create: jest.fn(), findById: jest.fn(), fulfill: jest.fn() };
    const projectRepository = { findById: jest.fn() };
    const financialTransactionRepository = { findById: jest.fn() };
    const service = new PledgeService(pledgeRepository as never, projectRepository as never, financialTransactionRepository as never);
    return { service, pledgeRepository, projectRepository, financialTransactionRepository };
  }

  describe('create', () => {
    it('throws NotFoundException when the Project does not exist', async () => {
      const { service, projectRepository } = buildService();
      projectRepository.findById.mockResolvedValue(null);

      await expect(service.create(member, { projectId: 'missing', pledgedAmountMinor: '50000' } as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('always attributes the Pledge to the acting Person, never a client-supplied personId', async () => {
      const { service, projectRepository, pledgeRepository } = buildService();
      projectRepository.findById.mockResolvedValue(buildProject());
      pledgeRepository.create.mockResolvedValue(buildPledge());

      await service.create(member, { projectId: 'proj-1', pledgedAmountMinor: '50000', reminderOptIn: true } as never);

      expect(pledgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ personId: 'member-1', projectId: 'proj-1', pledgedAmountMinor: 50000n, reminderOptIn: true }),
      );
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Pledge does not exist', async () => {
      const { service, pledgeRepository } = buildService();
      pledgeRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('fulfill', () => {
    it('throws NotFoundException when the referenced Financial Transaction does not exist', async () => {
      const { service, pledgeRepository, financialTransactionRepository } = buildService();
      pledgeRepository.findById.mockResolvedValue(buildPledge());
      financialTransactionRepository.findById.mockResolvedValue(null);

      await expect(service.fulfill('pledge-1', { fulfilledTransactionId: 'missing' })).rejects.toThrow(NotFoundException);
    });

    it('rejects a fulfilling transaction whose type is neither PLEDGE nor DONATION', async () => {
      const { service, pledgeRepository, financialTransactionRepository } = buildService();
      pledgeRepository.findById.mockResolvedValue(buildPledge());
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ type: 'OFFERING' }));

      await expect(service.fulfill('pledge-1', { fulfilledTransactionId: 'ft-1' })).rejects.toThrow(ConflictException);
    });

    it('links the Pledge to a valid DONATION-type transaction', async () => {
      const { service, pledgeRepository, financialTransactionRepository } = buildService();
      pledgeRepository.findById.mockResolvedValue(buildPledge());
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ type: 'DONATION' }));
      pledgeRepository.fulfill.mockResolvedValue(buildPledge({ fulfilledTransactionId: 'ft-1' }));

      const result = await service.fulfill('pledge-1', { fulfilledTransactionId: 'ft-1' });

      expect(pledgeRepository.fulfill).toHaveBeenCalledWith('pledge-1', 'ft-1');
      expect(result.fulfilledTransactionId).toBe('ft-1');
    });
  });
});
