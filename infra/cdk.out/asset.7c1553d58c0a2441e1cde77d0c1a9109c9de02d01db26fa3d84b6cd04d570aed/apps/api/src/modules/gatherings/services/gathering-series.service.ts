import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateGatheringSeriesInput, GatheringSeriesResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { GatheringSeries } from '@prisma/client';

import { GatheringSeriesRepository } from '../repositories/gathering-series.repository';

function toResponseDto(series: GatheringSeries): GatheringSeriesResponseDto {
  return {
    id: series.id,
    branchId: series.branchId,
    groupId: series.groupId,
    type: series.type,
    recurrenceRule: series.recurrenceRule,
    startDate: series.startDate.toISOString().slice(0, 10),
    endDate: series.endDate ? series.endDate.toISOString().slice(0, 10) : null,
    createdByPersonId: series.createdByPersonId,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
  };
}

/**
 * FR-GTH-02: "define recurring series; manage individual instance
 * exceptions." This service only creates/reads the series definition
 * itself - it does not auto-generate dated `Gathering` instances from
 * `recurrenceRule` (see `libs/domain/gatherings/README.md`'s "what this
 * library deliberately does not do" and
 * `GATHERINGS_DESIGN_NOTES.md`). Instances are created explicitly via
 * `GatheringService.create`, optionally referencing this series'
 * `seriesId` - which is exactly what §12.4's edge case requires ("any one
 * of which can be individually cancelled ... without altering the series
 * definition").
 */
@Injectable()
export class GatheringSeriesService {
  constructor(private readonly gatheringSeriesRepository: GatheringSeriesRepository) {}

  async create(actor: ActorContext, input: CreateGatheringSeriesInput): Promise<GatheringSeriesResponseDto> {
    const series = await this.gatheringSeriesRepository.create({
      branchId: actor.branchId,
      type: input.type,
      groupId: input.groupId,
      recurrenceRule: input.recurrenceRule,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      createdByPersonId: actor.personId,
    });
    return toResponseDto(series);
  }

  async getById(id: string): Promise<GatheringSeriesResponseDto> {
    const series = await this.gatheringSeriesRepository.findById(id);
    if (!series) {
      throw new NotFoundException(`No Gathering series found with id '${id}'`);
    }
    return toResponseDto(series);
  }
}
