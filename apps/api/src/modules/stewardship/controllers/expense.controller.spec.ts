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
    const storageService = { save: jest.fn(), read: jest.fn() };
    const controller = new ExpenseController(expenseService as never, storageService as never);
    return { controller, expenseService, storageService };
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

  describe('uploadReceipt', () => {
    const file = { buffer: Buffer.from('x'), originalname: 'receipt.pdf', mimetype: 'application/pdf', size: 1 };

    it('rejects when no file was attached', async () => {
      const { controller } = buildController();

      await expect(controller.uploadReceipt(actor, 'exp-1', undefined)).rejects.toThrow('A receipt file is required');
    });

    it('rejects an unsupported mime type without touching storage', async () => {
      const { controller, storageService } = buildController();

      await expect(controller.uploadReceipt(actor, 'exp-1', { ...file, mimetype: 'application/zip' })).rejects.toThrow(
        'Unsupported file type',
      );
      expect(storageService.save).not.toHaveBeenCalled();
    });

    it('saves the file then attaches the resulting storage key', async () => {
      const { controller, expenseService, storageService } = buildController();
      storageService.save.mockResolvedValue({ storageKey: 'generated-key.pdf', sizeBytes: 1 });

      await controller.uploadReceipt(actor, 'exp-1', file);

      expect(storageService.save).toHaveBeenCalledWith(file.buffer, 'application/pdf');
      expect(expenseService.attachReceipt).toHaveBeenCalledWith(actor, 'exp-1', { receiptStorageKey: 'generated-key.pdf' });
    });
  });

  describe('getReceipt', () => {
    function buildRes() {
      return { set: jest.fn() };
    }

    it('rejects when the Expense has no receipt attached yet', async () => {
      const { controller, expenseService } = buildController();
      expenseService.getById.mockResolvedValue({ id: 'exp-1', receiptStorageKey: null });

      await expect(controller.getReceipt('exp-1', buildRes() as never)).rejects.toThrow('no receipt attached');
    });

    it('streams the stored file back with its content type', async () => {
      const { controller, expenseService, storageService } = buildController();
      expenseService.getById.mockResolvedValue({ id: 'exp-1', receiptStorageKey: 'stored-key.pdf' });
      storageService.read.mockResolvedValue({ buffer: Buffer.from('pdf-bytes'), mimeType: 'application/pdf' });
      const res = buildRes();

      const result = await controller.getReceipt('exp-1', res as never);

      expect(storageService.read).toHaveBeenCalledWith('stored-key.pdf');
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/pdf' }));
      expect(result.equals(Buffer.from('pdf-bytes'))).toBe(true);
    });
  });
});
