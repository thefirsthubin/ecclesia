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
    gatheringId: null,
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
      sumVerifiedAmountForBranch: jest.fn(),
      sumVerifiedAmountByGroupForRange: jest.fn(),
    };
    const eventPublisher = { publish: jest.fn() };
    const gatheringScopeService = { loadScope: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new FinancialTransactionService(financialTransactionRepository as never, eventPublisher as never, gatheringScopeService as never, prisma as never);
    return { service, financialTransactionRepository, eventPublisher, gatheringScopeService, prisma };
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

    it('[Milestone A] passes gatheringId through to createWithEvent when the Gathering is valid and consistent', async () => {
      const { service, financialTransactionRepository, gatheringScopeService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-1', ownerGroupId: 'bacenta-1' });
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction({ gatheringId: 'gathering-1' }));

      await service.record(bacentaLeader, {
        type: 'OFFERING',
        sourceGroupId: 'bacenta-1',
        gatheringId: 'gathering-1',
        channel: 'CASH',
        amountMinor: '5000',
      } as never);

      expect(gatheringScopeService.loadScope).toHaveBeenCalledWith('gathering-1');
      expect(financialTransactionRepository.createWithEvent).toHaveBeenCalledWith(expect.objectContaining({ gatheringId: 'gathering-1' }));
    });

    it('[Milestone A] allows gatheringId with no sourceGroupId (Branch-wide Sunday/Midweek Gathering)', async () => {
      const { service, financialTransactionRepository, gatheringScopeService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-1', ownerGroupId: null });
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction({ sourceGroupId: null, gatheringId: 'sunday-1' }));

      await service.record(treasurer, { type: 'OFFERING', gatheringId: 'sunday-1', channel: 'CASH', amountMinor: '5000' } as never);

      expect(financialTransactionRepository.createWithEvent).toHaveBeenCalledWith(expect.objectContaining({ gatheringId: 'sunday-1' }));
    });

    it('[Milestone A] allows a Bacenta collection folded into a Branch-wide Gathering (ownerGroupId null, sourceGroupId set)', async () => {
      const { service, financialTransactionRepository, gatheringScopeService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-1', ownerGroupId: null });
      financialTransactionRepository.findUserIdByPersonId.mockResolvedValue('user-1');
      financialTransactionRepository.createWithEvent.mockResolvedValue(buildTransaction({ gatheringId: 'sunday-1' }));

      await expect(
        service.record(treasurer, { type: 'OFFERING', sourceGroupId: 'bacenta-1', gatheringId: 'sunday-1', channel: 'CASH', amountMinor: '5000' } as never),
      ).resolves.toBeDefined();
    });

    it('[Milestone A] rejects a Gathering that belongs to a different Branch', async () => {
      const { service, gatheringScopeService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-OTHER', ownerGroupId: null });

      await expect(
        service.record(treasurer, { type: 'OFFERING', gatheringId: 'foreign-gathering', channel: 'CASH', amountMinor: '5000' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('[Milestone A] rejects when the Gathering\'s ownerGroupId does not match sourceGroupId (cross-Bacenta attribution)', async () => {
      const { service, gatheringScopeService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-1', ownerGroupId: 'bacenta-OTHER' });

      await expect(
        service.record(bacentaLeader, {
          type: 'OFFERING',
          sourceGroupId: 'bacenta-1',
          gatheringId: 'someone-elses-meeting',
          channel: 'CASH',
          amountMinor: '5000',
        } as never),
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

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'RECORDED', undefined, undefined);
      expect(result[0].recordedByPersonId).toBeNull();
    });

    it('[Stewardship gaps sprint] narrows to the actor\'s own Bacenta when actor.bacentaId is set (BACENTA_LEADER list view)', async () => {
      const { service, financialTransactionRepository } = buildService();
      const bacentaLeaderWithGroup: ActorContext = { ...bacentaLeader, bacentaId: 'bacenta-1' };
      financialTransactionRepository.findManyByBranch.mockResolvedValue([buildTransaction()]);

      await service.listByBranch(bacentaLeaderWithGroup, 'RECORDED');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'RECORDED', undefined, 'bacenta-1');
    });

    it('[Milestone A] actor.bacentaId wins over an explicit sourceGroupId query param', async () => {
      const { service, financialTransactionRepository } = buildService();
      const bacentaLeaderWithGroup: ActorContext = { ...bacentaLeader, bacentaId: 'bacenta-1' };
      financialTransactionRepository.findManyByBranch.mockResolvedValue([]);

      await service.listByBranch(bacentaLeaderWithGroup, 'RECORDED', 'TITHE', 'someone-elses-bacenta');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'RECORDED', 'TITHE', 'bacenta-1');
    });

    it('[Milestone A] passes an explicit sourceGroupId through for a BRANCH-scoped actor with no bacentaId', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.findManyByBranch.mockResolvedValue([]);

      await service.listByBranch(treasurer, undefined, 'OFFERING', 'bacenta-2');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', undefined, 'OFFERING', 'bacenta-2');
    });

    it('[Milestone C, bug fix] narrows to the actor\'s own Basonta when actor.basontaId is set (BASONTA_LEADER list view) - confirmed 403 live before this fix', async () => {
      const { service, financialTransactionRepository } = buildService();
      const basontaLeader: ActorContext = { personId: 'bsl-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };
      financialTransactionRepository.findManyByBranch.mockResolvedValue([buildTransaction()]);

      await service.listByBranch(basontaLeader, 'RECORDED');

      expect(financialTransactionRepository.findManyByBranch).toHaveBeenCalledWith('branch-1', 'RECORDED', undefined, 'basonta-1');
    });
  });

  /** `[Post-Milestone D — Portal Experiences follow-up]` `council=true` -
   * every real Branch in the actor's own Council, one `runInBranchScope`
   * call per Branch, results flattened into one array. */
  describe('listByBranch (council=true)', () => {
    const overseer: ActorContext = { personId: 'overseer-1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };

    it('lists across every Branch in the Council, one runInBranchScope call per Branch, flattened into one array', async () => {
      const { service, financialTransactionRepository, prisma } = buildService();
      financialTransactionRepository.findManyByBranch.mockImplementation((branchId: string) => Promise.resolve([buildTransaction({ id: `ft-${branchId}`, branchId })]));

      const result = await service.listByBranch(overseer, 'VERIFIED', undefined, undefined, true);

      expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
      expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(1, 'branch-1', expect.any(Function));
      expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(2, 'branch-2', expect.any(Function));
      expect(financialTransactionRepository.findManyByBranch).toHaveBeenNthCalledWith(1, 'branch-1', 'VERIFIED', undefined, undefined);
      expect(financialTransactionRepository.findManyByBranch).toHaveBeenNthCalledWith(2, 'branch-2', 'VERIFIED', undefined, undefined);
      expect(result.map((t) => t.id)).toEqual(['ft-branch-1', 'ft-branch-2']);
    });

    it('rejects with a BadRequestException when both council and sourceGroupId are supplied', async () => {
      const { service } = buildService();

      await expect(service.listByBranch(overseer, undefined, undefined, 'bacenta-1', true)).rejects.toThrow('Supply at most one of council or sourceGroupId, not both');
    });

    it('rejects with a BadRequestException when the actor has no Council scope', async () => {
      const { service } = buildService();

      await expect(service.listByBranch(treasurer, undefined, undefined, undefined, true)).rejects.toThrow('This actor has no Council scope to aggregate across');
    });
  });

  describe('sumVerifiedAmountForBranch', () => {
    it('delegates directly to financialTransactionRepository.sumVerifiedAmountForBranch', async () => {
      const { service, financialTransactionRepository } = buildService();
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-09-01T00:00:00.000Z');
      financialTransactionRepository.sumVerifiedAmountForBranch.mockResolvedValue(2450000n);

      const result = await service.sumVerifiedAmountForBranch('branch-1', from, to);

      expect(financialTransactionRepository.sumVerifiedAmountForBranch).toHaveBeenCalledWith('branch-1', from, to, undefined);
      expect(result).toBe(2450000n);
    });

    it('[Milestone A] passes an optional type filter through', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.sumVerifiedAmountForBranch.mockResolvedValue(0n);

      await service.sumVerifiedAmountForBranch('branch-1', new Date(), new Date(), 'TITHE');

      expect(financialTransactionRepository.sumVerifiedAmountForBranch).toHaveBeenCalledWith('branch-1', expect.any(Date), expect.any(Date), 'TITHE');
    });
  });

  describe('[Milestone A] summarize', () => {
    const from = new Date('2026-08-01T00:00:00.000Z');
    const to = new Date('2026-09-01T00:00:00.000Z');

    it('defaults to groupBy "none" and returns one row with sourceGroupId null for a BRANCH-scoped actor', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.sumVerifiedAmountForBranch.mockResolvedValue(12345n);

      const result = await service.summarize(treasurer, from, to);

      expect(financialTransactionRepository.sumVerifiedAmountForBranch).toHaveBeenCalledWith('branch-1', from, to, undefined);
      expect(result).toEqual({
        branchId: 'branch-1',
        from: from.toISOString(),
        to: to.toISOString(),
        type: null,
        groupBy: 'none',
        rows: [{ sourceGroupId: null, totalAmountMinor: '12345' }],
      });
    });

    it('groupBy "group" returns one row per Group', async () => {
      const { service, financialTransactionRepository } = buildService();
      financialTransactionRepository.sumVerifiedAmountByGroupForRange.mockResolvedValue([
        { sourceGroupId: 'bacenta-1', totalAmountMinor: 5000n },
        { sourceGroupId: 'bacenta-2', totalAmountMinor: 7000n },
      ]);

      const result = await service.summarize(treasurer, from, to, 'OFFERING', 'group');

      expect(financialTransactionRepository.sumVerifiedAmountByGroupForRange).toHaveBeenCalledWith('branch-1', from, to, 'OFFERING');
      expect(result.rows).toEqual([
        { sourceGroupId: 'bacenta-1', totalAmountMinor: '5000' },
        { sourceGroupId: 'bacenta-2', totalAmountMinor: '7000' },
      ]);
    });

    it('a Bacenta-scoped actor always gets groupBy "none" narrowed to their own Bacenta, even if "group" was requested', async () => {
      const { service, financialTransactionRepository } = buildService();
      const bacentaLeaderWithGroup: ActorContext = { ...bacentaLeader, bacentaId: 'bacenta-1' };
      financialTransactionRepository.sumVerifiedAmountByGroupForRange.mockResolvedValue([
        { sourceGroupId: 'bacenta-1', totalAmountMinor: 5000n },
        { sourceGroupId: 'bacenta-2', totalAmountMinor: 7000n },
      ]);

      const result = await service.summarize(bacentaLeaderWithGroup, from, to, undefined, 'group');

      expect(result.groupBy).toBe('none');
      expect(result.rows).toEqual([{ sourceGroupId: 'bacenta-1', totalAmountMinor: '5000' }]);
    });

    it('[Milestone C, bug fix] a Basonta-scoped actor always gets groupBy "none" narrowed to their own Basonta, even if "group" was requested', async () => {
      const { service, financialTransactionRepository } = buildService();
      const basontaLeader: ActorContext = { personId: 'bsl-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };
      financialTransactionRepository.sumVerifiedAmountByGroupForRange.mockResolvedValue([
        { sourceGroupId: 'basonta-1', totalAmountMinor: 5000n },
        { sourceGroupId: 'basonta-2', totalAmountMinor: 7000n },
      ]);

      const result = await service.summarize(basontaLeader, from, to, undefined, 'group');

      expect(result.groupBy).toBe('none');
      expect(result.rows).toEqual([{ sourceGroupId: 'basonta-1', totalAmountMinor: '5000' }]);
    });

    it('a Bacenta-scoped actor with no matching row gets a zeroed row, not an empty array', async () => {
      const { service, financialTransactionRepository } = buildService();
      const bacentaLeaderWithGroup: ActorContext = { ...bacentaLeader, bacentaId: 'bacenta-1' };
      financialTransactionRepository.sumVerifiedAmountByGroupForRange.mockResolvedValue([]);

      const result = await service.summarize(bacentaLeaderWithGroup, from, to);

      expect(result.rows).toEqual([{ sourceGroupId: 'bacenta-1', totalAmountMinor: '0' }]);
    });
  });
});
