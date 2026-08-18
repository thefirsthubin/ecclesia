import { randomUUID } from 'crypto';

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { planGroupMembershipChange } from '@ecclesia/domain-people';
import type { CreateGroupMembershipRequestInput, LeaveGroupMembershipInput, PublishableEngagementSignal, GroupMembershipResponseDto } from '@ecclesia/contracts';
import type { GroupMembership } from '@prisma/client';

import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
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
    private readonly eventPublisher: EventBridgePublisherService,
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

    // `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
    // `basonta_roster.updated` (Serving category) - fires only when the
    // opened membership is in a `MINISTRY`-type Group (a Basonta/serving
    // team), not a `PASTORAL_CARE`-type Group (a Bacenta) - Bacenta
    // engagement is already captured via `bacenta_meeting.attendance_recorded`
    // (attendance-based, `AttendanceRecordService`), so signalling here too
    // for `PASTORAL_CARE` memberships would double-count the same
    // underlying fact under two categories. See
    // `ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md`.
    if (group.type === 'MINISTRY') {
      const envelope: PublishableEngagementSignal = {
        eventId: randomUUID(),
        eventType: 'basonta_roster.updated',
        schemaVersion: 1,
        branchId: person.branchId,
        occurredAt: membership.startedAt.toISOString(),
        subjectPersonId: personId,
        subjectGroupId: group.id,
        payload: { groupId: group.id, reason: input.reason ?? null },
      };
      await this.eventPublisher.publish(envelope);
    }

    // `[Engagement Signal Ingestion Pipeline milestone]` `lifecycle_stage.transitioned`
    // (Visitor retention category) - this method's own PRD §19.1 step 6
    // side effect (`personLifecycleStageUpdate`, above) is the *other*
    // trigger for this same signal type besides `PersonService`'s own
    // dedicated endpoint. Both publish the identical event type/payload
    // shape from their own call site rather than one delegating to the
    // other, since `PersonService.transitionLifecycleStage` deliberately
    // rejects this exact transition (`requiresGroupMembershipToTransition`)
    // - there is no single method both paths could share without
    // reintroducing the coupling that rejection exists to prevent.
    if (personLifecycleStageUpdate) {
      const lifecycleEnvelope: PublishableEngagementSignal = {
        eventId: randomUUID(),
        eventType: 'lifecycle_stage.transitioned',
        schemaVersion: 1,
        branchId: person.branchId,
        occurredAt: membership.startedAt.toISOString(),
        subjectPersonId: personId,
        payload: { fromStage: person.lifecycleStage, toStage: personLifecycleStageUpdate },
      };
      await this.eventPublisher.publish(lifecycleEnvelope);
    }

    return toResponseDto(membership);
  }

  /** FR-PPL-07: full Bacenta/Basonta membership history for a Person,
   * including closed/past memberships. */
  async listForPerson(personId: string): Promise<GroupMembershipResponseDto[]> {
    const memberships = await this.groupMembershipRepository.listByPerson(personId);
    return memberships.map(toResponseDto);
  }

  /**
   * `[Milestone B: People + Pastoral + Outreach Foundation]` `POST
   * /people/:personId/group-memberships/leave` - closes one active
   * membership with no replacement opened, the gap
   * MILESTONE_B_DESIGN_NOTES.md Part 3 identified (`assign` above is the
   * only other mutation, and it always requires a target Group to join).
   * `reason` is required, not optional - `GroupMembership.reason`'s own
   * schema doc comment states "[BLUEPRINT-EXACT] Required when a
   * membership is closed" with no reassignment-only qualifier, so this
   * explicit-removal path holds it to the same requirement
   * `planGroupMembershipChange`'s `reasonRequiredForClose` already
   * enforces for a reassignment-triggered close.
   */
  async leave(personId: string, input: LeaveGroupMembershipInput): Promise<GroupMembershipResponseDto> {
    const activeMemberships = await this.personRepository.findActiveGroupMemberships(personId);
    const target = activeMemberships.find((membership) => membership.groupId === input.groupId);
    if (!target) {
      throw new NotFoundException(`Person '${personId}' has no active membership in Group '${input.groupId}'`);
    }
    const membership = await this.groupMembershipRepository.closeMembership(target.id, input.reason);
    return toResponseDto(membership);
  }

  /** `[Resident Pastor Dashboard - Volunteers milestone]` Thin passthrough
   * - see `GroupMembershipRepository.countDistinctActiveMinistryMembersByBranch`'s
   * own doc comment. No `actor`/authorization parameter, matching this
   * module's other cross-module-consumed methods (`PersonService.countByBranch`)
   * - the caller (`BranchDashboardSummaryService`) is only ever reached
   * from an already-RBAC-guarded controller route. */
  countDistinctActiveMinistryMembersByBranch(branchId: string, asOf?: Date): Promise<number> {
    return this.groupMembershipRepository.countDistinctActiveMinistryMembersByBranch(branchId, asOf);
  }
}
