import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { GroupMembershipController } from './controllers/group-membership.controller';
import { PersonController } from './controllers/person.controller';
import { RoleAssignmentController } from './controllers/role-assignment.controller';
import { GroupMembershipResourceContextGuard } from './guards/group-membership-resource-context.guard';
import { PersonCreateResourceContextGuard, PersonResourceContextGuard } from './guards/person-resource-context.guard';
import { GroupMembershipRepository } from './repositories/group-membership.repository';
import { PersonRepository } from './repositories/person.repository';
import { RoleAssignmentRepository } from './repositories/role-assignment.repository';
import { GroupMembershipService } from './services/group-membership.service';
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
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule],
  controllers: [PersonController, GroupMembershipController, RoleAssignmentController],
  providers: [
    PersonRepository,
    GroupMembershipRepository,
    RoleAssignmentRepository,
    PersonService,
    GroupMembershipService,
    RoleAssignmentService,
    PersonResourceContextGuard,
    PersonCreateResourceContextGuard,
    GroupMembershipResourceContextGuard,
  ],
})
export class PeopleModule {}
