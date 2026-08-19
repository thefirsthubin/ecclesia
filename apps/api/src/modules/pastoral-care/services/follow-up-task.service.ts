import { randomUUID } from 'crypto';

import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { checkFollowUpTaskStatusTransition, computeFollowUpTaskDueAt } from '@ecclesia/domain-pastoral-care';
import type { FollowUpTaskStatusValue, FollowUpTaskTrigger } from '@ecclesia/domain-pastoral-care';
import type {
  CreateFollowUpTaskInput,
  PublishableEngagementSignal,
  FollowUpTaskResponseDto,
  FollowUpTaskStatusDto,
  ListFollowUpTasksForActorQuery,
  UpdateFollowUpTaskInput,
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
    priority: task.priority,
    description: task.description,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    trigger: task.trigger,
    escalatedAt: task.escalatedAt ? task.escalatedAt.toISOString() : null,
    escalatedToPersonId: task.escalatedToPersonId,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
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

    // `[Branch Pastor portal, Pastoral Care sprint]` The assignee was
    // previously accepted as opaque client input with no scope check at
    // all - `assignedToPersonId` never fed `PersonScopeService`, so a
    // task could be assigned to a Person in any Branch, not only the
    // actor's own. Resolves the assignee's own real `branchId` the same
    // way the subject Person's is resolved above, and rejects a
    // cross-Branch assignment - a real, existing-data-only check (no
    // schema/RBAC change), not a widened or invented permission.
    const assigneeResource = await this.personScopeService.loadResourceContext(input.assignedToPersonId, actor);
    if (assigneeResource.branchId !== actor.branchId) {
      throw new ForbiddenException(
        `Follow-up tasks may only be assigned to a Person within your own Branch - '${input.assignedToPersonId}' belongs to a different Branch`,
      );
    }

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
      // `[Milestone B]` `priority` defaults server-side (Prisma's own
      // `@default(MEDIUM)`) when omitted - passed through only when the
      // caller actually supplied one. `description` passed through as-is
      // (length already capped by `createFollowUpTaskSchema`).
      // `input.trigger` is the real value the caller sent (MANUAL by the
      // schema's own default) - previously only consumed to compute
      // `dueAt` above and then discarded; now persisted too.
      priority: input.priority,
      description: input.description,
      trigger: input.trigger,
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
   * already does; absent -> for a CLUSTER-scoped actor (Assistant
   * Pastor), narrowed to `actor.clusterBacentaIds` (`[Milestone C]` Phase
   * 1 decision #11's fix - previously this fell through to the
   * Branch-wide case for every actor, CLUSTER-scoped or not); otherwise
   * BRANCH-wide, for the BRANCH-scoped actor (Resident Pastor, Admin)
   * `FollowUpTaskListForActorResourceContextGuard` already resolved
   * against `actor.branchId`. */
  async list(actor: ActorContext, query: ListFollowUpTasksForActorQuery): Promise<FollowUpTaskResponseDto[]> {
    const statuses = query.status as FollowUpTaskStatus[] | undefined;
    let tasks: FollowUpTask[];
    if (query.groupId) {
      tasks = await this.followUpTaskRepository.listByGroup(query.groupId, statuses);
    } else if (actor.clusterBacentaIds && actor.clusterBacentaIds.length > 0) {
      tasks = await this.followUpTaskRepository.listByGroups(actor.clusterBacentaIds, statuses);
    } else {
      tasks = await this.followUpTaskRepository.listByBranch(actor.branchId, statuses);
    }
    return tasks.map(toResponseDto);
  }

  /** `GET /people/:personId/follow-up-tasks` (Branch Pastor Portal,
   * Pastoral Care sprint) - see `FollowUpTaskRepository.listByPerson`'s
   * own doc comment for why this is every status, newest-first, not the
   * queue's own open-only/SLA-urgency shape. */
  async listByPerson(personId: string): Promise<FollowUpTaskResponseDto[]> {
    const tasks = await this.followUpTaskRepository.listByPerson(personId);
    return tasks.map(toResponseDto);
  }

  async getById(id: string): Promise<FollowUpTaskResponseDto> {
    const task = await this.followUpTaskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`No Follow-up task found with id '${id}'`);
    }
    return toResponseDto(task);
  }

  /**
   * `[Milestone B]` `PATCH /follow-up-tasks/:id` - edits the brief
   * operational fields only. Never touches `status` - each status
   * transition keeps its own dedicated method (`start`/`complete`/
   * `escalate`/`cancel`), the pattern this class already established
   * before this milestone.
   */
  async updateDetails(id: string, input: UpdateFollowUpTaskInput): Promise<FollowUpTaskResponseDto> {
    await this.requireExisting(id);
    const task = await this.followUpTaskRepository.updateDetails(id, {
      priority: input.priority,
      description: input.description,
    });
    return toResponseDto(task);
  }

  /** `[Milestone B]` `OPEN -> IN_PROGRESS` - a Shepherd/Pastor picking up
   * a task they've started acting on but not yet resolved. */
  async start(id: string): Promise<FollowUpTaskResponseDto> {
    const existing = await this.requireTransition(id, 'IN_PROGRESS');
    const task = await this.followUpTaskRepository.updateStatus(existing.id, { status: 'IN_PROGRESS' });
    return toResponseDto(task);
  }

  /** FR-PC-04 acceptance: Shepherd logs an outcome, moving the task to its
   * terminal `COMPLETED` state. `[Milestone B]` now also sets
   * `completedAt`. */
  async complete(id: string): Promise<FollowUpTaskResponseDto> {
    const existing = await this.requireTransition(id, 'COMPLETED');
    const task = await this.followUpTaskRepository.updateStatus(existing.id, { status: 'COMPLETED', completedAt: new Date() });

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
   * scope here. `[Milestone B]` now reachable from `OPEN` or
   * `IN_PROGRESS` (previously `OPEN` only, in effect - see the new
   * `checkFollowUpTaskStatusTransition` graph). */
  async escalate(id: string, escalatedToPersonId: string): Promise<FollowUpTaskResponseDto> {
    const existing = await this.requireTransition(id, 'ESCALATED');
    const task = await this.followUpTaskRepository.updateStatus(existing.id, {
      status: 'ESCALATED',
      escalatedAt: new Date(),
      escalatedToPersonId,
    });
    return toResponseDto(task);
  }

  /**
   * `[Milestone B]` `PATCH /follow-up-tasks/:id/cancel` - reachable from
   * any active state (`OPEN`/`IN_PROGRESS`/`ESCALATED`), never from a
   * terminal one. Reuses `pastoral_care.followup_task.update`, the same
   * action every other status-transition method already requires - no
   * new RBAC action.
   */
  async cancel(id: string): Promise<FollowUpTaskResponseDto> {
    const existing = await this.requireTransition(id, 'CANCELLED');
    const task = await this.followUpTaskRepository.updateStatus(existing.id, { status: 'CANCELLED' });
    return toResponseDto(task);
  }

  private async requireExisting(id: string): Promise<FollowUpTask> {
    const existing = await this.followUpTaskRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No Follow-up task found with id '${id}'`);
    }
    return existing;
  }

  /**
   * `[Milestone B]` Replaces the old 3-state `requireOpenOrEscalated` -
   * every status transition now goes through the real
   * `checkFollowUpTaskStatusTransition` graph (`libs/domain/pastoral-care`),
   * the same "validate against a modeled state machine, not an ad hoc
   * per-method check" discipline `PersonService.transitionLifecycleStage`/
   * `GatheringService.update` already established for their own domains.
   */
  private async requireTransition(id: string, to: FollowUpTaskStatusValue): Promise<FollowUpTask> {
    const existing = await this.requireExisting(id);
    const check = checkFollowUpTaskStatusTransition(existing.status, to);
    if (!check.allowed) {
      throw new ConflictException(check.reason);
    }
    return existing;
  }
}
