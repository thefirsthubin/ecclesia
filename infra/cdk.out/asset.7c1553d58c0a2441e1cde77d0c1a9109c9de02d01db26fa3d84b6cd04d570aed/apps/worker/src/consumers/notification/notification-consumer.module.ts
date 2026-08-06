import { Module } from '@nestjs/common';

import { NotificationConsumer } from './notification.consumer';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [NotificationConsumer],
  exports: [NotificationConsumer],
})
export class NotificationConsumerModule {}
