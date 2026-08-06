import { Module } from '@nestjs/common';

import { PledgeReminderSweepJob } from './pledge-reminder-sweep.job';
import { PledgeReminderSweepRepository } from './pledge-reminder-sweep.repository';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [PledgeReminderSweepRepository, PledgeReminderSweepJob],
  exports: [PledgeReminderSweepJob],
})
export class PledgeReminderSweepModule {}
