import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SQSClient } from '@aws-sdk/client-sqs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { WorkerAuditLogRepository } from './audit-log.repository';
import type { EnvConfig } from '../../platform/config/env.schema';
import { ProcessedEventRepository } from '../../platform/events/processed-event.repository';
import { SQS_CLIENT } from '../../platform/events/sqs-client.provider';
import { SqsConsumerBase } from '../../platform/events/sqs-consumer.base';

/**
 * The `audit-consumer` SQS consumer (Blueprint §10.2). Writes every
 * Engagement Signal that reaches it to `platform.audit_log`, giving the
 * whole Engagement Signal stream the same long-retention, "who/what
 * happened to church data" durable record Blueprint §12.1 already
 * describes that table as (see
 * `apps/api/src/platform/audit/audit-log.service.ts`'s own doc comment).
 *
 * **`actorUserId` is always omitted, deliberately, not merely absent.**
 * Every existing `platform.audit_log` writer (`AuthGuard`,
 * `RbacAuditInterceptor`) records the authenticated `platform.users` row
 * responsible for the logged event. An Engagement Signal on the bus has
 * no equivalent - `EngagementSignalEnvelope` (Blueprint §10.3) carries a
 * `subjectPersonId` (who the signal is *about*) and `branchId`, never an
 * originating `User`. Treating `subjectPersonId` as `actorUserId` would
 * misrepresent "this is what happened to this Person" as "this Person did
 * this," which is not what the envelope means. `action` carries the
 * signal's own `eventType` instead - the closest honest equivalent to
 * "what happened" without an actor to attribute it to.
 */
@Injectable()
export class AuditConsumer extends SqsConsumerBase {
  static readonly CONSUMER_NAME = 'audit-consumer';

  constructor(
    @Inject(SQS_CLIENT) sqsClient: SQSClient,
    configService: ConfigService<EnvConfig, true>,
    processedEventRepository: ProcessedEventRepository,
    @InjectPinoLogger(AuditConsumer.name) logger: PinoLogger,
    private readonly auditLogRepository: WorkerAuditLogRepository,
  ) {
    super(sqsClient, configService.get('SQS_AUDIT_QUEUE_URL', { infer: true }), AuditConsumer.CONSUMER_NAME, processedEventRepository, logger);
  }

  protected async handle(envelope: EngagementSignalEnvelope): Promise<void> {
    await this.auditLogRepository.record({
      branchId: envelope.branchId,
      action: envelope.eventType,
      resourceType: 'EngagementSignal',
      resourceId: envelope.eventId,
      occurredAt: new Date(envelope.occurredAt),
    });
  }
}
