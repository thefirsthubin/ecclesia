import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SQSClient } from '@aws-sdk/client-sqs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';
import type { Prisma } from '@prisma/client';

import { WorkerEngagementSignalRepository } from './engagement-signal.repository';
import type { EnvConfig } from '../../platform/config/env.schema';
import { ProcessedEventRepository } from '../../platform/events/processed-event.repository';
import { SQS_CLIENT } from '../../platform/events/sqs-client.provider';
import { SqsConsumerBase } from '../../platform/events/sqs-consumer.base';

/**
 * The `insights-consumer` SQS consumer (Blueprint §10.2). Every
 * Engagement Signal on the bus is relevant to Insights - Blueprint §4.3
 * rule 3 ("Insights depends only on the Engagement Signal stream") and
 * §12.8's flowchart both describe Insights as the one context that
 * ingests the whole stream, not a filtered subset - so `handle()` writes
 * every envelope it receives to `insights.engagement_signals` with no
 * `eventType` filtering, mirroring exactly what
 * `apps/api`'s `EngagementSignalService.record()` already does for a
 * (currently nonexistent) synchronous caller - see that service's own
 * doc comment: "This service is the landing point that future consumer
 * would call once it exists." This is that consumer.
 */
@Injectable()
export class InsightsConsumer extends SqsConsumerBase {
  static readonly CONSUMER_NAME = 'insights-consumer';

  constructor(
    @Inject(SQS_CLIENT) sqsClient: SQSClient,
    configService: ConfigService<EnvConfig, true>,
    processedEventRepository: ProcessedEventRepository,
    @InjectPinoLogger(InsightsConsumer.name) logger: PinoLogger,
    private readonly engagementSignalRepository: WorkerEngagementSignalRepository,
  ) {
    super(sqsClient, configService.get('SQS_INSIGHTS_QUEUE_URL', { infer: true }), InsightsConsumer.CONSUMER_NAME, processedEventRepository, logger);
  }

  protected async handle(envelope: EngagementSignalEnvelope): Promise<void> {
    await this.engagementSignalRepository.create({
      branchId: envelope.branchId,
      personId: envelope.subjectPersonId,
      groupId: envelope.subjectGroupId,
      signalType: envelope.eventType,
      payload: envelope.payload as Prisma.InputJsonValue,
      occurredAt: new Date(envelope.occurredAt),
    });
  }
}
