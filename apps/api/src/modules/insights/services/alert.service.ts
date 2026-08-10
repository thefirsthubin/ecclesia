import { randomUUID } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import type { AlertResponseDto, PublishableEngagementSignal, ResolveAlertInput } from '@ecclesia/contracts';
import { DEFAULT_PULSE_TREND_WINDOW_DAYS, evaluatePulseTrend } from '@ecclesia/domain-insights';
import type { Alert, PulseScoreScopeType } from '@prisma/client';

import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
import { AlertRepository } from '../repositories/alert.repository';
import { PulseScoreHistoryRepository } from '../repositories/pulse-score-history.repository';

/** The one alert type this milestone raises - FR-INS-03 names only the
 * trend-decline case; §16.6's capabilities table names no other alert
 * category for Release 1. */
const PULSE_DECLINE_ALERT_TYPE = 'PULSE_DECLINE';

function toResponseDto(alert: Alert): AlertResponseDto {
  return {
    id: alert.id,
    branchId: alert.branchId,
    scopeType: alert.scopeType,
    scopeId: alert.scopeId,
    alertType: alert.alertType,
    message: alert.message,
    status: alert.status,
    resolvedByPersonId: alert.resolvedByPersonId,
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
    triggeredAt: alert.triggeredAt.toISOString(),
  };
}

/**
 * FR-INS-03 (trend/threshold alerting) and FR-INS-05 (record whether a
 * leader acted on or dismissed an alert).
 */
@Injectable()
export class AlertService {
  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly pulseScoreHistoryRepository: PulseScoreHistoryRepository,
    private readonly eventPublisher: EventBridgePublisherService,
  ) {}

  /**
   * Called by `PulseScoreService` immediately after it appends a fresh
   * `PulseScoreHistory` point - evaluates the trailing-window trend via
   * `evaluatePulseTrend()` and raises a new Alert only if (a) the trend
   * has genuinely declined past the threshold and (b) no `OPEN` alert of
   * this type already exists for this scope
   * (`AlertRepository.hasOpenAlert`'s dedup). No scheduler exists in this
   * codebase to run this evaluation on its own cadence - every dashboard
   * read that happens to recompute the score is this evaluation's only
   * trigger. See `INSIGHTS_DESIGN_NOTES.md`.
   */
  async evaluateAndCreateIfNeeded(
    branchId: string,
    scopeType: PulseScoreScopeType,
    scopeId: string,
    now: Date,
  ): Promise<void> {
    const since = new Date(now.getTime() - DEFAULT_PULSE_TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const history = await this.pulseScoreHistoryRepository.findRecentByScope(scopeType, scopeId, since);
    const evaluation = evaluatePulseTrend(
      history.map((point) => ({ score: point.score.toNumber(), computedAt: point.computedAt })),
      now,
    );
    if (!evaluation.declined) {
      return;
    }

    const alreadyOpen = await this.alertRepository.hasOpenAlert(scopeType, scopeId, PULSE_DECLINE_ALERT_TYPE);
    if (alreadyOpen) {
      return;
    }

    await this.alertRepository.create({
      branchId,
      scopeType,
      scopeId,
      alertType: PULSE_DECLINE_ALERT_TYPE,
      message: evaluation.reason,
    });
  }

  async listForScope(scopeType: PulseScoreScopeType, scopeId: string): Promise<AlertResponseDto[]> {
    const alerts = await this.alertRepository.listByScope(scopeType, scopeId);
    return alerts.map(toResponseDto);
  }

  async getById(id: string): Promise<AlertResponseDto> {
    const alert = await this.requireAlert(id);
    return toResponseDto(alert);
  }

  /** FR-INS-05: "each alert has a recorded resolution status (acted /
   * dismissed) attributable to the responding user" - `actorPersonId`
   * always comes from `ActorContext`, never a client-supplied field. */
  async resolve(actorPersonId: string, id: string, input: ResolveAlertInput): Promise<AlertResponseDto> {
    await this.requireAlert(id);
    const resolved = await this.alertRepository.resolve(id, {
      status: input.status,
      resolvedByPersonId: actorPersonId,
      resolvedAt: new Date(),
    });

    // `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
    // `insights.alert_action_recorded` (Leadership engagement category -
    // the one category in the six-signal catalog whose source is Insights
    // itself, not another domain: a leader's own responsiveness to alerts
    // is treated as an engagement signal in its own right). `resolved.status`
    // is always `'ACTED'` or `'DISMISSED'` here (`ResolveAlertInput`'s
    // `status` enum, `libs/contracts/src/lib/insights.schemas.ts`) - never
    // `'OPEN'`, since `resolve()` only ever transitions out of it.
    const envelope: PublishableEngagementSignal = {
      eventId: randomUUID(),
      eventType: 'insights.alert_action_recorded',
      schemaVersion: 1,
      branchId: resolved.branchId,
      occurredAt: (resolved.resolvedAt ?? new Date()).toISOString(),
      subjectPersonId: actorPersonId,
      payload: { alertId: resolved.id, action: resolved.status === 'ACTED' ? 'acted' : 'dismissed' },
    };
    await this.eventPublisher.publish(envelope);

    return toResponseDto(resolved);
  }

  private async requireAlert(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findById(id);
    if (!alert) {
      throw new NotFoundException(`No Alert found with id '${id}'`);
    }
    return alert;
  }
}
