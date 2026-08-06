import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AuditLogService } from './audit-log.service';

/**
 * `AuditLogService` (Sprint 1.4), exported so `AuthModule` and every
 * future bounded-context module can write to `platform.audit_log` through
 * one shared writer rather than each reimplementing it.
 */
@Module({
  imports: [DatabaseModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
