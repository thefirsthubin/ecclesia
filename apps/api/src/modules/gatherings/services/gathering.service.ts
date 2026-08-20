import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkGatheringStatusTransition } from '@ecclesia/domain-gatherings';
import type { CreateGatheringInput, GatheringResponseDto, ListGatheringsQuery, UpdateGatheringInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import { Prisma } from '@prisma/client';
import type { Gathering } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';
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
  constructor(
    private readonly gatheringRepository: GatheringRepository,
    private readonly prisma: PrismaService,
  ) {}

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
   * supplied. `query.ownerGroupId` present -> Group-scoped; `query.council`
   * -> every Branch in the actor's own Council (`[Post-Milestone D —
   * Portal Experiences follow-up]`, see below); otherwise BRANCH-wide
   * against `actor.branchId`, resolved the same way
   * `GatheringListResourceContextGuard` already decided which case this
   * request was.
   *
   * **`council=true`**: the same `runInBranchScope`-per-`councilBranchIds`
   * loop `GivingTrendService.getTrend`'s own `query.council` branch
   * establishes, reused here rather than reinvented -
   * `GatheringRepository.listByBranchAndRange` is already a pure
   * `(branchId, ...) => Gathering[]` call, the exact shape that loop
   * composes against. Unlike the bucketed trend endpoints, the response
   * stays a flat `GatheringResponseDto[]` (not a `{councilBranches: [...]}`
   * wrapper) - every row already carries its own `branchId`
   * (`toResponseDto`), so a Council-wide caller can already attribute
   * each row to its Branch without a new envelope shape, and every
   * existing single-Branch consumer of this endpoint's response type is
   * unaffected. */
  async list(actor: ActorContext, query: ListGatheringsQuery): Promise<GatheringResponseDto[]> {
    if (query.council && query.ownerGroupId) {
      throw new BadRequestException('Supply at most one of council or ownerGroupId, not both');
    }

    const now = new Date();
    const from = query.from ? new Date(query.from) : now;
    const to = query.to ? new Date(query.to) : new Date(now.getTime() + DEFAULT_LIST_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    if (query.council) {
      if (!actor.councilBranchIds || actor.councilBranchIds.length === 0) {
        throw new BadRequestException('This actor has no Council scope to aggregate across');
      }
      const gatherings: Gathering[] = [];
      // Sequential, not `Promise.all` - same "N sequential connections,
      // not N simultaneous ones" discipline `PrismaService.runInCouncilScope`'s
      // own doc comment establishes for this exact shape of loop.
      for (const branchId of actor.councilBranchIds) {
        const branchGatherings = await this.prisma.runInBranchScope(branchId, () => this.gatheringRepository.listByBranchAndRange(branchId, from, to, query.type));
        gatherings.push(...branchGatherings);
      }
      return gatherings.map(toResponseDto);
    }

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
