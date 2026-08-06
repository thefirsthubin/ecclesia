import type { ActorContext } from '@ecclesia/rbac';

import { ExpenseController } from './expense.controller';

describe('ExpenseController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const expenseService = {
      request: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      pay: jest.fn(),
      attachReceipt: jest.fn(),
    };
    const controller = new ExpenseController(expenseService as never);
    return { controller, expenseService };
  }

  it('request() delegates to ExpenseService.request with the current actor', async () => {
    const { controller, expenseService } = buildController();
    const body = { amountMinor: '20000', description: 'Sound system repair' } as never;

    await controller.request(actor, body);

    expect(expenseService.request).toHaveBeenCalledWith(actor, body);
  });

  it('list() delegates to ExpenseService.list with the current actor and optional state', async () => {
    const { controller, expenseService } = buildController();

    await controller.list(actor, 'REQUESTED');

    expect(expenseService.list).toHaveBeenCalledWith(actor, 'REQUESTED');
  });

  it('getById() delegates to ExpenseService.getById', async () => {
    const { controller, expenseService } = buildController();

    await controller.getById('exp-1');

    expect(expenseService.getById).toHaveBeenCalledWith('exp-1');
  });

  it('approve() delegates to ExpenseService.approve with the current actor', async () => {
    const { controller, expenseService } = buildController();

    await controller.approve(actor, 'exp-1');

    expect(expenseService.approve).toHaveBeenCalledWith(actor, 'exp-1');
  });

  it('reject() delegates to ExpenseService.reject', async () => {
    const { controller, expenseService } = buildController();
    const body = { reason: 'Not budgeted' } as never;

    await controller.reject(actor, 'exp-1', body);

    expect(expenseService.reject).toHaveBeenCalledWith(actor, 'exp-1', body);
  });

  it('pay() delegates to ExpenseService.pay', async () => {
    const { controller, expenseService } = buildController();

    await controller.pay(actor, 'exp-1');

    expect(expenseService.pay).toHaveBeenCalledWith(actor, 'exp-1');
  });

  it('attachReceipt() delegates to ExpenseService.attachReceipt', async () => {
    const { controller, expenseService } = buildController();
    const body = { receiptStorageKey: 'receipts/exp-1.pdf' } as never;

    await controller.attachReceipt(actor, 'exp-1', body);

    expect(expenseService.attachReceipt).toHaveBeenCalledWith(actor, 'exp-1', body);
  });
});
