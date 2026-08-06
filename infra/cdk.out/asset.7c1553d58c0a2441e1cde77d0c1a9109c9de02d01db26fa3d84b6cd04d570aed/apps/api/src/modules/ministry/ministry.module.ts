import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { GatheringsModule } from '../gatherings/gatherings.module';
import { PeopleModule } from '../people/people.module';
import { RosterController } from './controllers/roster.controller';
import { StaffingTargetController } from './controllers/staffing-target.controller';
import { WorkerAvailabilityController } from './controllers/worker-availability.controller';
import { RosterResourceContextGuard } from './guards/roster-resource-context.guard';
import {
  StaffingTargetCreateResourceContextGuard,
  StaffingTargetResourceContextGuard,
} from './guards/staffing-target-resource-context.guard';
import { WorkerAvailabilityResourceContextGuard } from './guards/worker-availability-resource-context.guard';
import { StaffingTargetRepository } from './repositories/staffing-target.repository';
import { WorkerAvailabilityRepository } from './repositories/worker-availability.repository';
import { RosterService } from './services/roster.service';
import { StaffingTargetService } from './services/staffing-target.service';
import { WorkerAvailabilityService } from './services/worker-availability.service';

/**
 * MinistryModule (PRD §13.3 / Blueprint §4.2 module inventory) - the
 * sixth and last bounded-context module in the locked roadmap. Internal
 * layout mirrors every prior module's own doc comment.
 *
 * **Basonta creation (FR-MIN-01) is not reimplemented here.** It is
 * already fully functional through People's existing
 * `GroupController`/`GroupService`/`GroupRepository` - `Group.type` is a
 * plain, ungated parameter, so `type: 'MINISTRY'` already works today
 * with no repository changes. Likewise, roster add/remove is People's
 * existing `GroupMembershipController`/`GroupMembershipService`,
 * unchanged. This module owns only what's genuinely new: staffing
 * targets/adequacy (FR-MIN-02/03), worker availability (§16.3 H2), and
 * the roster/overcommitment *views* (FR-MIN-01/04) built on top of
 * People's data via its newly-exported `GroupRosterService`.
 *
 * Imports `PeopleModule` (for `GroupScopeService`, `GroupRosterService`)
 * and, for the first time in this codebase, `GatheringsModule` (for the
 * newly-exported `GatheringScopeService`, validating a `StaffingTarget`'s
 * `gatheringId` reference) - both as ordinary imports, no `forwardRef`;
 * neither People nor Gatherings needs anything from Ministry. See
 * `MINISTRY_DESIGN_NOTES.md`.
 *
 * Exports nothing - no other bounded-context module currently consumes a
 * Ministry service.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, PeopleModule, GatheringsModule],
  controllers: [StaffingTargetController, WorkerAvailabilityController, RosterController],
  providers: [
    StaffingTargetRepository,
    WorkerAvailabilityRepository,
    StaffingTargetService,
    WorkerAvailabilityService,
    RosterService,
    StaffingTargetCreateResourceContextGuard,
    StaffingTargetResourceContextGuard,
    WorkerAvailabilityResourceContextGuard,
    RosterResourceContextGuard,
  ],
})
export class MinistryModule {}
