import { BadRequestException, Injectable } from '@nestjs/common';
import type { GetOutreachConversionQuery, OutreachConversionResponseDto, OutreachConversionResultDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { PrismaService } from '../../../platform/database/prisma.service';
import { AttendanceRecordService } from '../../gatherings/services/attendance-record.service';
import { GatheringTypeCategoryService } from '../../gatherings/services/gathering-type-category.service';
import { OutreachContactService } from '../../outreach/services/outreach-contact.service';
import { OutreachService } from '../../outreach/services/outreach.service';
import { PersonService } from '../../people/services/person.service';

const ACTIVE_MEMBER_WINDOW_WEEKS = 8;
const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `[Milestone C.1.2: Outreach Analytics]` The conversion read model
 * Milestone C's own Phase 6 left unbuilt, backing `GET
 * /insights/outreach-conversion`. Composes `OutreachService`/
 * `OutreachContactService` (Outreach) with `PersonService` (People) and
 * `AttendanceRecordService`/`GatheringTypeCategoryService` (Gatherings) -
 * the same cross-module composition shape every other trend service in
 * this milestone already establishes.
 *
 * **Never presents an inferred fact as a stored one.** No `promotedAt`
 * column exists on `OutreachContact` - `averageInferredPromotionDays` is
 * computed as `Person.createdAt - OutreachContact.createdAt` for every
 * promoted contact, and the response always also carries
 * `averageInferredPromotionDaysIsInferred: true` so a consumer can never
 * mistake it for a hard historical timestamp without reading
 * documentation (Phase 6's explicit instruction).
 *
 * **`convertedToActiveMemberCount` is now honestly computable**, unlike
 * when Phase 6 was first scoped (its own instruction: "do not claim
 * conversion to active member unless the active-member definition can be
 * applied honestly") - Milestone C's Phase 5 landed the approved
 * definition (`lifecycleStage = 'MEMBER'` AND a SUNDAY-category
 * attendance in the trailing 8 weeks), so this reuses the identical
 * two-id-set intersection `MembershipTrendService`'s own snapshot
 * already establishes, applied only to the promoted contacts' own
 * `personId`s rather than the whole Branch.
 */
@Injectable()
export class OutreachConversionService {
  constructor(
    private readonly outreachService: OutreachService,
    private readonly outreachContactService: OutreachContactService,
    private readonly personService: PersonService,
    private readonly attendanceRecordService: AttendanceRecordService,
    private readonly gatheringTypeCategoryService: GatheringTypeCategoryService,
    private readonly prisma: PrismaService,
  ) {}

  async getConversion(actor: ActorContext, query: GetOutreachConversionQuery): Promise<OutreachConversionResponseDto> {
    if (query.council && query.groupId) {
      throw new BadRequestException('Supply at most one of council or groupId, not both');
    }

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    if (query.council) {
      if (!actor.councilBranchIds || actor.councilBranchIds.length === 0) {
        throw new BadRequestException('This actor has no Council scope to aggregate across');
      }
      const councilBranches: (OutreachConversionResultDto & { branchId: string })[] = [];
      for (const branchId of actor.councilBranchIds) {
        const result = await this.prisma.runInBranchScope(branchId, () => this.buildResult(branchId, undefined, from, to));
        councilBranches.push({ branchId, ...result });
      }
      return { councilBranches };
    }

    if (query.groupId) {
      const result = await this.buildResult(actor.branchId, [query.groupId], from, to);
      return { branchId: actor.branchId, ...result };
    }

    const groupIds = this.resolveActorOwnGroupIds(actor);
    const result = await this.buildResult(actor.branchId, groupIds, from, to);
    return { branchId: actor.branchId, ...result };
  }

  private resolveActorOwnGroupIds(actor: ActorContext): string[] | undefined {
    if (actor.clusterBacentaIds && actor.clusterBacentaIds.length > 0) {
      return actor.clusterBacentaIds;
    }
    const ownGroupId = actor.bacentaId ?? actor.basontaId;
    return ownGroupId ? [ownGroupId] : undefined;
  }

  private async buildResult(
    branchId: string,
    groupIds: string[] | undefined,
    from: Date | undefined,
    to: Date | undefined,
  ): Promise<OutreachConversionResultDto> {
    const [outreachesCount, contacts] = await Promise.all([
      groupIds ? this.outreachService.countByGroups(groupIds, from, to) : this.outreachService.countByBranch(branchId, from, to),
      this.outreachContactService.listForConversion(branchId, groupIds, from, to),
    ]);

    const contactsReachedCount = contacts.length;
    const promoted = contacts.filter((contact) => contact.personId !== null);
    const promotedContactsCount = promoted.length;
    const conversionPercentage = contactsReachedCount === 0 ? 0 : Math.round((promotedContactsCount / contactsReachedCount) * 1000) / 10;

    const promotedPersonIds = promoted.map((contact) => contact.personId as string);
    const promotedPersons = promotedPersonIds.length > 0 ? await this.personService.getByIds(promotedPersonIds) : [];
    const personCreatedAtById = new Map(promotedPersons.map((person) => [person.id, new Date(person.createdAt)]));

    const inferredDurationsDays = promoted
      .map((contact) => {
        const personCreatedAt = personCreatedAtById.get(contact.personId as string);
        if (!personCreatedAt) {
          return undefined;
        }
        const durationMs = personCreatedAt.getTime() - contact.createdAt.getTime();
        return durationMs < 0 ? 0 : durationMs / MILLISECONDS_PER_DAY;
      })
      .filter((duration): duration is number => duration !== undefined);
    const averageInferredPromotionDays =
      inferredDurationsDays.length === 0
        ? null
        : Math.round((inferredDurationsDays.reduce((sum, days) => sum + days, 0) / inferredDurationsDays.length) * 10) / 10;

    const convertedToActiveMemberCount = await this.countConvertedToActiveMember(branchId, promotedPersonIds);
    const convertedToActiveMemberPercentage =
      promotedContactsCount === 0 ? 0 : Math.round((convertedToActiveMemberCount / promotedContactsCount) * 1000) / 10;

    return {
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      outreachesCount,
      contactsReachedCount,
      promotedContactsCount,
      conversionPercentage,
      averageInferredPromotionDays,
      averageInferredPromotionDaysIsInferred: true,
      convertedToActiveMemberCount,
      convertedToActiveMemberPercentage,
    };
  }

  /** Reuses `MembershipTrendService`'s exact active-member definition
   * (Phase 1 decision #2), narrowed to just the promoted contacts'
   * `personId`s rather than the whole Branch's `MEMBER`-stage set. */
  private async countConvertedToActiveMember(branchId: string, promotedPersonIds: string[]): Promise<number> {
    if (promotedPersonIds.length === 0) {
      return 0;
    }
    const now = new Date();
    const windowStart = new Date(now.getTime() - ACTIVE_MEMBER_WINDOW_WEEKS * MILLISECONDS_PER_WEEK);
    const [memberIds, sundayTypes] = await Promise.all([
      this.personService.findIdsByBranchAndLifecycleStage(branchId, 'MEMBER'),
      this.gatheringTypeCategoryService.typesForCategory(branchId, 'SUNDAY'),
    ]);
    if (sundayTypes.length === 0) {
      return 0;
    }
    const memberIdSet = new Set(memberIds);
    const promotedMemberIds = promotedPersonIds.filter((id) => memberIdSet.has(id));
    if (promotedMemberIds.length === 0) {
      return 0;
    }
    const presentPersonIds = new Set(
      await this.attendanceRecordService.listDistinctPresentPersonIds(branchId, windowStart, now, sundayTypes),
    );
    return promotedMemberIds.filter((id) => presentPersonIds.has(id)).length;
  }
}
