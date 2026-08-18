import { Injectable } from '@nestjs/common';
import type { CounsellingSession, CounsellingSessionStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateCounsellingSessionRecord {
  branchId: string;
  personId: string;
  counsellorPersonId: string;
  scheduledAt: Date;
  briefNote?: string;
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Prisma-backed
 * persistence for `pastoral_care.counselling_sessions` - see
 * MILESTONE_B_DESIGN_NOTES.md Part 8.
 */
@Injectable()
export class CounsellingSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateCounsellingSessionRecord): Promise<CounsellingSession> {
    return this.prisma.counsellingSession.create({
      data: {
        branchId: input.branchId,
        personId: input.personId,
        counsellorPersonId: input.counsellorPersonId,
        scheduledAt: input.scheduledAt,
        briefNote: input.briefNote,
      },
    });
  }

  findById(id: string): Promise<CounsellingSession | null> {
    return this.prisma.counsellingSession.findUnique({ where: { id } });
  }

  /** Organizational scope, not author-only - see this repository's
   * module-level doc comment and `CounsellingSession`'s own schema.prisma
   * doc comment for why this differs from `PrayerNoteRepository`'s
   * author-filtered equivalent. */
  listByPerson(personId: string): Promise<CounsellingSession[]> {
    return this.prisma.counsellingSession.findMany({
      where: { personId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  updateStatus(id: string, status: CounsellingSessionStatus): Promise<CounsellingSession> {
    return this.prisma.counsellingSession.update({ where: { id }, data: { status } });
  }

  /** `[Milestone B, Slice 7 - Pastoral Calendar]` Sessions whose
   * `scheduledAt` falls in a date window, for the composed calendar
   * read-model - see MILESTONE_B_DESIGN_NOTES.md Part 10. Excludes
   * `CANCELLED` - nothing to show for a session that will not happen. */
  listScheduledInRange(branchId: string, from: Date, to: Date): Promise<CounsellingSession[]> {
    return this.prisma.counsellingSession.findMany({
      where: { branchId, status: { not: 'CANCELLED' }, scheduledAt: { gte: from, lte: to } },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
