import { Injectable } from '@nestjs/common';
import type { PastoralNote } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreatePastoralNoteRecord {
  branchId: string;
  personId: string;
  authorPersonId: string;
  content: string;
}

/**
 * Prisma-backed persistence for `pastoral_care.pastoral_notes` (§16.2).
 * Schema-scoped per Blueprint §6.4/§7.2, same rule as
 * `PoimenEnrollmentRepository`/`FollowUpTaskRepository`. Notes are
 * immutable once created (`db/schema.prisma`'s `PastoralNote` has no
 * `updatedAt`) - there is no `update` method here.
 */
@Injectable()
export class PastoralNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePastoralNoteRecord): Promise<PastoralNote> {
    return this.prisma.pastoralNote.create({ data: input });
  }

  findByPersonId(personId: string): Promise<PastoralNote[]> {
    return this.prisma.pastoralNote.findMany({ where: { personId }, orderBy: { createdAt: 'desc' } });
  }
}
