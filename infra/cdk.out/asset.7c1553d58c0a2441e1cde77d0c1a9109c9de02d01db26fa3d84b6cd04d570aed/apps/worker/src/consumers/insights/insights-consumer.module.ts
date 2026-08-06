import { Module } from '@nestjs/common';

import { WorkerEngagementSignalRepository } from './engagement-signal.repository';
import { InsightsConsumer } from './insights.consumer';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [WorkerEngagementSignalRepository, InsightsConsumer],
  exports: [InsightsConsumer],
})
export class InsightsConsumerModule {}
