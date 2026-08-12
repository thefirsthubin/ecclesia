import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from '../modules/audit-log/audit-log.module';
import { ConfigurationModule } from '../modules/configuration/configuration.module';
import { GatheringsModule } from '../modules/gatherings/gatherings.module';
import { InsightsModule } from '../modules/insights/insights.module';
import { MinistryModule } from '../modules/ministry/ministry.module';
import { PastoralCareModule } from '../modules/pastoral-care/pastoral-care.module';
import { PeopleModule } from '../modules/people/people.module';
import { StewardshipModule } from '../modules/stewardship/stewardship.module';
import { PlatformModule } from '../platform/platform.module';

/**
 * Root module. Bounded-context modules (Blueprint Ch.1 §4.2 module
 * inventory: PeopleModule, PastoralCareModule, MinistryModule,
 * GatheringsModule, StewardshipModule, InsightsModule, PlatformModule)
 * are registered in `imports` here as each is built.
 *
 * `PlatformModule` (Sprint 1.2) is the foundation: config, structured
 * logging, the `/health` endpoint, database, authentication, and the
 * workspace-wide exception filter. `PeopleModule` (People domain
 * milestone) is the first bounded-context module built on top of it -
 * see `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`.
 * `PastoralCareModule` (Pastoral Care domain milestone) is the second -
 * see `apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`.
 * `GatheringsModule` (Gatherings domain milestone) is the third - see
 * `apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md`.
 * `StewardshipModule` (Stewardship domain milestone) is the fourth - see
 * `apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md`.
 * `InsightsModule` (Insights domain milestone) is the fifth - see
 * `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 * `MinistryModule` (Ministry domain milestone) is the sixth - see
 * `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
 * `ConfigurationModule` (Branch Configuration milestone) is the seventh -
 * see that module's own doc comment for why it isn't folded into
 * `PlatformModule` despite sharing its `platform.*` RBAC action prefix.
 * `AuditLogModule` (Audit Log milestone) is the eighth, the read side of
 * `platform.audit_log` - same reasoning as `ConfigurationModule` for
 * staying out of `PlatformModule`, see its own doc comment.
 * `PeopleModule` and `PastoralCareModule` import each other
 * (`forwardRef`) for their bidirectional public-service dependency - see
 * both modules' own doc comments. `GatheringsModule`, `StewardshipModule`,
 * `InsightsModule`, and `MinistryModule` each import `PeopleModule`
 * normally (no cycle); `MinistryModule` additionally imports
 * `GatheringsModule` normally. `ConfigurationModule`/`AuditLogModule`
 * import neither - each one's own guard needs only
 * `RbacPlatformModule`/`DatabaseModule`.
 */
@Module({
  imports: [
    PlatformModule,
    PeopleModule,
    PastoralCareModule,
    GatheringsModule,
    StewardshipModule,
    InsightsModule,
    MinistryModule,
    ConfigurationModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
