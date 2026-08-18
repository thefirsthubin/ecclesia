import { Injectable } from '@nestjs/common';
import type { MemberInteraction, MemberInteractionType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateMemberInteractionRecord {
  branchId: string;
  personId: string;
  pastorPersonId: string;
  type: MemberInteractionType;
  occurredAt: Date;
  scheduledAt?: Date;
  briefNote?: string;
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Prisma-backed
 * persistence for `pastoral_care.member_interactions` - see
 * MILESTONE_B_DESIGN_NOTES.md Part 9.
 */
@Injectable()
export class MemberInteractionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateMemberInteractionRecord): Promise<MemberInteraction> {
    return this.prisma.memberInteraction.create({
      data: {
        branchId: input.branchId,
        personId: input.personId,
        pastorPersonId: input.pastorPersonId,
        type: input.type,
        occurredAt: input.occurredAt,
        scheduledAt: input.scheduledAt,
        briefNote: input.briefNote,
      },
    });
  }

  /** Organizational scope, not author-filtered - matches
   * `CounsellingSessionRepository.listByPerson`'s own precedent. */
  listByPerson(personId: string): Promise<MemberInteraction[]> {
    return this.prisma.memberInteraction.findMany({
      where: { personId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** `[Milestone B, Slice 7 - Pastoral Calendar]` Planned/future
   * interactions in a date window, for the composed calendar read-model
   * (`PastoralCalendarService`) - see MILESTONE_B_DESIGN_NOTES.md Part
   * 10. */
  listScheduledInRange(branchId: string, from: Date, to: Date): Promise<MemberInteraction[]> {
    return this.prisma.memberInteraction.findMany({
      where: { branchId, scheduledAt: { gte: from, lte: to } },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
