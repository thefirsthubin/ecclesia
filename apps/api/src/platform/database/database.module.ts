import { Module } from '@nestjs/common';

import { DatabaseHealthIndicator } from './database-health.indicator';
import { PrismaService } from './prisma.service';

/**
 * `PrismaService` + `DatabaseHealthIndicator` (Sprint 1.3), exported so
 * both `PlatformModule`'s `HealthController` and every future
 * bounded-context module (People, Stewardship, ...) can inject
 * `PrismaService` without each redeclaring the connection lifecycle.
 */
@Module({
  providers: [PrismaService, DatabaseHealthIndicator],
  exports: [PrismaService, DatabaseHealthIndicator],
})
export class DatabaseModule {}
