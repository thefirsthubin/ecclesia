import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { FinancialTransactionService } from './financial-transaction.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildTransaction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    type: 'OFFERING',
    sourceGroupId: 'bacenta-1',
    giverPersonId: null,
    channel: 'CASH',
    amountMinor: 5000n,
    currency: 'GHS',
    currentState: 'RECORDED',
    createdAt: NOW,
    ...overrides,
  };
}

describe('FinancialTransactionService', () => {
  const bacentaLeader: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };
  const treasurer: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };

  function buildService() {
    const financialTransactionRepository = {
      findUserIdByPersonId: jest.fn(),
      findPersonIdByUserId: jest.fn(),
      createWithEvent: jest.fn(),
      findById: jest.fn(),
      findManyByBranch: jest.fn(),
      appendEvent: jest.fn(),
      findRecordedByPersonId: jest.fn(),
      findFirstEventByToState: jest.fn(),
    };
    const eventPublisher = { publish: jest.fn() };
    const service = new FinancialTransactionService(financialTransactionRepository as never, eventPublisher as never);
    return { service, financialTransactionRepository, eventPublisher };
  }

  describe('record', () => {
    it('sets giverPersonId to the acting Person only when no sourceGroupId is given, and publishes giving.activity_recorded', async () => {
      const { service, financialTransactionRepository, eventPublisher } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(
        buildTransaction({ sourceGroupId: null, giverPersonId: 'treasurer-1' }),
      );

      await service.record(treasurer, { type: 'DONATION', channel: 'MOBILE_MONEY', amountMinor: '1000' } as never);

      expect(financialTransactionRepository.createWithEvent).toHaveBeenCalledWith(
        expect.objectContaining({ giverPersonId: 'treasurer-1', sourceGroupId: undefined, initialState: 'RECORDED' }),
      );
      // Normalized per PRD §17.6 - no amount, transaction id, or channel in
      // the payload, only the subject Person and when it happened.
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'giving.activity_recorded', branchId: 'branch-1', subjectPersonId: 'treasurer-1', payload: {} }),
      );
    });

    it('leaves giverPersonId unset for a Bacenta-recorded offering, and publishes no giving signal (no individual to attribute it to)', async () => {
      const { service, financialTransactionRepository, eventPublisher } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction());

      await service.record(bacentaLeader, {
        type: 'OFFERING',
        sourceGroupId: 'bacenta-1',
        channel: 'CASH',
        amountMinor: '5000',
      } as never);

      expect(financialTransactionRepository.createWithEvent).toHaveBeenCalledWith(
        expect.objectContaining({ giverPersonId: undefined, sourceGroupId: 'bacenta-1' }),
      );
      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });

    it('converts the string amountMinor input to a native BigInt for persistence', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction());

      await service.record(bacentaLeader, { type: 'OFFERING', sourceGroupId: 'bacenta-1', channel: 'CASH', amountMinor: '5000' } as never);

      expect(financialTransactionRepository.createWithEvent).toHaveBeenCalledWith(
        expect.objectContaining({ amountMinor: 5000n }),
      );
    });

    it('throws ConflictException when the actor has no linked platform.users record', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue(undefined);

      await expect(
        service.record(treasurer, { type: 'DONATION', channel: 'MOBILE_MONEY', amountMinor: '1000' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('returns amountMinor as a string on the response DTO', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction({ amountMinor: 5000n }));

      const result = await service.record(bacentaLeader, {
        type: 'OFFERING',
        sourceGroupId: 'bacenta-1',
        channel: 'CASH',
        amountMinor: '5000',
      } as never);

      expect(result.amountMinor).toBe('5000');
      expect(typeof result.amountMinor).toBe('string');
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the transaction does not exist', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verify (FR-STW-03)', () => {
    it('allows RECORDED -> VERIFIED', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'RECORDED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-2');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'VERIFIED' }));
      financialTransactionRepository.findRecordedByPersonId.mockResolvedValue('bl-1');

      const result = await service.verify(treasurer, 'ft-1');

      expect(financialTransactionRepository.appendEvent).toHaveBeenCalledWith('ft-1', 'RECORDED', 'VERIFIED', 'user-2', undefined);
      expect(result.currentState).toBe('VERIFIED');
    });

    it('rejects verifying an already-RECONCILED transaction (terminal state)', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'RECONCILED' }));

      await expect(service.verify(treasurer, 'ft-1')).rejects.toThrow(ConflictException);
      expect(financialTransactionRepository.appendEvent).not.toHaveBeenCalled();
    });
  });

  describe('flag (FR-STW-04)', () => {
    it('allows RECORDED -> FLAGGED with a reason', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'RECORDED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-2');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'FLAGGED' }));
      financialTransactionRepository.findRecordedByPersonId.mockResolvedValue('bl-1');

      await service.flag(treasurer, 'ft-1', { reason: "doesn't match my count" });

      expect(financialTransactionRepository.appendEvent).toHaveBeenCalledWith(
        'ft-1',
        'RECORDED',
        'FLAGGED',
        'user-2',
        "doesn't match my count",
      );
    });
  });

  describe('escalate', () => {
    it('allows FLAGGED -> UNDER_INVESTIGATION', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'FLAGGED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-2');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'UNDER_INVESTIGATION' }));
      financialTransactionRepository.findRecordedByPersonId.mockResolvedValue('bl-1');

      const result = await service.escalate(treasurer, 'ft-1');

      expect(result.currentState).toBe('UNDER_INVESTIGATION');
    });

    it('rejects escalating a RECORDED transaction (must be FLAGGED first)', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'RECORDED' }));

      await expect(service.escalate(treasurer, 'ft-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('reconcile (FR-STW-07)', () => {
    it('allows VERIFIED -> RECONCILED', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'VERIFIED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-2');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'RECONCILED' }));
      financialTransactionRepository.findRecordedByPersonId.mockResolvedValue('bl-1');

      const result = await service.reconcile(treasurer, 'ft-1');

      expect(result.currentState).toBe('RECONCILED');
    });
  });

  describe('listByBranch', () => {
    it('scopes the list to the actor\'s own Branch and leaves recordedByPersonId null per row', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findManyByBranch.mockResolvedValue([buildTransaction()]);

      const result = await service.listByBranch(treasurer, 'RECORDED');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'RECORDED');
      expect(result[0].recordedByPersonId).toBeNull();
    });

    it('[Stewardship gaps sprint] narrows to the actor\'s own Bacenta when actor.bacentaId is set (BACENTA_LEADER list view)', async () => {
      const { service, financialTransactionRepository } = buildService();
      const bacentaLeaderWithGroup: ActorContext = { ...bacentaLeader, bacentaId: 'bacenta-1' };
      financialTransactionRepository.findManyByBranch.mockResolvedValue([buildTransaction()]);

      await service.listByBranch(bacentaLeaderWithGroup, 'RECORDED');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'RECORDED', undefined, 'bacenta-1');
    });
  });
});
