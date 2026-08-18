import { Injectable } from '@nestjs/common';
import type { OutreachContact, OutreachContactOutcome } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateOutreachContactRecord {
  outreachId: string;
  branchId: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  howReached?: string;
  outcome?: OutreachContactOutcome;
}

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Prisma-backed
 * persistence for `outreach.outreach_contacts`.
 */
@Injectable()
export class OutreachContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateOutreachContactRecord): Promise<OutreachContact> {
    return this.prisma.outreachContact.create({
      data: {
        outreachId: input.outreachId,
        branchId: input.branchId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        howReached: input.howReached,
        outcome: input.outcome,
      },
    });
  }

  findById(id: string): Promise<OutreachContact | null> {
    return this.prisma.outreachContact.findUnique({ where: { id } });
  }

  listByOutreach(outreachId: string): Promise<OutreachContact[]> {
    return this.prisma.outreachContact.findMany({
      where: { outreachId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** `[Milestone B]` The lazy/deferred promotion write - sets `personId`
   * once, from `null`, when this contact converts into a real Person
   * (MILESTONE_B_DESIGN_NOTES.md Part 4). No other field on this row is
   * ever updated after creation - see `OutreachContactService.promote`'s
   * own doc comment for why this is the only mutation this repository
   * exposes beyond `create`. */
  setPersonId(id: string, personId: string): Promise<OutreachContact> {
    return this.prisma.outreachContact.update({ where: { id }, data: { personId } });
  }

  /** `[Milestone B]` Also lets a leader record an outcome
   * (`NOT_INTERESTED`/`FOLLOW_UP_REQUESTED`/`ATTENDED`) after the fact,
   * independently of promotion - the two are separate real-world facts
   * (a contact can be marked `ATTENDED` without ever being promoted to a
   * full Person, e.g. if they attended once and never returned). */
  updateOutcome(id: string, outcome: OutreachContactOutcome): Promise<OutreachContact> {
    return this.prisma.outreachContact.update({ where: { id }, data: { outcome } });
  }
}
