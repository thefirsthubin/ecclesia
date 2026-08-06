import { Module } from '@nestjs/common';

import { ChurchPulseRecomputeJob } from './church-pulse-recompute.job';
import { ChurchPulseRecomputeRepository } from './church-pulse-recompute.repository';
import { WorkerDatabaseModule } from '../../platform/database/database.module';

/** No `EventsModule` import - unlike `SilentDriftSweepModule`, this job
 * publishes no Engagement Signal (see `ChurchPulseRecomputeJob`'s own doc
 * comment), so it needs only `WorkerDatabaseModule`'s `PrismaService`. */
@Module({
  imports: [WorkerDatabaseModule],
  providers: [ChurchPulseRecomputeRepository, ChurchPulseRecomputeJob],
  exports: [ChurchPulseRecomputeJob],
})
export class ChurchPulseRecomputeModule {}
