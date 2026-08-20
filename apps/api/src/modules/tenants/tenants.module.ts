import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { TenantController } from './controllers/tenant.controller';
import { TenantListResourceContextGuard } from './guards/tenant-list-resource-context.guard';
import { TenantReadRepository } from './repositories/tenant-read.repository';
import { TenantReadService } from './services/tenant-read.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` The read-side
 * bounded-context module for `GET /platform/tenants`, mirroring
 * `BranchesModule`/`AuditLogModule`'s own reasoning for why this is a
 * standalone module rather than folded into `PlatformModule`: this
 * module implements one real, named capability (`SYSTEM_ADMINISTRATOR`'s
 * only grant, `platform.tenant.read`), not cross-cutting infrastructure.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule],
  controllers: [TenantController],
  providers: [TenantReadRepository, TenantReadService, TenantListResourceContextGuard],
})
export class TenantsModule {}
