import type { ActorContext } from '@ecclesia/rbac';

import { FinancialTransactionController } from './financial-transaction.controller';

describe('FinancialTransactionController', () => {
  const actor: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };

  function buildController() {
    const financialTransactionService = {
      record: jest.fn(),
      listByBranch: jest.fn(),
      summarize: jest.fn(),
      getById: jest.fn(),
      verify: jest.fn(),
      flag: jest.fn(),
      escalate: jest.fn(),
      reconcile: jest.fn(),
    };
    const controller = new FinancialTransactionController(financialTransactionService as never);
    return { controller, financialTransactionService };
  }

  it('record() delegates to FinancialTransactionService.record with the current actor', async () => {
    const { controller, financialTransactionService } = buildController();
    const body = { type: 'OFFERING', sourceGroupId: 'bacenta-1', channel: 'CASH', amountMinor: '5000' } as never;

    await controller.record(actor, body);

    expect(financialTransactionService.record).toHaveBeenCalledWith(actor, body);
  });

  it('listByBranch() delegates to FinancialTransactionService.listByBranch with the actor and state/type/sourceGroupId query params', async () => {
    const { controller, financialTransactionService } = buildController();

    await controller.listByBranch(actor, { state: 'FLAGGED', type: 'OFFERING', sourceGroupId: 'bacenta-1' });

    expect(financialTransactionService.listByBranch).toHaveBeenCalledWith(actor, 'FLAGGED', 'OFFERING', 'bacenta-1');
  });

  it('[Milestone A] summarize() delegates to FinancialTransactionService.summarize with parsed from/to Dates', async () => {
    const { controller, financialTransactionService } = buildController();

    await controller.summarize(actor, { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z', type: 'TITHE', groupBy: 'group' });

    expect(financialTransactionService.summarize).toHaveBeenCalledWith(
      actor,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-09-01T00:00:00.000Z'),
      'TITHE',
      'group',
    );
  });

  it('getById() delegates to FinancialTransactionService.getById', async () => {
    const { controller, financialTransactionService } = buildController();

    await controller.getById('ft-1');

    expect(financialTransactionService.getById).toHaveBeenCalledWith('ft-1');
  });

  it('verify() delegates to FinancialTransactionService.verify with the current actor', async () => {
    const { controller, financialTransactionService } = buildController();

    await controller.verify(actor, 'ft-1');

    expect(financialTransactionService.verify).toHaveBeenCalledWith(actor, 'ft-1');
  });

  it('flag() delegates to FinancialTransactionService.flag', async () => {
    const { controller, financialTransactionService } = buildController();
    const body = { reason: 'mismatch' } as never;

    await controller.flag(actor, 'ft-1', body);

    expect(financialTransactionService.flag).toHaveBeenCalledWith(actor, 'ft-1', body);
  });

  it('escalate() delegates to FinancialTransactionService.escalate', async () => {
    const { controller, financialTransactionService } = buildController();

    await controller.escalate(actor, 'ft-1');

    expect(financialTransactionService.escalate).toHaveBeenCalledWith(actor, 'ft-1');
  });

  it('reconcile() delegates to FinancialTransactionService.reconcile', async () => {
    const { controller, financialTransactionService } = buildController();

    await controller.reconcile(actor, 'ft-1');

    expect(financialTransactionService.reconcile).toHaveBeenCalledWith(actor, 'ft-1');
  });
});
