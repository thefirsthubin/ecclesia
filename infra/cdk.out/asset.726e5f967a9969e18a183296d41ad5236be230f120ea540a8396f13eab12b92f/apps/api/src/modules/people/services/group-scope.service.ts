import { Injectable, NotFoundException } from '@nestjs/common';
import type { ResourceContext } from '@ecclesia/rbac';

import { GroupRepository } from '../repositories/group.repository';

/**
 * People's public service interface (Blueprint §7.2) for "what RBAC
 * scope does this Group belong to" - extracted from
 * `GroupResourceContextGuard`'s own inline logic (same consolidation
 * `PersonScopeService` already did for the analogous Person-side lookup),
 * so other bounded-context modules whose resources reference a Group
 * directly (Gatherings' `GatheringService`/`GatheringSeriesService`, when
 * an `ownerGroupId`/`groupId` is supplied) can resolve it via DI instead
 * of reaching into `GroupRepository`/Prisma directly.
 */
@Injectable()
export class GroupScopeService {
  constructor(private readonly groupRepository: GroupRepository) {}

  async loadResourceContext(groupId: string): Promise<ResourceContext> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException(`No Group found with id '${groupId}'`);
    }
    return {
      branchId: group.branchId,
      bacentaId: group.type === 'PASTORAL_CARE' ? group.id : undefined,
      basontaId: group.type === 'MINISTRY' ? group.id : undefined,
    };
  }
}
