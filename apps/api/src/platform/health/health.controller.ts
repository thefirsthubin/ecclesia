import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import type { HealthCheckResult } from '@nestjs/terminus';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

import { DatabaseHealthIndicator } from '../database/database-health.indicator';
import { Public } from '../auth/decorators/public.decorator';

const HEAP_THRESHOLD_BYTES = 300 * 1024 * 1024;
// RSS needs meaningfully more headroom than heap: it also covers V8
// engine overhead and native addons (e.g. @swc/core's binary), which sit
// outside the JS heap entirely. A 300MB RSS ceiling tripped on real
// startup (confirmed empirically, Sprint 1.2 verification: "Used rss
// exceeded the set threshold" against a perfectly healthy process). This
// is a starting point, not a tuned production value - revisit once the
// ECS Fargate task's actual memory allocation is known (Blueprint Ch.5
// infra milestone).
const RSS_THRESHOLD_BYTES = 512 * 1024 * 1024;

/**
 * `GET /health`. Deliberately `VERSION_NEUTRAL` - unlike every business
 * endpoint (Blueprint §14.7's `/v1/...` convention), a load balancer or
 * container orchestrator's health check should not need to track an API
 * version bump. This is the one endpoint in the service that
 * infrastructure, not a client, calls.
 *
 * Sprint 1.2 shipped only process-level checks (heap/RSS memory) because
 * there was no database connection yet. Sprint 1.3 adds
 * `DatabaseHealthIndicator` so the check reflects real downstream health,
 * not just "the Node process is still running" - a crashed or
 * unreachable PostgreSQL instance now fails this check.
 *
 * `@Public()` (Sprint 1.4): ECS/ALB health checks cannot present a
 * Cognito access token, and `AuthGuard` is applied globally - without this
 * opt-out, infrastructure health monitoring would itself be broken by the
 * authentication rollout. See `Public()`'s own doc comment for why this
 * should stay the only such exemption.
 */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', HEAP_THRESHOLD_BYTES),
      () => this.memory.checkRSS('memory_rss', RSS_THRESHOLD_BYTES),
      () => this.database.isHealthy('database'),
    ]);
  }
}
