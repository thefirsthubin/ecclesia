import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PeopleModule } from '../people/people.module';
import { OutreachContactController } from './controllers/outreach-contact.controller';
import { OutreachController } from './controllers/outreach.controller';
import {
  OutreachContactCreateResourceContextGuard,
  OutreachContactResourceContextGuard,
} from './guards/outreach-contact-resource-context.guard';
import {
  OutreachCreateResourceContextGuard,
  OutreachListResourceContextGuard,
  OutreachResourceContextGuard,
} from './guards/outreach-resource-context.guard';
import { OutreachContactRepository } from './repositories/outreach-contact.repository';
import { OutreachRepository } from './repositories/outreach.repository';
import { OutreachContactService } from './services/outreach-contact.service';
import { OutreachService } from './services/outreach.service';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` OutreachModule
 * - the fifth bounded-context module, following `PeopleModule`/
 * `PastoralCareModule`/`GatheringsModule`/`StewardshipModule`'s own
 * per-bounded-context internal layout exactly (`controllers/`,
 * `services/`, `repositories/`, `guards/`, no `dto/` folder - see
 * `PeopleModule`'s own doc comment for why).
 *
 * Imports `PeopleModule` as an ordinary import (no `forwardRef`) for its
 * exported `GroupScopeService` (resolving an Outreach event's scope from
 * its optional `groupId`, the same cross-module pattern `GatheringsModule`/
 * `StewardshipModule` already established) and `PersonService`
 * (`OutreachContactService.promote`'s lazy-Person-creation call, reusing
 * FR-PPL-02's duplicate detection rather than reimplementing it) - People
 * needs nothing from Outreach, so there is no cycle to break.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, PeopleModule],
  controllers: [OutreachController, OutreachContactController],
  providers: [
    OutreachRepository,
    OutreachContactRepository,
    OutreachService,
    OutreachContactService,
    OutreachCreateResourceContextGuard,
    OutreachListResourceContextGuard,
    OutreachResourceContextGuard,
    OutreachContactCreateResourceContextGuard,
    OutreachContactResourceContextGuard,
  ],
})
export class OutreachModule {}
