import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { evaluateAttendanceCompleteness } from '@ecclesia/domain-gatherings';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { AttendanceCompletenessSweepRepository } from './attendance-completeness-sweep.repository';
import { EventBridgePublisherService } from '../../platform/events/eventbridge-publisher.service';

/** How far back the sweep looks for Gatherings to re-examine (see
 * `AttendanceCompletenessSweepRepository.listRecentlyEndedGatherings`'s
 * own doc comment). **[INFERRED]**, not a citation - generous relative to
 * `evaluateAttendanceCompleteness()`'s own 48-hour default window, chosen
 * so the sweep still catches a Gathering whose completeness window closed
 * a while ago but was never resolved, without scanning unbounded history. */
export const DEFAULT_COMPLETENESS_SWEEP_LOOKBACK_DAYS = 14;

/**
 * The attendance-completeness sweep (Blueprint §10.8; FR-GTH-05/§16.4:
 * "flag Gatherings with no attendance recorded past the configured
 * window... a reminder surfaced to the relevant leader"). This is the
 * Branch-wide sweep `GATHERINGS_DESIGN_NOTES.md`'s own "what this
 * milestone deliberately does not build" section named by description
 * ("no scheduled sweep job, no aggregate 'all incomplete Gatherings this
 * week' query, and no notification delivery mechanism") -
 * `AttendanceRecordService.checkCompleteness()` (`apps/api/src/modules/
 * gatherings`) already evaluates one named Gathering on request; this job
 * runs that same pure function (`evaluateAttendanceCompleteness()`,
 * `libs/domain/gatherings`) across every recently-ended Gathering in
 * every Branch, unprompted.
 *
 * Same "detect and signal, don't invent a notification mechanism" pattern
 * as `FollowUpSlaSweepJob`: publishes a synthetic
 * `gatherings.attendance_incomplete` Engagement Signal per incomplete
 * Gathering found (Blueprint §10.8), rather than mutating `Gathering`
 * itself (no "flagged incomplete" field exists on that model, and adding
 * one is outside this milestone's scope) or inventing the "reminder
 * surfaced to the relevant leader" delivery FR-GTH-05 describes -
 * `notification-consumer`'s own doc comment already discloses why no real
 * delivery channel exists yet anywhere in this codebase. Re-publishes
 * every run for as long as a Gathering remains within the lookback window
 * and still has no attendance recorded - the same disclosed "keep
 * reminding, no persisted dedup marker" reasoning
 * `FollowUpSlaSweepJob`'s own doc comment gives, for the identical
 * "no schema field to record 'already signaled'" reason.
 */
@Injectable()
export class AttendanceCompletenessSweepJob {
  static readonly SIGNAL_TYPE = 'gatherings.attendance_incomplete';
  static readonly SCHEMA_VERSION = 1;

  constructor(
    private readonly repository: AttendanceCompletenessSweepRepository,
    private readonly publisher: EventBridgePublisherService,
    @InjectPinoLogger(AttendanceCompletenessSweepJob.name) private readonly logger: PinoLogger,
  ) {}

  /** Returns the number of incomplete Gatherings signaled. */
  async run(): Promise<number> {
    const branches = await this.repository.listBranches();
    let incompleteCount = 0;
    for (const branch of branches) {
      incompleteCount += await this.sweepBranch(branch.id);
    }
    return incompleteCount;
  }

  private async sweepBranch(branchId: string): Promise<number> {
    const now = new Date();
    const gatherings = await this.repository.listRecentlyEndedGatherings(branchId, now, DEFAULT_COMPLETENESS_SWEEP_LOOKBACK_DAYS);

    let incompleteCount = 0;
    for (const gathering of gatherings) {
      const hasAttendanceRecorded = await this.repository.hasAttendanceRecorded(gathering.id);
      const outcome = evaluateAttendanceCompleteness({ scheduledEnd: gathering.scheduledEnd, hasAttendanceRecorded, now });
      if (!outcome.incomplete) {
        continue;
      }

      await this.publisher.publish({
        eventId: randomUUID(),
        eventType: AttendanceCompletenessSweepJob.SIGNAL_TYPE,
        schemaVersion: AttendanceCompletenessSweepJob.SCHEMA_VERSION,
        branchId,
        occurredAt: now.toISOString(),
        subjectGroupId: gathering.ownerGroupId ?? undefined,
        payload: {
          gatheringId: gathering.id,
          // `scheduledEnd` is guaranteed non-null here - the repository
          // query only ever returns rows where `scheduledEnd IS NOT NULL`.
          scheduledEnd: gathering.scheduledEnd?.toISOString(),
        },
      });
      this.logger.info({ gatheringId: gathering.id }, 'Attendance-completeness gap signaled');
      incompleteCount += 1;
    }
    return incompleteCount;
  }
}
