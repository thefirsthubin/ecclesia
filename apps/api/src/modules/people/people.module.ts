import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PastoralCareModule } from '../pastoral-care/pastoral-care.module';
import { GroupController } from './controllers/group.controller';
import { GroupMembershipController } from './controllers/group-membership.controller';
import { PersonController } from './controllers/person.controller';
import { RoleAssignmentController } from './controllers/role-assignment.controller';
import { GroupCreateResourceContextGuard, GroupResourceContextGuard } from './guards/group-resource-context.guard';
import { GroupMembershipResourceContextGuard } from './guards/group-membership-resource-context.guard';
import { PersonCreateResourceContextGuard, PersonResourceContextGuard } from './guards/person-resource-context.guard';
import { GroupRepository } from './repositories/group.repository';
import { GroupMembershipRepository } from './repositories/group-membership.repository';
import { PersonRepository } from './repositories/person.repository';
import { RoleAssignmentRepository } from './repositories/role-assignment.repository';
import { GroupService } from './services/group.service';
import { GroupMembershipService } from './services/group-membership.service';
import { PersonScopeService } from './services/person-scope.service';
import { PersonService } from './services/person.service';
import { RoleAssignmentService } from './services/role-assignment.service';

/**
 * PeopleModule (PRD §13.1 / Blueprint §4.2 module inventory) - the first
 * bounded-context module built on top of the Platform foundation (Sprint
 * 1.2), Database (Sprint 1.3), and Authentication (Sprint 1.4)
 * milestones. Internal layout follows Blueprint §6.4's per-bounded-context
 * structure (`controllers/`, `services/`, `repositories/`, `guards/`) -
 * with one deliberate deviation: no `dto/` folder. Blueprint §6.4's own
 * sketch shows `dto/` "import[ing] shared types from libs/contracts,
 * add[ing] Nest-specific validation decorators only where needed" - but
 * this codebase's actual contract strategy (`libs/contracts`' own README,
 * `apps/api/src/platform/pipes/zod-validation.pipe.ts`) is Zod schemas
 * consumed directly by `ZodValidationPipe`, with no class-validator
 * decorators anywhere in the codebase to add. A `dto/` folder here would
 * only re-export `libs/contracts` types under a different path, adding
 * indirection with no behavior - see `PEOPLE_DESIGN_NOTES.md`.
 *
 * **Why `forwardRef(() => PastoralCareModule)`.** `RoleAssignmentService`
 * (below) injects Pastoral Care's exported `PoimenEnrollmentService` for
 * the `POIMEN_GATE_IF_ENABLED` check, instead of querying
 * `pastoral_care.poimen_enrollments` directly (the module-boundary
 * violation this milestone fixes). `PastoralCareModule` in turn imports
 * *this* module for `PersonScopeService`. See `PastoralCareModule`'s own
 * doc comment for the full `forwardRef` rationale - it applies
 * symmetrically here.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, forwardRef(() => PastoralCareModule)],
  controllers: [PersonController, GroupController, GroupMembershipController, RoleAssignmentController],
  providers: [
    PersonRepository,
    GroupRepository,
    GroupMembershipRepository,
    RoleAssignmentRepository,
    PersonService,
    PersonScopeService,
    GroupService,
    GroupMembershipService,
    RoleAssignmentService,
    PersonResourceContextGuard,
    PersonCreateResourceContextGuard,
    GroupResourceContextGuard,
    GroupCreateResourceContextGuard,
    GroupMembershipResourceContextGuard,
  ],
  // `PersonScopeService` is People's public service interface (Blueprint
  // §7.2) for other bounded-context modules whose resources reference a
  // Person - specifically Pastoral Care, whose FollowUpTask, PastoralNote,
  // and PoimenEnrollment resource-context guards all need the same
  // Person-scope resolution this module already implements. Only this one
  // service is exported - repositories stay private, per the schema-
  // ownership rule (Blueprint §7.2, `PEOPLE_DESIGN_NOTES.md`).
  exports: [PersonScopeService],
})
export class PeopleModule {}
