import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { evaluateSilentDrift } from '@ecclesia/domain-pastoral-care';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { SilentDriftSweepRepository } from './silent-drift-sweep.repository';
import { EventBridgePublisherService } from '../../platform/events/eventbridge-publisher.service';

/**
 * The silent-drift sweep (Blueprint §10.8: "Amazon EventBridge Scheduler
 * triggering the Worker service, e.g., nightly for silent-drift"). Chosen
 * as this milestone's one sweep job because it was the most-cited dormant
 * piece across the whole codebase - `evaluateSilentDrift()`
 * (`libs/domain/pastoral-care`) has been ready-to-consume, with zero real
 * callers, since the Pastoral Care domain milestone, and
 * `GATHERINGS_DESIGN_NOTES.md`'s own "what this milestone deliberately
 * does not build" section names this exact gap by name ("wiring
 * `evaluateSilentDrift()` up to real attendance counts is Pastoral Care's
 * own follow-up work").
 *
 * For every Branch: loads its N/M thresholds, evaluates every Person with
 * an open Bacenta membership against the pure decision function, and for
 * every newly-flagged Person (skipping anyone who already has an open,
 * unresolved flag) writes a `SilentDriftFlag` row and publishes a
 * synthetic `pastoral_care.silent_drift_flagged` Engagement Signal onto
 * the shared bus (§10.8: "emits a synthetic Engagement Signal onto the
 * same bus... rather than calling the Notification service directly,
 * keeping exactly one downstream reaction mechanism regardless of trigger
 * source").
 */
@Injectable()
export class SilentDriftSweepJob {
  static readonly SIGNAL_TYPE = 'pastoral_care.silent_drift_flagged';
  static readonly SCHEMA_VERSION = 1;

  constructor(
    private readonly repository: SilentDriftSweepRepository,
    private readonly publisher: EventBridgePublisherService,
    @InjectPinoLogger(SilentDriftSweepJob.name) private readonly logger: PinoLogger,
  ) {}

  /** Runs the sweep across every Branch. Returns the number of new flags
   * raised, the unit `main.ts`'s dispatcher logs on completion. */
  async run(): Promise<number> {
    const branches = await this.repository.listBranches();
    let flaggedCount = 0;
    for (const branch of branches) {
      flaggedCount += await this.sweepBranch(branch.id);
    }
    return flaggedCount;
  }

  private async sweepBranch(branchId: string): Promise<number> {
    const { n, m } = await this.repository.getThresholds(branchId);
    const memberships = await this.repository.listActiveBacentaMemberships(branchId);
    const recentMainServiceGatheringIds = await this.repository.listRecentMainServiceGatheringIds(branchId, n);

    let flaggedCount = 0;
    for (const membership of memberships) {
      const recentBacentaGatheringIds = await this.repository.listRecentBacentaGatheringIds(membership.groupId, m);
      const [recentGatheringAttendedCount, recentBacentaAttendedCount] = await Promise.all([
        this.repository.countPresentAttendance(membership.personId, recentMainServiceGatheringIds),
        this.repository.countPresentAttendance(membership.personId, recentBacentaGatheringIds),
      ]);

      const outcome = evaluateSilentDrift({
        hasActiveBacentaAssignment: true,
        recentGatheringAttendedCount,
        attendanceThreshold: n,
        recentBacentaAttendedCount,
        bacentaThreshold: m,
      });

      if (!outcome.flagged) {
        continue;
      }

      const existingFlag = await this.repository.findOpenFlag(membership.personId);
      if (existingFlag) {
        this.logger.info({ personId: membership.personId }, 'Silent drift confirmed but an open flag already exists - no-op');
        continue;
      }

      const flag = await this.repository.createFlag({
        branchId,
        groupId: membership.groupId,
        personId: membership.personId,
        attendanceMissedCount: outcome.attendanceMissedCount ?? 0,
        attendanceThreshold: n,
        bacentaMissedCount: outcome.bacentaMissedCount ?? 0,
        bacentaThreshold: m,
      });

      await this.publisher.publish({
        eventId: randomUUID(),
        eventType: SilentDriftSweepJob.SIGNAL_TYPE,
        schemaVersion: SilentDriftSweepJob.SCHEMA_VERSION,
        branchId,
        occurredAt: new Date().toISOString(),
        subjectPersonId: membership.personId,
        subjectGroupId: membership.groupId,
        payload: {
          silentDriftFlagId: flag.id,
          attendanceMissedCount: flag.attendanceMissedCount,
          attendanceThreshold: flag.attendanceThreshold,
          bacentaMissedCount: flag.bacentaMissedCount,
          bacentaThreshold: flag.bacentaThreshold,
        },
      });

      flaggedCount += 1;
    }
    return flaggedCount;
  }
}
