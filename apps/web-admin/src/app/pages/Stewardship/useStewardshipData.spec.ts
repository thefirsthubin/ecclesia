import {
  approveExpense,
  confirmBankDeposit,
  escalateTransaction,
  flagTransaction,
  formatAmountMinor,
  payExpense,
  reconcileTransaction,
  rejectExpense,
  verifyTransaction,
} from './useStewardshipData';

afterEach(() => jest.clearAllMocks());

describe('formatAmountMinor', () => {
  it('divides minor units by 100 and formats with two decimal places', () => {
    expect(formatAmountMinor('20000', 'GHS')).toBe('GHS 200.00');
  });

  it('formats a non-round amount correctly', () => {
    expect(formatAmountMinor('1050', 'GHS')).toBe('GHS 10.50');
  });

  it('formats zero', () => {
    expect(formatAmountMinor('0', 'GHS')).toBe('GHS 0.00');
  });
});

describe('Financial Transaction action wrappers', () => {
  it('verifyTransaction() POSTs to /financial-transactions/:id/verify with no body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'ft-1', currentState: 'VERIFIED' }) });
    global.fetch = fetchMock;

    await verifyTransaction('token', 'ft-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/financial-transactions/ft-1/verify');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({});
  });

  it('flagTransaction() POSTs the reason', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'ft-1', currentState: 'FLAGGED' }) });
    global.fetch = fetchMock;

    await flagTransaction('token', 'ft-1', { reason: 'Amount mismatch' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/financial-transactions/ft-1/flag');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'Amount mismatch' });
  });

  it('escalateTransaction() POSTs to /financial-transactions/:id/escalate', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'ft-1', currentState: 'UNDER_INVESTIGATION' }) });
    global.fetch = fetchMock;

    await escalateTransaction('token', 'ft-1');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/financial-transactions/ft-1/escalate');
  });

  it('reconcileTransaction() POSTs to /financial-transactions/:id/reconcile', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'ft-1', currentState: 'RECONCILED' }) });
    global.fetch = fetchMock;

    await reconcileTransaction('token', 'ft-1');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/financial-transactions/ft-1/reconcile');
  });
});

describe('Expense action wrappers', () => {
  it('approveExpense() POSTs to /expenses/:id/approve with no body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'exp-1', currentState: 'APPROVED' }) });
    global.fetch = fetchMock;

    await approveExpense('token', 'exp-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/expenses/exp-1/approve');
    expect(JSON.parse(init.body as string)).toEqual({});
  });

  it('rejectExpense() POSTs the reason', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'exp-1', currentState: 'REJECTED' }) });
    global.fetch = fetchMock;

    await rejectExpense('token', 'exp-1', { reason: 'Not budgeted' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/expenses/exp-1/reject');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'Not budgeted' });
  });

  it('payExpense() POSTs to /expenses/:id/pay with no body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'exp-1', currentState: 'PAID' }) });
    global.fetch = fetchMock;

    await payExpense('token', 'exp-1');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/expenses/exp-1/pay');
  });
});

/** `[Bank Deposit Confirmation milestone]` */
describe('confirmBankDeposit', () => {
  it('POSTs to /bank-deposit-confirmations with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'bdc-1' }) });
    global.fetch = fetchMock;

    await confirmBankDeposit('token', { groupId: 'group-1', weekStartDate: '2026-01-05', depositedAmountMinor: '50000' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/bank-deposit-confirmations');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ groupId: 'group-1', weekStartDate: '2026-01-05', depositedAmountMinor: '50000' });
  });

  it('rejects with an ApiError carrying the server-provided duplicate-confirmation reason on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "A bank deposit confirmation already exists for group 'group-1' for the week starting '2026-01-05'" }),
    });

    const error = (await confirmBankDeposit('token', { groupId: 'group-1', weekStartDate: '2026-01-05', depositedAmountMinor: '50000' }).catch(
      (e) => e,
    )) as { status: number; body: unknown };

    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({ message: expect.stringContaining('already exists') });
  });

  it('rejects with an ApiError carrying the server-provided authorization/denial reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'stewardship.bank_deposit.confirm' to role 'RESIDENT_PASTOR'" }),
    });

    const error = (await confirmBankDeposit('token', { groupId: 'group-1', weekStartDate: '2026-01-05', depositedAmountMinor: '50000' }).catch(
      (e) => e,
    )) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('stewardship.bank_deposit.confirm') });
  });
});
