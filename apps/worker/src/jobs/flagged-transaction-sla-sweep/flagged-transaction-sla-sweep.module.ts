import { Module } from '@nestjs/common';

import { FlaggedTransactionSlaSweepJob } from './flagged-transaction-sla-sweep.job';
import { FlaggedTransactionSlaSweepRepository } from './flagged-transaction-sla-sweep.repository';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [FlaggedTransactionSlaSweepRepository, FlaggedTransactionSlaSweepJob],
  exports: [FlaggedTransactionSlaSweepJob],
})
export class FlaggedTransactionSlaSweepModule {}
