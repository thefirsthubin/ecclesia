import { Injectable } from '@nestjs/common';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';

import { PrismaService } from './prisma.service';

/**
 * The `PrismaHealthIndicator` `health.controller.ts`'s Sprint 1.2 doc
 * comment said would land "once there is no database connection yet" -
 * Sprint 1.3 is that milestone. A trivial `SELECT 1` proves the
 * connection pool can actually reach PostgreSQL, which the process being
 * "up" alone does not (a crashed/unreachable database still leaves the
 * Node process running).
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      const status = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown database error',
      });
      throw new HealthCheckError('Database health check failed', status);
    }
  }
}
