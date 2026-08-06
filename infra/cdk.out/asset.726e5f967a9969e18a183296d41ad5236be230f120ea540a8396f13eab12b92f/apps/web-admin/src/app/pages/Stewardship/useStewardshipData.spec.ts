import {
  approveExpense,
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
