import { Controller, Get, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { TenantListResponseDto } from '@ecclesia/contracts';

import { TenantListResourceContextGuard } from '../guards/tenant-list-resource-context.guard';
import { TenantReadService } from '../services/tenant-read.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /platform/tenants` - every Tenant on the platform. Closes the
 * disclosed gap `SystemAdministratorDashboard.tsx`'s own doc comment
 * names: `SYSTEM_ADMINISTRATOR` held `platform.tenant.read` with no
 * backend to exercise it against. `platform/` prefix matches
 * `AuditLogController`/`BranchController`'s own convention for a
 * Platform-owned resource.
 */
@Controller('platform/tenants')
export class TenantController {
  constructor(private readonly tenantReadService: TenantReadService) {}

  @Get()
  @RequirePermission('platform.tenant.read')
  @UseGuards(TenantListResourceContextGuard, RbacGuard)
  list(): Promise<TenantListResponseDto> {
    return this.tenantReadService.list();
  }
}
