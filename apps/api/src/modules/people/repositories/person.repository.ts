import { Injectable } from '@nestjs/common';
import type { LifecycleStage as PrismaLifecycleStage, Person } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';
import type { ActiveGroupMembershipRef, DuplicateCandidateRecord } from '@ecclesia/domain-people';

export interface CreatePersonRecord {
  branchId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date;
  address?: string;
  guardianPersonId?: string;
}

export interface UpdatePersonRecord {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  guardianPersonId?: string | null;
}

/**
 * Prisma-backed persistence for `people.persons`, schema-scoped per
 * Blueprint §6.4/§7.2 - this module's repository layer only ever queries
 * its own bounded context's tables directly.
 *
 * Every Branch-scoped query below filters explicitly by `branchId` in
 * application code. This is deliberate, not merely a stopgap: Blueprint
 * §7.3 states Row-Level Security is "a BACKSTOP under application-layer
 * filtering ... not a replacement for it," and the RLS session variable
 * (`app.current_branch_id`) is not wired anywhere yet (`db/DESIGN_NOTES.md`
 * Open Question #3, restated in `PEOPLE_DESIGN_NOTES.md`) - so today,
 * this explicit filtering *is* the only enforcement, not merely the
 * primary one.
 */
@Injectable()
export class PersonRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePersonRecord): Promise<Person> {
    return this.prisma.person.create({ data: input });
  }

  findById(id: string): Promise<Person | null> {
    return this.prisma.person.findUnique({ where: { id } });
  }

  update(id: string, input: UpdatePersonRecord): Promise<Person> {
    return this.prisma.person.update({ where: { id }, data: input });
  }

  updateLifecycleStage(id: string, lifecycleStage: string): Promise<Person> {
    // `lifecycleStage` arrives as a plain string (already validated against
    // `libs/domain/people`'s `LifecycleStage` union by the caller) - cast
    // to Prisma's generated `LifecycleStage` enum type, which is the same
    // literal string set (PRD §12.5), rather than to `never`, so this
    // still catches a genuine Prisma/PRD enum drift at compile time.
    return this.prisma.person.update({
      where: { id },
      data: { lifecycleStage: lifecycleStage as PrismaLifecycleStage },
    });
  }

  /**
   * FR-PPL-02's candidate set: same Branch, same (case-insensitive) last
   * name - a deliberately loose pre-filter, since the actual match
   * decision (`libs/domain/people`'s `findDuplicateCandidates`) still
   * requires phone or Bacenta+age agreement on top of this.
   */
  async findDuplicateCandidateSet(branchId: string, lastName: string): Promise<DuplicateCandidateRecord[]> {
    const persons = await this.prisma.person.findMany({
      where: { branchId, lastName: { equals: lastName, mode: 'insensitive' } },
      include: {
        groupMemberships: {
          where: { groupType: 'PASTORAL_CARE', endedAt: null },
          select: { groupId: true },
          take: 1,
        },
      },
    });
    return persons.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      phone: person.phone,
      dateOfBirth: person.dateOfBirth,
      activeBacentaGroupId: person.groupMemberships[0]?.groupId ?? null,
    }));
  }

  async findActiveGroupMemberships(personId: string): Promise<ActiveGroupMembershipRef[]> {
    const memberships = await this.prisma.groupMembership.findMany({
      where: { personId, endedAt: null },
      select: { id: true, groupId: true, groupType: true },
    });
    return memberships.map((m) => ({ id: m.id, groupId: m.groupId, groupType: m.groupType }));
  }
}
