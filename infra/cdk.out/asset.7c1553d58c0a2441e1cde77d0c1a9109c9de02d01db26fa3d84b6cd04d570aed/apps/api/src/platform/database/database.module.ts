import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { BranchScopeInterceptor } from './branch-scope.interceptor';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { PrismaRootService } from './prisma-root.service';
import { PrismaService } from './prisma.service';

/**
 * `PrismaService` + `DatabaseHealthIndicator` (Sprint 1.3), exported so
 * both `PlatformModule`'s `HealthController` and every future
 * bounded-context module (People, Stewardship, ...) can inject
 * `PrismaService` without each redeclaring the connection lifecycle.
 *
 * `[Row-Level Security sprint]` `PrismaRootService` added - see that
 * class's own doc comment for exactly which two call sites should inject
 * it instead of `PrismaService`, and why it exists at all.
 *
 * `[Row-Level Security sprint]` `BranchScopeInterceptor` registered as a
 * global `APP_INTERCEPTOR` here, not in `PlatformModule` or `AuthModule` -
 * it depends directly on `PrismaService` (this module's own provider) and
 * nothing from either of those two modules, matching this codebase's
 * existing "a cross-cutting global provider lives alongside the thing it
 * wraps" precedent (`AuthModule` registers `AuthGuard` as `APP_GUARD`
 * right next to the auth services `AuthGuard` itself depends on).
 * `DatabaseModule` is already imported by `AuthModule`, `AuditModule`, and
 * every bounded-context module, so this reaches every route exactly once
 * regardless of which module actually declares the controller.
 */
@Module({
  providers: [
    PrismaService,
    PrismaRootService,
    DatabaseHealthIndicator,
    { provide: APP_INTERCEPTOR, useClass: BranchScopeInterceptor },
  ],
  exports: [PrismaService, PrismaRootService, DatabaseHealthIndicator],
})
export class DatabaseModule {}
