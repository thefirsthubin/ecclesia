import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';
import type { CreateOutreachInput, ListOutreachQuery, OutreachResponseDto } from '@ecclesia/contracts';
import type { Outreach } from '@prisma/client';

import { OutreachRepository } from '../repositories/outreach.repository';

function toResponseDto(outreach: Outreach): OutreachResponseDto {
  return {
    id: outreach.id,
    branchId: outreach.branchId,
    groupId: outreach.groupId,
    occurredAt: outreach.occurredAt.toISOString(),
    location: outreach.location,
    leaderPersonId: outreach.leaderPersonId,
    notes: outreach.notes,
    createdByPersonId: outreach.createdByPersonId,
    createdAt: outreach.createdAt.toISOString(),
  };
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Orchestrates
 * the Outreach event use cases - see MILESTONE_B_DESIGN_NOTES.md Part 4
 * for the full design.
 */
@Injectable()
export class OutreachService {
  constructor(private readonly outreachRepository: OutreachRepository) {}

  async create(actor: ActorContext, input: CreateOutreachInput): Promise<OutreachResponseDto> {
    const outreach = await this.outreachRepository.create({
      branchId: actor.branchId,
      groupId: input.groupId,
      occurredAt: new Date(input.occurredAt),
      location: input.location,
      leaderPersonId: input.leaderPersonId,
      notes: input.notes,
      createdByPersonId: actor.personId,
    });
    return toResponseDto(outreach);
  }

  /** `GET /outreach` - `query.groupId` present -> one Group's own
   * history; absent -> BRANCH/CLUSTER-wide, mirroring
   * `GatheringService.list`/`FollowUpTaskService.list`'s identical
   * shape. */
  async list(actor: ActorContext, query: ListOutreachQuery): Promise<OutreachResponseDto[]> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const outreaches = query.groupId
      ? await this.outreachRepository.listByGroup(query.groupId, from, to)
      : await this.outreachRepository.listByBranch(actor.branchId, from, to);
    return outreaches.map(toResponseDto);
  }

  async getById(id: string): Promise<OutreachResponseDto> {
    const outreach = await this.outreachRepository.findById(id);
    if (!outreach) {
      throw new NotFoundException(`No Outreach found with id '${id}'`);
    }
    return toResponseDto(outreach);
  }
}
