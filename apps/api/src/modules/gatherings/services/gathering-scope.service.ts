import { Injectable, NotFoundException } from '@nestjs/common';

import { GatheringRepository } from '../repositories/gathering.repository';

export interface GatheringScope {
  branchId: string;
  /** `[Milestone A: Financial + Gathering Backend Foundation]` The
   * Gathering's own `ownerGroupId` (null for a Branch-wide Gathering like
   * Sunday/Midweek Service) - added so `FinancialTransactionService.record()`
   * can enforce "a transaction's `sourceGroupId`, if also set, must match
   * the Gathering it claims to have been given at" without reaching into
   * `GatheringRepository`/Prisma directly. Additive to the existing
   * `branchId`-only shape - `StaffingTargetService.create()`, this
   * interface's original and only other consumer, only ever read
   * `.branchId` and is unaffected. */
  ownerGroupId: string | null;
}

/**
 * Gatherings' public service interface (Blueprint §7.2) - extracted for
 * the Ministry milestone, the first cross-module consumer of Gathering
 * data. `StaffingTargetService.create()` (FR-MIN-02) needs to confirm the
 * `gatheringId` a Basonta Leader supplies actually exists, and belongs to
 * the same Branch as the target Basonta, before writing a `StaffingTarget`
 * row - the same "validate the cross-module reference before insert"
 * discipline `PledgeService.fulfill()` and `ExpenseService` already apply
 * to their own cross-entity references. `FinancialTransactionService.record()`
 * (Milestone A) is this service's second consumer, for the same class of
 * "validate the cross-module reference before insert" reason, plus the
 * `ownerGroupId`-consistency check above. Deliberately returns a small,
 * explicit shape, not a full `ResourceContext` - unlike `GroupScopeService`,
 * this is not used for RBAC scope resolution (a `StaffingTarget`'s/
 * `FinancialTransaction`'s own scope is resolved via `GroupScopeService` as
 * normal), only for existence-plus-consistency validation.
 */
@Injectable()
export class GatheringScopeService {
  constructor(private readonly gatheringRepository: GatheringRepository) {}

  async loadScope(gatheringId: string): Promise<GatheringScope> {
    const gathering = await this.gatheringRepository.findById(gatheringId);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${gatheringId}'`);
    }
    return { branchId: gathering.branchId, ownerGroupId: gathering.ownerGroupId };
  }
}
