import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PastoralCareModule } from '../modules/pastoral-care/pastoral-care.module';
import { PeopleModule } from '../modules/people/people.module';
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
 * `PeopleModule` and `PastoralCareModule` import each other
 * (`forwardRef`) for their bidirectional public-service dependency - see
 * both modules' own doc comments. The remaining three (Ministry,
 * Gatherings, Stewardship, Insights) are still unbuilt.
 */
@Module({
  imports: [PlatformModule, PeopleModule, PastoralCareModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
