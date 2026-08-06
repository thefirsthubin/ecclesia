import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { ExpenseService } from './expense.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildExpense(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'exp-1',
    branchId: 'branch-1',
    transactionId: 'ft-1',
    requestedByPersonId: 'requester-1',
    description: 'Sound system repair',
    category: null,
    receiptStorageKey: null,
    approvedByPersonId: null,
    approvedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildTransaction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    type: 'EXPENSE',
    sourceGroupId: null,
    giverPersonId: null,
    channel: null,
    amountMinor: 20000n,
    currency: 'GHS',
    currentState: 'REQUESTED',
    createdAt: NOW,
    ...overrides,
  };
}

describe('ExpenseService', () => {
  const requester: ActorContext = { personId: 'requester-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };
  const approver: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const treasurer: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };

  function buildService() {
    const expenseRepository = { create: jest.fn(), findById: jest.fn(), findByTransactionId: jest.fn(), update: jest.fn() };
    const financialTransactionRepository = {
      findUserIdByPersonId: jest.fn(),
      createWithEvent: jest.fn(),
      findById: jest.fn(),
      appendEvent: jest.fn(),
      findManyByBranch: jest.fn(),
    };
    const service = new ExpenseService(expenseRepository as never, financialTransactionRepository as never);
    return { service, expenseRepository, financialTransactionRepository };
  }

  describe('request', () => {
    it('creates the underlying FinancialTransaction (type EXPENSE, state REQUESTED) and the Expense extension row', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction());
      expenseRepository.create.mockResolvedValue(buildExpense());

      await service.request(requester, { amountMinor: '20000', description: 'Sound system repair' } as never);

      expect(financialTransactionRepository.createWithEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EXPENSE', initialState: 'REQUESTED', amountMinor: 20000n }),
      );
      expect(expenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ transactionId: 'ft-1', requestedByPersonId: 'requester-1', description: 'Sound system repair' }),
      );
    });

    it('throws ConflictException when the actor has no linked platform.users record', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue(undefined);

      await expect(service.request(requester, { amountMinor: '20000', description: 'x' } as never)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('list (Stewardship Web Admin sprint)', () => {
    it('lists EXPENSE-type transactions for the branch and joins each with its Expense extension row', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      financialTransactionRepository.findManyByBranch.mockResolvedValue([buildTransaction({ id: 'ft-1' })]);
      expenseRepository.findByTransactionId.mockResolvedValue(buildExpense({ transactionId: 'ft-1' }));

      const result = await service.list(approver, 'REQUESTED');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'REQUESTED', 'EXPENSE');
      expect(expenseRepository.findByTransactionId).toHaveBeenCalledWith('ft-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('exp-1');
    });

    it('filters out any transaction with no matching Expense extension row', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      financialTransactionRepository.findManyByBranch.mockResolvedValue([buildTransaction({ id: 'ft-1' })]);
      expenseRepository.findByTransactionId.mockResolvedValue(null);

      const result = await service.list(approver);

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', undefined, 'EXPENSE');
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Expense does not exist', async () => {
      const { service, expenseRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve (FR-STW-09)', () => {
    it('allows REQUESTED -> APPROVED and stamps approvedByPersonId/approvedAt', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(buildExpense());
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'REQUESTED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-2');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'APPROVED' }));
      expenseRepository.update.mockResolvedValue(buildExpense({ approvedByPersonId: 'pastor-1', approvedAt: NOW }));

      const result = await service.approve(approver, 'exp-1');

      expect(financialTransactionRepository.appendEvent).toHaveBeenCalledWith('ft-1', 'REQUESTED', 'APPROVED', 'user-2', undefined);
      expect(expenseRepository.update).toHaveBeenCalledWith(
        'exp-1',
        expect.objectContaining({ approvedByPersonId: 'pastor-1' }),
      );
      expect(result.currentState).toBe('APPROVED');
    });

    it('rejects approving an already-PAID expense (terminal path already progressed)', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(buildExpense());
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'PAID' }));

      await expect(service.approve(approver, 'exp-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('allows REQUESTED -> REJECTED with a reason', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(buildExpense());
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'REQUESTED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-2');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'REJECTED' }));

      const result = await service.reject(approver, 'exp-1', { reason: 'Not in this quarter\'s budget' });

      expect(financialTransactionRepository.appendEvent).toHaveBeenCalledWith(
        'ft-1',
        'REQUESTED',
        'REJECTED',
        'user-2',
        "Not in this quarter's budget",
      );
      expect(result.currentState).toBe('REJECTED');
    });
  });

  describe('pay', () => {
    it('allows APPROVED -> PAID', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(buildExpense());
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'APPROVED' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-3');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'PAID' }));

      const result = await service.pay(treasurer, 'exp-1');

      expect(result.currentState).toBe('PAID');
    });
  });

  describe('attachReceipt (BR-STW-08)', () => {
    it('rejects when the caller is not the original requester', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(buildExpense({ requestedByPersonId: 'requester-1' }));
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'PAID' }));

      await expect(
        service.attachReceipt(treasurer, 'exp-1', { receiptStorageKey: 'receipts/exp-1.pdf' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the original requester to move PAID -> RECEIPT_RETAINED', async () => {
      const { service, expenseRepository, financialTransactionRepository } = buildService();
      expenseRepository.findById.mockResolvedValue(buildExpense({ requestedByPersonId: 'requester-1' }));
      financialTransactionRepository.findById.mockResolvedValue(buildTransaction({ currentState: 'PAID' }));
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.appendEvent.mockResolvedValue(buildTransaction({ currentState: 'RECEIPT_RETAINED' }));
      expenseRepository.update.mockResolvedValue(buildExpense({ receiptStorageKey: 'receipts/exp-1.pdf' }));

      const result = await service.attachReceipt(requester, 'exp-1', { receiptStorageKey: 'receipts/exp-1.pdf' });

      expect(expenseRepository.update).toHaveBeenCalledWith('exp-1', { receiptStorageKey: 'receipts/exp-1.pdf' });
      expect(result.currentState).toBe('RECEIPT_RETAINED');
    });
  });
});
