import { Injectable, NotFoundException } from '@nestjs/common';

import { GatheringRepository } from '../repositories/gathering.repository';

export interface GatheringScope {
  branchId: string;
}

/**
 * Gatherings' public service interface (Blueprint §7.2) - extracted for
 * the Ministry milestone, the first cross-module consumer of Gathering
 * data. `StaffingTargetService.create()` (FR-MIN-02) needs to confirm the
 * `gatheringId` a Basonta Leader supplies actually exists, and belongs to
 * the same Branch as the target Basonta, before writing a `StaffingTarget`
 * row - the same "validate the cross-module reference before insert"
 * discipline `PledgeService.fulfill()` and `ExpenseService` already apply
 * to their own cross-entity references. Deliberately returns only
 * `branchId`, not a full `ResourceContext` - unlike `GroupScopeService`,
 * this is not used for RBAC scope resolution (a `StaffingTarget`'s scope
 * is its target Group, resolved via `GroupScopeService` as normal), only
 * for existence-plus-branch-match validation.
 */
@Injectable()
export class GatheringScopeService {
  constructor(private readonly gatheringRepository: GatheringRepository) {}

  async loadScope(gatheringId: string): Promise<GatheringScope> {
    const gathering = await this.gatheringRepository.findById(gatheringId);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${gatheringId}'`);
    }
    return { branchId: gathering.branchId };
  }
}
