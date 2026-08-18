import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkGatheringStatusTransition } from '@ecclesia/domain-gatherings';
import type { CreateGatheringInput, GatheringResponseDto, ListGatheringsQuery, UpdateGatheringInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import { Prisma } from '@prisma/client';
import type { Gathering } from '@prisma/client';

import { GatheringRepository } from '../repositories/gathering.repository';

/** `listForGroup`'s default window when the caller supplies no explicit
 * `from`/`to` - "now through 30 days out," wide enough to always contain
 * the next scheduled Bacenta Meeting for any reasonable recurrence
 * cadence (weekly at minimum, per §12.4's named gathering types) without
 * returning unbounded history. */
const DEFAULT_LIST_WINDOW_DAYS = 30;

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
    preacherPersonId: gathering.preacherPersonId,
    message: gathering.message,
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
      preacherPersonId: input.preacherPersonId,
      message: input.message,
      config: input.config as Prisma.InputJsonValue | undefined,
      createdByPersonId: actor.personId,
    });
    return toResponseDto(gathering);
  }

  /** `GET /gatherings` (Shepherd Dashboard sprint's `ownerGroupId` case,
   * Gatherings Web Admin sprint's BRANCH-wide case - see
   * `GatheringRepository.listByGroupAndRange`/`listByBranchAndRange`'s own
   * doc comments). Caller supplies an explicit `from`/`to` to look
   * backward (e.g. "last past Bacenta Meeting," the Attendance Summary
   * card) or forward (e.g. "next upcoming meeting," the Today's Meeting
   * card, or the web-admin calendar's default view) - this service only
   * fills in the default forward-looking window when neither is
   * supplied. `query.ownerGroupId` present -> Group-scoped; absent ->
   * BRANCH-wide against `actor.branchId`, resolved the same way
   * `GatheringListResourceContextGuard` already decided which case this
   * request was. */
  async list(actor: ActorContext, query: ListGatheringsQuery): Promise<GatheringResponseDto[]> {
    const now = new Date();
    const from = query.from ? new Date(query.from) : now;
    const to = query.to ? new Date(query.to) : new Date(now.getTime() + DEFAULT_LIST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const gatherings = query.ownerGroupId
      ? await this.gatheringRepository.listByGroupAndRange(query.ownerGroupId, from, to, query.type)
      : await this.gatheringRepository.listByBranchAndRange(actor.branchId, from, to, query.type);
    return gatherings.map(toResponseDto);
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
      preacherPersonId: input.preacherPersonId,
      message: input.message,
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
