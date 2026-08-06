import { Module } from '@nestjs/common';

import { SilentDriftSweepJob } from './silent-drift-sweep.job';
import { SilentDriftSweepRepository } from './silent-drift-sweep.repository';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [SilentDriftSweepRepository, SilentDriftSweepJob],
  exports: [SilentDriftSweepJob],
})
export class SilentDriftSweepModule {}
