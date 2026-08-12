import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateGroupInput, GroupResponseDto, ListGroupsQuery, UpdateGroupInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Group } from '@prisma/client';

import { GroupRepository } from '../repositories/group.repository';

function toResponseDto(group: Group): GroupResponseDto {
  return {
    id: group.id,
    branchId: group.branchId,
    type: group.type,
    name: group.name,
    meetingSchedule: group.meetingSchedule,
    meetingLocation: group.meetingLocation,
    category: group.category,
    lifecycleStatus: group.lifecycleStatus,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

/**
 * Orchestrates Group (Bacenta/Basonta) create/read/update use cases -
 * [INFERRED - no PRD §17.3 row covers Group creation, see
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment].
 * FR-PC-01/FR-MIN-01 name the fields captured; leadership itself is a
 * separate Role Assignment (`RoleAssignmentService`), not set here.
 */
@Injectable()
export class GroupService {
  constructor(private readonly groupRepository: GroupRepository) {}

  async create(actor: ActorContext, input: CreateGroupInput): Promise<GroupResponseDto> {
    const group = await this.groupRepository.create({
      branchId: actor.branchId,
      type: input.type,
      name: input.name,
      meetingSchedule: input.meetingSchedule,
      meetingLocation: input.meetingLocation,
      category: input.category,
    });
    return toResponseDto(group);
  }

  /** `GET /groups` (Ministry Web Admin sprint) - branch-wide listing,
   * optionally narrowed to one `type`. Resource-context resolution is
   * always the actor's own Branch (`GroupListResourceContextGuard`) - see
   * that guard's own doc comment for why this deliberately does not
   * attempt an OWN_GROUP/CLUSTER case the way `PersonListResourceContextGuard`
   * does for `GET /people`. */
  async list(actor: ActorContext, query: ListGroupsQuery): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.findByBranch(actor.branchId, query.type);
    return groups.map(toResponseDto);
  }

  async getById(id: string): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundException(`No Group found with id '${id}'`);
    }
    return toResponseDto(group);
  }

  /** `[Resident Pastor Dashboard - Bacenta Leaderboard milestone]` Thin
   * passthrough - see `GroupRepository.findActiveBacentasByBranch`'s own
   * doc comment. Takes `branchId` directly rather than `actor: ActorContext`
   * like `list()` above - the caller (`BranchDashboardSummaryService`) is
   * only ever reached from an already-RBAC-guarded controller route that
   * has already resolved `actor.branchId` itself. */
  async listActiveBacentasForBranch(branchId: string): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.findActiveBacentasByBranch(branchId);
    return groups.map(toResponseDto);
  }

  /**
   * Existence is already guaranteed on the real HTTP path by
   * `GroupResourceContextGuard` (must load the Group to build
   * `ResourceContext` before `RbacGuard` runs) - the explicit check here
   * is defense in depth, matching `PersonService.update`'s same pattern.
   */
  async update(id: string, input: UpdateGroupInput): Promise<GroupResponseDto> {
    const existing = await this.groupRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No Group found with id '${id}'`);
    }

    const group = await this.groupRepository.update(id, {
      name: input.name,
      meetingSchedule: input.meetingSchedule,
      meetingLocation: input.meetingLocation,
      category: input.category,
      lifecycleStatus: input.lifecycleStatus,
    });
    return toResponseDto(group);
  }
}
