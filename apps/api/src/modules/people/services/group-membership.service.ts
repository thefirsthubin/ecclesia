import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { planGroupMembershipChange } from '@ecclesia/domain-people';
import type { CreateGroupMembershipRequestInput, GroupMembershipResponseDto } from '@ecclesia/contracts';
import type { GroupMembership } from '@prisma/client';

import { GroupMembershipRepository } from '../repositories/group-membership.repository';
import { PersonRepository } from '../repositories/person.repository';

function toResponseDto(membership: GroupMembership): GroupMembershipResponseDto {
  return {
    id: membership.id,
    personId: membership.personId,
    groupId: membership.groupId,
    groupType: membership.groupType,
    startedAt: membership.startedAt.toISOString(),
    endedAt: membership.endedAt ? membership.endedAt.toISOString() : null,
    reason: membership.reason,
  };
}

/**
 * BR-PPL-01/02, FR-PPL-04/05, and PRD §19.1 step 6's automatic
 * lifecycle-stage side effect. See `libs/domain/people/group-membership-rules.ts`
 * for the pure cardinality decision this class orchestrates against real
 * data.
 */
@Injectable()
export class GroupMembershipService {
  constructor(
    private readonly groupMembershipRepository: GroupMembershipRepository,
    private readonly personRepository: PersonRepository,
  ) {}

  async assign(personId: string, input: CreateGroupMembershipRequestInput): Promise<GroupMembershipResponseDto> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundException(`No Person found with id '${personId}'`);
    }

    const group = await this.groupMembershipRepository.findGroupById(input.groupId);
    if (!group) {
      throw new NotFoundException(`No Group found with id '${input.groupId}'`);
    }

    const activeMemberships = await this.personRepository.findActiveGroupMemberships(personId);

    const plan = (() => {
      try {
        return planGroupMembershipChange(group.id, group.type, activeMemberships);
      } catch (error) {
        throw new ConflictException(error instanceof Error ? error.message : 'Invalid group membership change');
      }
    })();

    if (plan.reasonRequiredForClose && !input.reason) {
      throw new BadRequestException(
        'A reason is required when this assignment closes an existing active Bacenta membership (PRD §16.1 reassignment surface)',
      );
    }

    // PRD §19.1 step 6: opening a Bacenta membership for a Person
    // currently in FOLLOW_UP automatically advances lifecycle_stage to
    // ASSIGNED_TO_BACENTA, atomically with the membership write. Any
    // other lifecycle stage (e.g. a Member being reassigned - "moved
    // house") is left untouched, per PRD §12.5's edge-case table.
    const personLifecycleStageUpdate =
      group.type === 'PASTORAL_CARE' && person.lifecycleStage === 'FOLLOW_UP' ? 'ASSIGNED_TO_BACENTA' : undefined;

    const membership = await this.groupMembershipRepository.applyChange({
      branchId: person.branchId,
      personId,
      groupId: group.id,
      groupType: group.type,
      membershipIdsToClose: plan.membershipIdsToClose,
      reason: input.reason,
      personLifecycleStageUpdate,
    });

    return toResponseDto(membership);
  }
}
