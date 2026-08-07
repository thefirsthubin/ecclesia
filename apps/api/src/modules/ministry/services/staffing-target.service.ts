import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { computeStaffingAdequacy } from '@ecclesia/domain-ministry';
import type { CreateStaffingTargetInput, StaffingTargetResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { StaffingTarget } from '@prisma/client';

import { GatheringScopeService } from '../../gatherings/services/gathering-scope.service';
import { GroupRosterService } from '../../people/services/group-roster.service';
import { StaffingTargetRepository } from '../repositories/staffing-target.repository';

/**
 * FR-MIN-02/03: `create()` sets (or, via the repository's upsert,
 * corrects) a staffing target; every read embeds the live-computed
 * adequacy ratio (FR-MIN-03), "compute-on-read" the same way Insights'
 * `PulseScoreService` already established for Church Pulse.
 */
@Injectable()
export class StaffingTargetService {
  constructor(
    private readonly staffingTargetRepository: StaffingTargetRepository,
    private readonly gatheringScopeService: GatheringScopeService,
    private readonly groupRosterService: GroupRosterService,
  ) {}

  async create(actor: ActorContext, input: CreateStaffingTargetInput): Promise<StaffingTargetResponseDto> {
    const gatheringScope = await this.gatheringScopeService.loadScope(input.gatheringId);
    if (gatheringScope.branchId !== actor.branchId) {
      throw new ConflictException(`Gathering '${input.gatheringId}' does not belong to this Branch`);
    }

    const target = await this.staffingTargetRepository.upsert({
      branchId: actor.branchId,
      gatheringId: input.gatheringId,
      groupId: input.groupId,
      targetCount: input.targetCount,
      createdByPersonId: actor.personId,
    });
    return this.toResponseDto(target);
  }

  async getById(id: string): Promise<StaffingTargetResponseDto> {
    const target = await this.requireTarget(id);
    return this.toResponseDto(target);
  }

  /**
   * `[Remaining Engineering Sprint, Milestone 11]` Backs the new
   * "Staffing Overview" list endpoint - every Staffing Target set against
   * a given Basonta, each with the same live-computed adequacy every
   * single-record read already gets. Additive: `create`/`getById` above
   * are byte-for-byte unchanged.
   */
  async listByGroup(groupId: string): Promise<StaffingTargetResponseDto[]> {
    const targets = await this.staffingTargetRepository.findByGroupId(groupId);
    return Promise.all(targets.map((target) => this.toResponseDto(target)));
  }

  private async toResponseDto(target: StaffingTarget): Promise<StaffingTargetResponseDto> {
    const rosteredCount = await this.groupRosterService.countActiveMembers(target.groupId);
    const adequacy = computeStaffingAdequacy(target.targetCount, rosteredCount);
    return {
      id: target.id,
      branchId: target.branchId,
      gatheringId: target.gatheringId,
      groupId: target.groupId,
      targetCount: target.targetCount,
      rosteredCount: adequacy.rosteredCount,
      ratio: adequacy.ratio,
      isAdequate: adequacy.isAdequate,
      createdByPersonId: target.createdByPersonId,
      createdAt: target.createdAt.toISOString(),
      updatedAt: target.updatedAt.toISOString(),
    };
  }

  private async requireTarget(id: string): Promise<StaffingTarget> {
    const target = await this.staffingTargetRepository.findById(id);
    if (!target) {
      throw new NotFoundException(`No Staffing Target found with id '${id}'`);
    }
    return target;
  }
}
