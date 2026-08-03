import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../platform/database/prisma.service';

export interface FlaggedTransactionCandidate {
  id: string;
  sourceGroupId: string | null;
  giverPersonId: string | null;
  /** `occurredAt` of the most recent `FinancialTransactionEvent` whose
   * `toState` is `'FLAGGED'` - see `listFlaggedWithFlaggedAt`'s own doc
   * comment for why "most recent" rather than "first". */
  flaggedAt: Date;
}

/**
 * apps/worker's own Prisma-backed queries for the
 * flagged-transaction-sla-sweep - see `FlaggedTransactionSlaSweepJob`'s own
 * doc comment for why this job never mutates `FinancialTransaction` (only
 * publishes a signal), and `WORKER_DESIGN_NOTES.md` for the "own
 * repository, not a cross-app import" rationale shared with every other
 * worker-side repository.
 */
@Injectable()
export class FlaggedTransactionSlaSweepRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every currently-`FLAGGED` Financial Transaction in a Branch, alongside
   * the timestamp it most recently entered that state
   * (`FinancialTransactionEvent.toState: 'FLAGGED'`, ordered `desc`,
   * `take: 1`). "Most recent" rather than `FinancialTransactionRepository.
   * findFirstEventByToState`'s "first" (`orderBy: 'asc'`) is deliberate
   * here: `libs/domain/stewardship`'s inbound transitions allow
   * `FLAGGED -> VERIFIED -> ` (a resolved discrepancy) and there is no
   * transition back into `RECORDED`, but a fresh re-flag after
   * `UNDER_INVESTIGATION -> VERIFIED` is not modeled either - so in
   * practice a transaction can only ever have entered `FLAGGED` once in
   * this codebase's current state machine, making "first" and "most
   * recent" equivalent today. "Most recent" is used anyway as the more
   * defensively-correct choice if that ever changes, at zero extra cost.
   */
  async listFlaggedWithFlaggedAt(branchId: string): Promise<FlaggedTransactionCandidate[]> {
    const transactions = await this.prisma.financialTransaction.findMany({
      where: { branchId, currentState: 'FLAGGED' },
      include: {
        events: {
          where: { toState: 'FLAGGED' },
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
    });
    return transactions
      .filter((transaction) => transaction.events.length > 0)
      .map((transaction) => ({
        id: transaction.id,
        sourceGroupId: transaction.sourceGroupId,
        giverPersonId: transaction.giverPersonId,
        flaggedAt: transaction.events[0].occurredAt,
      }));
  }
}
