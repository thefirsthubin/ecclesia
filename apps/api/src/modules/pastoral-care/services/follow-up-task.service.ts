import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { computeFollowUpTaskDueAt } from '@ecclesia/domain-pastoral-care';
import type { FollowUpTaskTrigger } from '@ecclesia/domain-pastoral-care';
import type { CreateFollowUpTaskInput, FollowUpTaskResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { FollowUpTask } from '@prisma/client';

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
