import { Injectable } from '@nestjs/common';
import type { PrayerNote, PrayerNoteStatus } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreatePrayerNoteRecord {
  branchId: string;
  personId: string;
  authorPersonId: string;
  content: string;
  followUpDate?: Date;
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Prisma-backed
 * persistence for `pastoral_care.prayer_notes` - see
 * MILESTONE_B_DESIGN_NOTES.md Part 5/6.
 */
@Injectable()
export class PrayerNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePrayerNoteRecord): Promise<PrayerNote> {
    return this.prisma.prayerNote.create({
      data: {
        branchId: input.branchId,
        personId: input.personId,
        authorPersonId: input.authorPersonId,
        content: input.content,
        followUpDate: input.followUpDate,
      },
    });
  }

  /**
   * `[Milestone B]` The real enforcement point for the approved
   * author-only visibility decision: `authorPersonId` is always the
   * *acting* Person, never optional or caller-widened - see
   * `PrayerNoteService.listByPerson`'s own doc comment. This is the same
   * "narrow the query, not just the permission" pattern
   * `FinancialTransactionRepository.findManyByBranch`'s `sourceGroupId`
   * filter already establishes for BACENTA_LEADER.
   */
  findByPersonAndAuthor(personId: string, authorPersonId: string): Promise<PrayerNote[]> {
    return this.prisma.prayerNote.findMany({
      where: { personId, authorPersonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: PrayerNoteStatus): Promise<PrayerNote> {
    return this.prisma.prayerNote.update({ where: { id }, data: { status } });
  }

  findById(id: string): Promise<PrayerNote | null> {
    return this.prisma.prayerNote.findUnique({ where: { id } });
  }
}
