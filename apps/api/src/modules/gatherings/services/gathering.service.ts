import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkGatheringStatusTransition } from '@ecclesia/domain-gatherings';
import type { CreateGatheringInput, GatheringResponseDto, UpdateGatheringInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import { Prisma } from '@prisma/client';
import type { Gathering } from '@prisma/client';

import { GatheringRepository } from '../repositories/gathering.repository';

function toResponseDto(gathering: Gathering): GatheringResponseDto {
  return {
    id: gathering.id,
    branchId: gathering.branchId,
    ownerGroupId: gathering.ownerGroupId,
    seriesId: gathering.seriesId,
    type: gathering.type,
    scheduledStart: gathering.scheduledStart.toISOString(),
    scheduledEnd: gathering.scheduledEnd ? gathering.scheduledEnd.toISOString() : null,
    venue: gathering.venue,
    status: gathering.status,
    config: (gathering.config as Record<string, unknown> | null) ?? null,
    createdByPersonId: gathering.createdByPersonId,
    createdAt: gathering.createdAt.toISOString(),
    updatedAt: gathering.updatedAt.toISOString(),
  };
}

/**
 * FR-GTH-01/§12.4: create/read/update a single Gathering instance
 * (standalone, or as part of a series via `seriesId`). See
 * `libs/domain/gatherings/gathering-status.ts` for the `[INFERRED]`
 * forward-only status model this validates transitions against.
 */
@Injectable()
export class GatheringService {
  constructor(private readonly gatheringRepository: GatheringRepository) {}

  async create(actor: ActorContext, input: CreateGatheringInput): Promise<GatheringResponseDto> {
    const gathering = await this.gatheringRepository.create({
      branchId: actor.branchId,
      type: input.type,
      ownerGroupId: input.ownerGroupId,
      seriesId: input.seriesId,
      scheduledStart: new Date(input.scheduledStart),
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
      venue: input.venue,
      config: input.config as Prisma.InputJsonValue | undefined,
      createdByPersonId: actor.personId,
    });
    return toResponseDto(gathering);
  }

  async getById(id: string): Promise<GatheringResponseDto> {
    const gathering = await this.gatheringRepository.findById(id);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${id}'`);
    }
    return toResponseDto(gathering);
  }

  /** §12.4's edge case: cancelling/completing one instance never alters
   * its series definition - this only ever touches the single
   * `Gathering` row identified by `id`. */
  async update(id: string, input: UpdateGatheringInput): Promise<GatheringResponseDto> {
    const existing = await this.gatheringRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No Gathering found with id '${id}'`);
    }

    if (input.status) {
      const check = checkGatheringStatusTransition(existing.status, input.status);
      if (!check.allowed) {
        throw new ConflictException(check.reason);
      }
    }

    const gathering = await this.gatheringRepository.update(id, {
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      scheduledEnd: input.scheduledEnd === undefined ? undefined : input.scheduledEnd ? new Date(input.scheduledEnd) : null,
      venue: input.venue,
      status: input.status,
      // Prisma's own quirk for nullable Json columns: a literal `null`
      // does not mean "clear this field" the way it does for every other
      // column - it has to be the `Prisma.JsonNull` sentinel instead, or
      // Prisma writes a JSON `null` *value* rather than a SQL `NULL`. See
      // `GatheringRepository`'s `UpdateGatheringRecord.config` type,
      // which is typed against exactly this sentinel.
      config:
        input.config === undefined
          ? undefined
          : input.config === null
            ? Prisma.JsonNull
            : (input.config as Prisma.InputJsonValue),
    });
    return toResponseDto(gathering);
  }
}
