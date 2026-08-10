import { randomUUID } from 'crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { computeFollowUpTaskDueAt } from '@ecclesia/domain-pastoral-care';
import type { FollowUpTaskTrigger } from '@ecclesia/domain-pastoral-care';
import type {
  CreateFollowUpTaskInput,
  PublishableEngagementSignal,
  FollowUpTaskResponseDto,
  FollowUpTaskStatusDto,
  ListFollowUpTasksForActorQuery,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { FollowUpTask, FollowUpTaskStatus } from '@prisma/client';

import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
import { PersonScopeService } from '../../people/services/person-scope.service';
import { FollowUpTaskRepository } from '../repositories/follow-up-task.repository';

function toResponseDto(task: FollowUpTask): FollowUpTaskResponseDto {
  return {
    id: task.id,
    branchId: task.branchId,
    groupId: task.groupId,
    personId: task.personId,
    assignedToPersonId: task.assignedToPersonId,
    status: task.status,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    escalatedAt: task.escalatedAt ? task.escalatedAt.toISOString() : null,
    escalatedToPersonId: task.escalatedToPersonId,
    createdByPersonId: task.createdByPersonId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * FR-PC-03 (creation)/FR-PC-04 (assignment, SLA, escalation)/BR-PC-04
 * orchestration. Injects People's exported `PersonScopeService` (Blueprint
 * §7.2) to resolve the target Person's `branchId` rather than querying
 * `people.persons` directly - the same cross-module consumption pattern
 * `PoimenEnrollmentResourceContextGuard` already uses.
 *
 * **What this service deliberately does not do.** FR-PC-03's *automatic*
 * creation trigger (a Person entering `FirstTimeGuest`, or the specific
 * `Lapsed -> FollowUp` transition) and its default-assignee resolution
 * (§19.1 step 3: "geographic/Bacenta preference, or a rotation among
 * Shepherds if no preference given") are not wired into
 * `PersonService.transitionLifecycleStage` - there is no concrete,
 * buildable algorithm for that default-assignee rule anywhere in the PRD,
 * and no rotation-state field in `db/schema.prisma` to support one. Every
 * `create()` call here requires an explicit `assignedToPersonId`, same as
 * BR-PC-04's escalation requiring an explicit `escalatedToPersonId`
 * (organizational-hierarchy resolution is an equally unmodeled lookup).
 * `libs/domain/pastoral-care`'s `determineFollowUpTaskTrigger` and
 * `computeFollowUpTaskDueAt` are ready to consume once that resolution
 * logic exists - see `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
@Injectable()
export class FollowUpTaskService {
  constructor(
    private readonly followUpTaskRepository: FollowUpTaskRepository,
    private readonly personScopeService: PersonScopeService,
    private readonly eventPublisher: EventBridgePublisherService,
  ) {}

  async create(actor: ActorContext, personId: string, input: CreateFollowUpTaskInput): Promise<FollowUpTaskResponseDto> {
    const resource = await this.personScopeService.loadResourceContext(personId, actor);

    // [INFERRED] `libs/domain/pastoral-care`'s SLA defaults only cover the
    // two PRD-named triggers (OQ-06). A `MANUAL` (ad-hoc, not
    // lifecycle-triggered) task has no PRD-specified default SLA at all -
    // falling back to the FIRST_TIME_GUEST default (3 days, the shorter
    // of the two) is a disclosed, conservative choice, not a citation;
    // `dueAtOverride` lets the creating actor supply an exact date
    // instead whenever this default doesn't fit.
    const trigger: FollowUpTaskTrigger = input.trigger === 'MANUAL' ? 'FIRST_TIME_GUEST' : input.trigger;
    const dueAt = input.dueAtOverride
      ? new Date(input.dueAtOverride)
      : computeFollowUpTaskDueAt(trigger, new Date());

    const task = await this.followUpTaskRepository.create({
      branchId: resource.branchId,
      personId,
      assignedToPersonId: input.assignedToPersonId,
      groupId: input.groupId,
      dueAt,
      createdByPersonId: actor.personId,
    });
    return toResponseDto(task);
  }

  /** `GET /pastoral-care/groups/:groupId/follow-up-tasks` (§16.2's
   * "Follow-up task queue... sorted by SLA urgency" - Shepherd Dashboard
   * sprint, see this class's own doc comment on what this milestone
   * previously deliberately did not build). Defaults to the two
   * still-open statuses when the caller supplies none. */
  async listForGroup(groupId: string, statuses?: FollowUpTaskStatusDto[]): Promise<FollowUpTaskResponseDto[]> {
    const tasks = await this.followUpTaskRepository.listByGroup(groupId, statuses as FollowUpTaskStatus[] | undefined);
    return tasks.map(toResponseDto);
  }

  /** `GET /pastoral-care/follow-up-tasks` (Pastoral Care Web Admin sprint).
   * `query.groupId` present -> same Group-scoped read `listForGroup`
   * already does; absent -> BRANCH-wide, for the BRANCH-scoped actor
   * `FollowUpTaskListForActorResourceContextGuard` already resolved
   * against `actor.branchId`. */
  async list(actor: ActorContext, query: ListFollowUpTasksForActorQuery): Promise<FollowUpTaskResponseDto[]> {
    const tasks = query.groupId
      ? await this.followUpTaskRepository.listByGroup(query.groupId, query.status as FollowUpTaskStatus[] | undefined)
      : await this.followUpTaskRepository.listByBranch(actor.branchId, query.status as FollowUpTaskStatus[] | undefined);
    return tasks.map(toResponseDto);
  }

  async getById(id: string): Promise<FollowUpTaskResponseDto> {
    const task = await this.followUpTaskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`No Follow-up task found with id '${id}'`);
    }
    return toResponseDto(task);
  }

  /** FR-PC-04 acceptance: Shepherd logs an outcome, moving the task to its
   * terminal `COMPLETED` state. */
  async complete(id: string): Promise<FollowUpTaskResponseDto> {
    const existing = await this.requireOpenOrEscalated(id);
    const task = await this.followUpTaskRepository.update(existing.id, { status: 'COMPLETED' });

    // `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
    // `follow_up.completed` (Follow-up responsiveness category).
    // `subjectPersonId` is the Person the follow-up was *about*
    // (`task.personId`), not who completed it - this method's own
    // signature never took an `actor`/acting-personId parameter (unlike
    // `create()` above), and the envelope has no field for an acting user
    // regardless. Payload deliberately carries no free-text "outcome"
    // field - the Blueprint's own catalog sketch shows one, but nothing in
    // `FollowUpTask`'s actual schema or this method's signature captures
    // one; inventing a field no domain data backs would be exactly the
    // kind of new business rule this milestone's brief prohibits. See
    // ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md.
    const envelope: PublishableEngagementSignal = {
      eventId: randomUUID(),
      eventType: 'follow_up.completed',
      schemaVersion: 1,
      branchId: task.branchId,
      occurredAt: task.updatedAt.toISOString(),
      subjectPersonId: task.personId,
      subjectGroupId: task.groupId ?? undefined,
      payload: { followUpTaskId: task.id },
    };
    await this.eventPublisher.publish(envelope);

    return toResponseDto(task);
  }

  /** BR-PC-04: "escalates to the assigned Person's organizational
   * superior." `escalatedToPersonId` is caller-supplied - see this
   * class's doc comment for why automatic hierarchy resolution is out of
   * scope here. */
  async escalate(id: string, escalatedToPersonId: string): Promise<FollowUpTaskResponseDto> {
    const existing = await this.requireOpenOrEscalated(id);
    if (existing.status === 'ESCALATED') {
      throw new ConflictException(`Follow-up task '${id}' is already escalated`);
    }
    const task = await this.followUpTaskRepository.update(existing.id, {
      status: 'ESCALATED',
      escalatedAt: new Date(),
      escalatedToPersonId,
    });
    return toResponseDto(task);
  }

  private async requireOpenOrEscalated(id: string): Promise<FollowUpTask> {
    const existing = await this.followUpTaskRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No Follow-up task found with id '${id}'`);
    }
    if (existing.status === 'COMPLETED') {
      throw new ConflictException(`Follow-up task '${id}' is already COMPLETED`);
    }
    return existing;
  }
}
