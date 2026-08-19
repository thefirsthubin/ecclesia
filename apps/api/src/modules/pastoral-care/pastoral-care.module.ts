import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PeopleModule } from '../people/people.module';
import { CounsellingSessionController, CounsellingSessionStatusController } from './controllers/counselling-session.controller';
import { FollowUpTaskController } from './controllers/follow-up-task.controller';
import { MemberInteractionController } from './controllers/member-interaction.controller';
import { PastoralActivitySummaryController } from './controllers/pastoral-activity-summary.controller';
import { PastoralCalendarController } from './controllers/pastoral-calendar.controller';
import { PastoralNoteController } from './controllers/pastoral-note.controller';
import { PoimenEnrollmentController } from './controllers/poimen-enrollment.controller';
import { PrayerNoteController, PrayerNoteStatusController } from './controllers/prayer-note.controller';
import { SilentDriftFlagController } from './controllers/silent-drift-flag.controller';
import {
  CounsellingSessionResourceContextGuard,
  CounsellingSessionStatusResourceContextGuard,
} from './guards/counselling-session-resource-context.guard';
import {
  FollowUpTaskCreateResourceContextGuard,
  FollowUpTaskListForActorResourceContextGuard,
  FollowUpTaskListResourceContextGuard,
  FollowUpTaskResourceContextGuard,
} from './guards/follow-up-task-resource-context.guard';
import { MemberInteractionResourceContextGuard } from './guards/member-interaction-resource-context.guard';
import { PastoralActivitySummaryResourceContextGuard } from './guards/pastoral-activity-summary-resource-context.guard';
import { PastoralCalendarResourceContextGuard } from './guards/pastoral-calendar-resource-context.guard';
import { PastoralNoteResourceContextGuard } from './guards/pastoral-note-resource-context.guard';
import { PoimenEnrollmentResourceContextGuard } from './guards/poimen-enrollment-resource-context.guard';
import {
  PrayerNoteResourceContextGuard,
  PrayerNoteStatusResourceContextGuard,
} from './guards/prayer-note-resource-context.guard';
import {
  SilentDriftFlagListForActorResourceContextGuard,
  SilentDriftFlagListResourceContextGuard,
} from './guards/silent-drift-flag-resource-context.guard';
import { CounsellingSessionRepository } from './repositories/counselling-session.repository';
import { FollowUpTaskRepository } from './repositories/follow-up-task.repository';
import { MemberInteractionRepository } from './repositories/member-interaction.repository';
import { PastoralNoteRepository } from './repositories/pastoral-note.repository';
import { PoimenEnrollmentRepository } from './repositories/poimen-enrollment.repository';
import { PrayerNoteRepository } from './repositories/prayer-note.repository';
import { SilentDriftFlagRepository } from './repositories/silent-drift-flag.repository';
import { CounsellingSessionService } from './services/counselling-session.service';
import { FollowUpTaskService } from './services/follow-up-task.service';
import { MemberInteractionService } from './services/member-interaction.service';
import { PastoralActivitySummaryService } from './services/pastoral-activity-summary.service';
import { PastoralCalendarService } from './services/pastoral-calendar.service';
import { PastoralNoteService } from './services/pastoral-note.service';
import { PoimenEnrollmentService } from './services/poimen-enrollment.service';
import { PrayerNoteService } from './services/prayer-note.service';
import { SilentDriftFlagService } from './services/silent-drift-flag.service';

/**
 * PastoralCareModule (PRD §13.2 / Blueprint §4.2 module inventory).
 * Internal layout mirrors `PeopleModule`'s own doc comment
 * (`controllers/`, `services/`, `repositories/`, `guards/`, no `dto/`).
 *
 * **Why `forwardRef(() => PeopleModule)`.** This module's own
 * resource-context guards (`PoimenEnrollmentResourceContextGuard`, and
 * the FollowUpTask/PastoralNote guards to follow) need People's exported
 * `PersonScopeService` to resolve "which Bacenta/Basonta is this resource
 * about," rather than duplicating that lookup or reaching into People's
 * `PersonRepository` directly (Blueprint §7.2). Symmetrically,
 * `PeopleModule` imports *this* module (also via `forwardRef`) so its own
 * `RoleAssignmentService` can inject `PoimenEnrollmentService` instead of
 * querying `pastoral_care.poimen_enrollments` directly, which is exactly
 * the module-boundary violation this milestone fixes - see
 * `PASTORAL_CARE_DESIGN_NOTES.md`. Two modules needing each other's public
 * service is a genuine bidirectional dependency between these bounded
 * contexts, not an accident of file organization - `forwardRef` is Nest's
 * documented mechanism for exactly this case (both `@Module()` decorators
 * reference each other, but no individual provider's constructor forms an
 * unresolvable cycle: `PoimenEnrollmentService` itself injects nothing
 * from People).
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, EventsModule, forwardRef(() => PeopleModule)],
  controllers: [
    PoimenEnrollmentController,
    FollowUpTaskController,
    PastoralNoteController,
    PrayerNoteController,
    PrayerNoteStatusController,
    CounsellingSessionController,
    CounsellingSessionStatusController,
    MemberInteractionController,
    PastoralCalendarController,
    PastoralActivitySummaryController,
    SilentDriftFlagController,
  ],
  providers: [
    PoimenEnrollmentRepository,
    PoimenEnrollmentService,
    PoimenEnrollmentResourceContextGuard,
    FollowUpTaskRepository,
    FollowUpTaskService,
    FollowUpTaskCreateResourceContextGuard,
    FollowUpTaskResourceContextGuard,
    FollowUpTaskListResourceContextGuard,
    FollowUpTaskListForActorResourceContextGuard,
    PastoralNoteRepository,
    PastoralNoteService,
    PastoralNoteResourceContextGuard,
    PrayerNoteRepository,
    PrayerNoteService,
    PrayerNoteResourceContextGuard,
    PrayerNoteStatusResourceContextGuard,
    CounsellingSessionRepository,
    CounsellingSessionService,
    CounsellingSessionResourceContextGuard,
    CounsellingSessionStatusResourceContextGuard,
    MemberInteractionRepository,
    MemberInteractionService,
    MemberInteractionResourceContextGuard,
    PastoralCalendarService,
    PastoralCalendarResourceContextGuard,
    PastoralActivitySummaryService,
    PastoralActivitySummaryResourceContextGuard,
    SilentDriftFlagRepository,
    SilentDriftFlagService,
    SilentDriftFlagListResourceContextGuard,
    SilentDriftFlagListForActorResourceContextGuard,
  ],
  // `FollowUpTaskService` is additionally exported (Gatherings milestone)
  // so `VisitorIntakeService` (FR-GTH-04) can auto-create a Follow-up task
  // for US-A2's Bacenta-preference path without reaching into
  // `FollowUpTaskRepository` directly.
  exports: [PoimenEnrollmentService, FollowUpTaskService],
})
export class PastoralCareModule {}
