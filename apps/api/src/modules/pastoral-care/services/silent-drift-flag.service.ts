import { Injectable } from '@nestjs/common';
import type { ListSilentDriftFlagsForActorQuery, SilentDriftFlagResponseDto, SilentDriftStatusDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { SilentDriftFlag, SilentDriftStatus } from '@prisma/client';

import { SilentDriftFlagRepository } from '../repositories/silent-drift-flag.repository';

function toResponseDto(flag: SilentDriftFlag): SilentDriftFlagResponseDto {
  return {
    id: flag.id,
    branchId: flag.branchId,
    groupId: flag.groupId,
    personId: flag.personId,
    attendanceMissedCount: flag.attendanceMissedCount,
    attendanceThreshold: flag.attendanceThreshold,
    bacentaMissedCount: flag.bacentaMissedCount,
    bacentaThreshold: flag.bacentaThreshold,
    status: flag.status,
    assignedShepherdPersonId: flag.assignedShepherdPersonId,
    resolvedAt: flag.resolvedAt ? flag.resolvedAt.toISOString() : null,
    escalatedAt: flag.escalatedAt ? flag.escalatedAt.toISOString() : null,
    createdAt: flag.createdAt.toISOString(),
  };
}

/**
 * FR-PC-05/§15.8: read-only access to the Silent Drift flags
 * `apps/worker`'s nightly sweep writes. US-G3's own acceptance criterion
 * ("the specific attendance pattern behind the flag is shown, not a
 * generic risk label") is satisfied structurally here - `toResponseDto`
 * passes through `attendanceMissedCount`/`attendanceThreshold`/
 * `bacentaMissedCount`/`bacentaThreshold` unchanged rather than
 * collapsing them into a boolean "at risk" flag.
 */
@Injectable()
export class SilentDriftFlagService {
  constructor(private readonly silentDriftFlagRepository: SilentDriftFlagRepository) {}

  async listForGroup(groupId: string, statuses?: SilentDriftStatusDto[]): Promise<SilentDriftFlagResponseDto[]> {
    const flags = await this.silentDriftFlagRepository.listByGroup(groupId, statuses as SilentDriftStatus[] | undefined);
    return flags.map(toResponseDto);
  }

  /** `[Silent-Drift Detection Branch-wide milestone]` `GET
   * /pastoral-care/silent-drift-flags`. `query.groupId` present -> same
   * Group-scoped read `listForGroup` already does; absent -> for a
   * CLUSTER-scoped actor (Assistant Pastor), narrowed to
   * `actor.clusterBacentaIds` (`[Milestone C]` Phase 1 decision #11's
   * fix, byte-for-byte the same shape `FollowUpTaskService.list` now
   * establishes); otherwise BRANCH-wide, for the BRANCH-scoped actor
   * `SilentDriftFlagListForActorResourceContextGuard` already resolved
   * against `actor.branchId`. */
  async list(actor: ActorContext, query: ListSilentDriftFlagsForActorQuery): Promise<SilentDriftFlagResponseDto[]> {
    const statuses = query.status as SilentDriftStatus[] | undefined;
    let flags: SilentDriftFlag[];
    if (query.groupId) {
      flags = await this.silentDriftFlagRepository.listByGroup(query.groupId, statuses);
    } else if (actor.clusterBacentaIds && actor.clusterBacentaIds.length > 0) {
      flags = await this.silentDriftFlagRepository.listByGroups(actor.clusterBacentaIds, statuses);
    } else {
      flags = await this.silentDriftFlagRepository.listByBranch(actor.branchId, statuses);
    }
    return flags.map(toResponseDto);
  }
}
