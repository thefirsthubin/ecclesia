import {
  checkInboundTransactionTransition,
  checkOutboundTransactionTransition,
  isInboundTransactionState,
  isOutboundTransactionState,
} from './financial-transaction-status';

describe('isInboundTransactionState / isOutboundTransactionState', () => {
  it('recognizes every modeled state and rejects unknown strings', () => {
    expect(isInboundTransactionState('RECORDED')).toBe(true);
    expect(isInboundTransactionState('RECONCILED')).toBe(true);
    expect(isInboundTransactionState('REQUESTED')).toBe(false);
    expect(isOutboundTransactionState('REQUESTED')).toBe(true);
    expect(isOutboundTransactionState('RECORDED')).toBe(false);
  });
});

describe('checkInboundTransactionTransition (PRD §12.7 inbound sub-flow)', () => {
  it('allows RECORDED -> VERIFIED (FR-STW-03)', () => {
    expect(checkInboundTransactionTransition('RECORDED', 'VERIFIED').allowed).toBe(true);
  });

  it('allows RECORDED -> FLAGGED (FR-STW-04)', () => {
    expect(checkInboundTransactionTransition('RECORDED', 'FLAGGED').allowed).toBe(true);
  });

  it('allows FLAGGED -> VERIFIED (discrepancy resolved) and FLAGGED -> UNDER_INVESTIGATION (unresolved past SLA)', () => {
    expect(checkInboundTransactionTransition('FLAGGED', 'VERIFIED').allowed).toBe(true);
    expect(checkInboundTransactionTransition('FLAGGED', 'UNDER_INVESTIGATION').allowed).toBe(true);
  });

  it('allows UNDER_INVESTIGATION -> VERIFIED', () => {
    expect(checkInboundTransactionTransition('UNDER_INVESTIGATION', 'VERIFIED').allowed).toBe(true);
  });

  it('allows VERIFIED -> RECONCILED', () => {
    expect(checkInboundTransactionTransition('VERIFIED', 'RECONCILED').allowed).toBe(true);
  });

  it('rejects RECONCILED as a source state - it is terminal', () => {
    const result = checkInboundTransactionTransition('RECONCILED', 'VERIFIED');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/terminal/);
  });

  it('rejects skipping straight from RECORDED to RECONCILED', () => {
    expect(checkInboundTransactionTransition('RECORDED', 'RECONCILED').allowed).toBe(false);
  });

  it('rejects a same-state "transition"', () => {
    const result = checkInboundTransactionTransition('RECORDED', 'RECORDED');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/already the current state/);
  });
});

describe('checkOutboundTransactionTransition (PRD §12.7 outbound/Expense sub-flow)', () => {
  it('allows REQUESTED -> APPROVED and REQUESTED -> REJECTED', () => {
    expect(checkOutboundTransactionTransition('REQUESTED', 'APPROVED').allowed).toBe(true);
    expect(checkOutboundTransactionTransition('REQUESTED', 'REJECTED').allowed).toBe(true);
  });

  it('allows APPROVED -> PAID -> RECEIPT_RETAINED', () => {
    expect(checkOutboundTransactionTransition('APPROVED', 'PAID').allowed).toBe(true);
    expect(checkOutboundTransactionTransition('PAID', 'RECEIPT_RETAINED').allowed).toBe(true);
  });

  it('rejects REJECTED as a source state - it is terminal', () => {
    expect(checkOutboundTransactionTransition('REJECTED', 'APPROVED').allowed).toBe(false);
  });

  it('rejects skipping APPROVED to go straight to RECEIPT_RETAINED', () => {
    expect(checkOutboundTransactionTransition('APPROVED', 'RECEIPT_RETAINED').allowed).toBe(false);
  });
});
