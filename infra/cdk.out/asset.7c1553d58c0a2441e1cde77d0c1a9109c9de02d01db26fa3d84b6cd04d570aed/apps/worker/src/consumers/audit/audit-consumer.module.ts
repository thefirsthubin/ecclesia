import { Module } from '@nestjs/common';

import { WorkerAuditLogRepository } from './audit-log.repository';
import { AuditConsumer } from './audit.consumer';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [WorkerAuditLogRepository, AuditConsumer],
  exports: [AuditConsumer],
})
export class AuditConsumerModule {}
