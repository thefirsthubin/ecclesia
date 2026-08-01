import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlatformModule } from '../platform/platform.module';

/**
 * Root module. Bounded-context modules (Blueprint Ch.1 §4.2 module
 * inventory: PeopleModule, PastoralCareModule, MinistryModule,
 * GatheringsModule, StewardshipModule, InsightsModule, PlatformModule)
 * are registered in `imports` here as each is built.
 *
 * `PlatformModule` (Sprint 1.2) is the first: config, structured logging,
 * the `/health` endpoint, and the workspace-wide exception filter. The
 * remaining six are still unbuilt - People and the rest land after
 * Sprints 1.3 (database) and 1.4 (authentication), per the locked
 * roadmap.
 */
@Module({
  imports: [PlatformModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
