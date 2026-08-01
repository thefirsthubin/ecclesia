import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
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
 * see `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`. The
 * remaining five (Pastoral Care, Ministry, Gatherings, Stewardship,
 * Insights) are still unbuilt.
 */
@Module({
  imports: [PlatformModule, PeopleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
