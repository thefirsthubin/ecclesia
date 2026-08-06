import { Module } from '@nestjs/common';

import { FollowUpSlaSweepJob } from './follow-up-sla-sweep.job';
import { FollowUpSlaSweepRepository } from './follow-up-sla-sweep.repository';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [FollowUpSlaSweepRepository, FollowUpSlaSweepJob],
  exports: [FollowUpSlaSweepJob],
})
export class FollowUpSlaSweepModule {}
