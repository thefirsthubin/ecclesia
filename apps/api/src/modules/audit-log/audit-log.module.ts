import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogResourceContextGuard } from './guards/audit-log-resource-context.guard';
import { AuditLogReadRepository } from './repositories/audit-log-read.repository';
import { AuditLogReadService } from './services/audit-log-read.service';

/**
 * `[Audit Log milestone]` The read-side bounded-context module for PRD
 * §17.3's Audit Log row, mirroring `ConfigurationModule`'s reasoning for
 * why this is not folded into `PlatformModule` despite the `platform.*`
 * RBAC action prefix: this module implements a real, named PRD capability
 * ("single view, attributed+timestamped"), not cross-cutting
 * infrastructure. The *write* side (`AuditLogService.record`) stays in
 * `platform/audit` - it is called from cross-cutting infrastructure
 * (`AuthGuard`, `AllExceptionsFilter`), not from a domain module, so it
 * correctly stays where `PlatformModule`'s own scope rule puts it.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule],
  controllers: [AuditLogController],
  providers: [AuditLogReadRepository, AuditLogReadService, AuditLogResourceContextGuard],
})
export class AuditLogModule {}
