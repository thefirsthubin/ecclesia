import { Injectable } from '@nestjs/common';
import type { SubmitVisitorIntakeInput, VisitorIntakeResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Prisma, VisitorIntakeSubmission } from '@prisma/client';

import { FollowUpTaskService } from '../../pastoral-care/services/follow-up-task.service';
import { GroupLeadershipService } from '../../people/services/group-leadership.service';
import { PersonService } from '../../people/services/person.service';
import { VisitorIntakeRepository } from '../repositories/visitor-intake.repository';

function toResponseDto(submission: VisitorIntakeSubmission, followUpTaskCreated: boolean): VisitorIntakeResponseDto {
  return {
    id: submission.id,
    branchId: submission.branchId,
    gatheringId: submission.gatheringId,
    personId: submission.personId,
    submittedData: submission.submittedData as Record<string, unknown>,
    createdAt: submission.createdAt.toISOString(),
    followUpTaskCreated,
  };
}

/**
 * FR-GTH-04/BR-GTH-03: "digital visitor forms," replacing the manual
 * paper-card process, creating a Person and (per US-A1/FR-PC-03) an
 * automatic Follow-up task within the same processing cycle.
 *
 * Consumes two cross-module public service interfaces (Blueprint §7.2):
 * People's `PersonService` (create the Person; transition to
 * `FIRST_TIME_GUEST` when confirmed) and `GroupLeadershipService`
 * (resolve a Bacenta preference to its current Shepherd), and Pastoral
 * Care's `FollowUpTaskService` (create the Follow-up task itself).
 *
 * **The Follow-up task is only auto-created when a Bacenta preference is
 * supplied and resolves to an active Shepherd** - US-A2's exact,
 * concretely-specified path ("Given a visitor form indicates a Bacenta
 * preference... then the Follow-up task defaults to the matching
 * Shepherd"). When no preference is given, §19.1 step 3's "rotation among
 * Shepherds" fallback has no buildable algorithm behind it (see
 * `PASTORAL_CARE_DESIGN_NOTES.md`'s open question, restated here since
 * this is the concrete call site that gap blocks) - this service does not
 * invent one. The Person is still created and transitioned correctly
 * either way (FR-GTH-04 is fully satisfied); only the *automatic*
 * Follow-up task creation is conditional. `followUpTaskCreated` on the
 * response tells the caller which case occurred, so a UI can prompt an
 * Usher/Admin to assign one manually when it's `false`.
 */
@Injectable()
export class VisitorIntakeService {
  constructor(
    private readonly visitorIntakeRepository: VisitorIntakeRepository,
    private readonly personService: PersonService,
    private readonly groupLeadershipService: GroupLeadershipService,
    private readonly followUpTaskService: FollowUpTaskService,
  ) {}

  async submit(actor: ActorContext, input: SubmitVisitorIntakeInput): Promise<VisitorIntakeResponseDto> {
    const person = await this.personService.create(actor, {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      overrideDuplicateCheck: false,
    });

    // FR-GTH-04: "creating a new Person at lifecycle_stage = Visitor (or
    // FirstTimeGuest if this is confirmed as their first attendance)."
    // `PersonService.create` always starts at VISITOR (FR-PPL-01's own
    // default) - the transition below is this service's job, not
    // People's, since only the capturing actor at the point of intake
    // knows whether this is a first attendance.
    if (input.firstTimeGuest) {
      await this.personService.transitionLifecycleStage(person.id, { toStage: 'FIRST_TIME_GUEST' });
    }

    let followUpTaskCreated = false;
    if (input.firstTimeGuest && input.bacentaPreferenceGroupId) {
      const shepherdPersonId = await this.groupLeadershipService.getActiveBacentaLeaderPersonId(
        input.bacentaPreferenceGroupId,
      );
      if (shepherdPersonId) {
        await this.followUpTaskService.create(actor, person.id, {
          assignedToPersonId: shepherdPersonId,
          groupId: input.bacentaPreferenceGroupId,
          trigger: 'FIRST_TIME_GUEST',
        });
        followUpTaskCreated = true;
      }
    }

    const submittedData: Prisma.InputJsonValue = {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      howTheyHeard: input.howTheyHeard ?? null,
      firstTimeGuest: input.firstTimeGuest,
      bacentaPreferenceGroupId: input.bacentaPreferenceGroupId ?? null,
    };
    const submission = await this.visitorIntakeRepository.create({
      branchId: actor.branchId,
      gatheringId: input.gatheringId,
      personId: person.id,
      submittedData,
    });

    return toResponseDto(submission, followUpTaskCreated);
  }
}
