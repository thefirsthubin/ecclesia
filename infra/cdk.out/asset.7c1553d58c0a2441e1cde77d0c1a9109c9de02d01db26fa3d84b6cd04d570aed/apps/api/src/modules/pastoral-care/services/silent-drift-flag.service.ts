import { Injectable } from '@nestjs/common';
import type { SilentDriftFlagResponseDto, SilentDriftStatusDto } from '@ecclesia/contracts';
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
}
