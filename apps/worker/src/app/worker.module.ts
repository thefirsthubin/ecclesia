import { Module } from '@nestjs/common';

import { AuditConsumerModule } from '../consumers/audit/audit-consumer.module';
import { InsightsConsumerModule } from '../consumers/insights/insights-consumer.module';
import { NotificationConsumerModule } from '../consumers/notification/notification-consumer.module';
import { AttendanceCompletenessSweepModule } from '../jobs/attendance-completeness-sweep/attendance-completeness-sweep.module';
import { ChurchPulseRecomputeModule } from '../jobs/church-pulse-recompute/church-pulse-recompute.module';
import { FollowUpSlaSweepModule } from '../jobs/follow-up-sla-sweep/follow-up-sla-sweep.module';
import { SilentDriftSweepModule } from '../jobs/silent-drift-sweep/silent-drift-sweep.module';
import { WorkerPlatformModule } from '../platform/platform.module';

/**
 * Root module for apps/worker. Mirrors `apps/api/src/app/app.module.ts`'s
 * own role - `WorkerPlatformModule` is the foundation (config, logging,
 * database). The first vertical-slice milestone added
 * `InsightsConsumerModule` and `SilentDriftSweepModule` (one consumer,
 * one sweep job, to prove the pattern end-to-end); this follow-up
 * milestone completes Blueprint §10.2/§10.8's full inventory with the
 * remaining two consumers (`NotificationConsumerModule`,
 * `AuditConsumerModule`) and three sweep jobs
 * (`ChurchPulseRecomputeModule`, `FollowUpSlaSweepModule`,
 * `AttendanceCompletenessSweepModule`) - see `WORKER_DESIGN_NOTES.md`.
 * All are imported unconditionally here; `command.ts`'s dispatcher
 * decides at runtime which one actually does anything for a given process
 * invocation (Blueprint ADR-007: apps/worker is one deployable image, not
 * a separate container per job/consumer - the *command* passed to that
 * image at ECS task-definition level is what varies).
 */
@Module({
  imports: [
    WorkerPlatformModule,
    InsightsConsumerModule,
    NotificationConsumerModule,
    AuditConsumerModule,
    SilentDriftSweepModule,
    ChurchPulseRecomputeModule,
    FollowUpSlaSweepModule,
    AttendanceCompletenessSweepModule,
  ],
})
export class WorkerModule {}
