import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PeopleModule } from '../people/people.module';
import { FollowUpTaskController } from './controllers/follow-up-task.controller';
import { PastoralNoteController } from './controllers/pastoral-note.controller';
import { PoimenEnrollmentController } from './controllers/poimen-enrollment.controller';
import { SilentDriftFlagController } from './controllers/silent-drift-flag.controller';
import {
  FollowUpTaskCreateResourceContextGuard,
  FollowUpTaskListForActorResourceContextGuard,
  FollowUpTaskListResourceContextGuard,
  FollowUpTaskResourceContextGuard,
} from './guards/follow-up-task-resource-context.guard';
import { PastoralNoteResourceContextGuard } from './guards/pastoral-note-resource-context.guard';
import { PoimenEnrollmentResourceContextGuard } from './guards/poimen-enrollment-resource-context.guard';
import {
  SilentDriftFlagListForActorResourceContextGuard,
  SilentDriftFlagListResourceContextGuard,
} from './guards/silent-drift-flag-resource-context.guard';
import { FollowUpTaskRepository } from './repositories/follow-up-task.repository';
import { PastoralNoteRepository } from './repositories/pastoral-note.repository';
import { PoimenEnrollmentRepository } from './repositories/poimen-enrollment.repository';
import { SilentDriftFlagRepository } from './repositories/silent-drift-flag.repository';
import { FollowUpTaskService } from './services/follow-up-task.service';
import { PastoralNoteService } from './services/pastoral-note.service';
import { PoimenEnrollmentService } from './services/poimen-enrollment.service';
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
  controllers: [PoimenEnrollmentController, FollowUpTaskController, PastoralNoteController, SilentDriftFlagController],
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
